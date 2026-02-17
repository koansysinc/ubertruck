# Data Dictionary and Inter-Service Communication Contracts
## Ubertruck MVP - Service Integration Specifications
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document defines comprehensive inter-service communication contracts between all microservices, establishing explicit API contracts, payload schemas, latency requirements, and retry policies to prevent integration failures during Sprint 5 integration phase.

## 1. Service Communication Matrix

### 1.1 Service Dependency Map

```yaml
Service Dependencies:
  User Service (3001):
    Depends on: None
    Called by: All services for authentication

  Fleet Service (3002):
    Depends on: User Service (auth)
    Called by: Booking Service (availability)

  Booking Service (3003):
    Depends on: User Service (auth), Fleet Service (trucks), Payment Service (pricing)
    Called by: Route Service (status updates)

  Route & Tracking Service (3004):
    Depends on: Booking Service (booking details)
    Called by: None

  Payment Service (3005):
    Depends on: User Service (GST info), Booking Service (billing)
    Called by: Booking Service (pricing)

  Admin Service (3006):
    Depends on: All services (monitoring)
    Called by: None
```

## 2. Inter-Service API Contracts

### 2.1 User Service → Other Services

#### Authentication Token Validation

```typescript
// CONTRACT: Auth Token Validation
interface AuthValidationContract {
  endpoint: "GET /internal/auth/validate";
  request: {
    headers: {
      "X-Internal-Token": string;  // Internal service token
      "Authorization": string;      // Bearer token to validate
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        valid: boolean;
        userId: string;
        userType: "SHIPPER" | "CARRIER" | "ADMIN";
        gstNumber?: string;
        phoneNumber: string;
        expiresAt: Date;
      };
    };
    failure: {
      status: 401 | 403 | 500;
      body: StandardErrorResponse;
    };
  };
  sla: {
    timeout: 500;  // ms
    retries: 2;
    backoff: "exponential";
  };
}
```

#### User Details Retrieval

```typescript
// CONTRACT: Get User Details
interface UserDetailsContract {
  endpoint: "GET /internal/users/{userId}";
  request: {
    headers: {
      "X-Internal-Token": string;
    };
    params: {
      userId: string;
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        id: string;
        phoneNumber: string;
        businessName: string;
        userType: string;
        gstNumber?: string;
        address: {
          street: string;
          city: string;
          state: string;
          pincode: string;
        };
        bankDetails?: {
          accountNumber: string;
          ifscCode: string;
          verified: boolean;
        };
      };
    };
  };
  sla: {
    timeout: 1000;
    retries: 3;
    cache: {
      ttl: 300;  // 5 minutes
      key: "user:{userId}";
    };
  };
}
```

### 2.2 Fleet Service → Booking Service

#### Truck Availability Check

```typescript
// CONTRACT: Check Truck Availability
interface TruckAvailabilityContract {
  endpoint: "POST /internal/fleet/availability";
  request: {
    headers: {
      "X-Internal-Token": string;
      "X-Request-ID": string;  // For tracing
    };
    body: {
      pickupLocation: {
        lat: number;
        lng: number;
        pincode: string;
      };
      deliveryLocation: {
        lat: number;
        lng: number;
        pincode: string;
      };
      pickupTime: Date;
      requiredCapacity: number;  // in tonnes
      cargoType: string;
      preferredCarrierId?: string;
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        available: boolean;
        trucks: Array<{
          truckId: string;
          carrierId: string;
          registrationNumber: string;
          capacity: number;
          currentLocation: {
            lat: number;
            lng: number;
          };
          estimatedArrivalTime: Date;
          driverId?: string;
          pricePerKm: number;
        }>;
        totalAvailable: number;
        searchRadius: number;  // km
      };
    };
  };
  sla: {
    timeout: 2000;  // Complex geo query
    retries: 1;
    fallback: {
      strategy: "expand-radius";
      maxRadius: 100;  // km
    };
  };
}
```

#### Truck Assignment

```typescript
// CONTRACT: Assign Truck to Booking
interface TruckAssignmentContract {
  endpoint: "POST /internal/fleet/assign";
  request: {
    headers: {
      "X-Internal-Token": string;
      "X-Idempotency-Key": string;  // Prevent double assignment
    };
    body: {
      bookingId: string;
      truckId: string;
      driverId?: string;
      pickupTime: Date;
      estimatedDeliveryTime: Date;
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        assigned: boolean;
        assignmentId: string;
        truckDetails: {
          registrationNumber: string;
          capacity: number;
          driverName?: string;
          driverPhone?: string;
        };
      };
    };
    failure: {
      status: 409;  // Already assigned
      body: {
        error: {
          code: "TRUCK_ALREADY_ASSIGNED";
          message: string;
          currentBookingId: string;
        };
      };
    };
  };
  sla: {
    timeout: 1500;
    retries: 0;  // No retry for assignments
    transaction: true;  // Requires DB transaction
  };
}
```

### 2.3 Booking Service → Payment Service

#### Price Calculation

```typescript
// CONTRACT: Calculate Booking Price
interface PriceCalculationContract {
  endpoint: "POST /internal/payment/calculate-price";
  request: {
    headers: {
      "X-Internal-Token": string;
    };
    body: {
      distance: number;  // km
      weight: number;    // tonnes
      vehicleType: "TRUCK" | "MINI_TRUCK" | "TRAILER";
      cargoType: string;
      pickupPincode: string;
      deliveryPincode: string;
      surcharges?: {
        fuelSurcharge?: boolean;
        nightDelivery?: boolean;
        urgentDelivery?: boolean;
      };
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        basePrice: number;
        fuelSurcharge: number;
        gst: {
          cgst: number;
          sgst: number;
          igst: number;
          taxableAmount: number;
        };
        totalAmount: number;
        priceBreakdown: {
          ratePerKm: number;
          ratePerTonne: number;
          minimumCharge: number;
        };
        validUntil: Date;
      };
    };
  };
  sla: {
    timeout: 500;
    retries: 2;
    cache: {
      ttl: 60;  // 1 minute price cache
      key: "price:{hash}";
    };
  };
}
```

#### Invoice Generation

```typescript
// CONTRACT: Generate Invoice
interface InvoiceGenerationContract {
  endpoint: "POST /internal/payment/generate-invoice";
  request: {
    headers: {
      "X-Internal-Token": string;
      "X-Idempotency-Key": string;
    };
    body: {
      bookingId: string;
      shipperId: string;
      carrierId: string;
      amount: number;
      gstDetails: {
        shipperGst: string;
        carrierGst: string;
        hsnCode: string;
      };
      bookingDetails: {
        pickupAddress: string;
        deliveryAddress: string;
        distance: number;
        weight: number;
        vehicleNumber: string;
      };
      ewayBillNumber?: string;
    };
  };
  response: {
    success: {
      status: 201;
      body: {
        invoiceNumber: string;
        invoiceUrl: string;
        pdfUrl: string;
        createdAt: Date;
        dueDate: Date;
        paymentStatus: "PENDING" | "PAID";
      };
    };
  };
  sla: {
    timeout: 3000;  // PDF generation
    retries: 1;
    async: true;  // Can be processed async
  };
}
```

### 2.4 Route Service → Booking Service

#### Status Update

```typescript
// CONTRACT: Update Booking Status
interface StatusUpdateContract {
  endpoint: "PUT /internal/bookings/{bookingId}/status";
  request: {
    headers: {
      "X-Internal-Token": string;
      "X-Driver-ID": string;
    };
    params: {
      bookingId: string;
    };
    body: {
      status: "PICKUP_STARTED" | "IN_TRANSIT" | "DELIVERED" | "COMPLETED";
      timestamp: Date;
      location?: {
        lat: number;
        lng: number;
      };
      podImage?: string;  // Base64
      notes?: string;
    };
  };
  response: {
    success: {
      status: 200;
      body: {
        updated: boolean;
        currentStatus: string;
        nextAllowedStatuses: string[];
        notificationsSent: {
          sms: boolean;
          push: boolean;
          email: boolean;
        };
      };
    };
  };
  sla: {
    timeout: 2000;
    retries: 3;
    queue: {
      enabled: true;  // Queue if offline
      maxSize: 50;
      ttl: 86400;  // 24 hours
    };
  };
}
```

## 3. Common Data Models

### 3.1 Shared Entities

```typescript
// Location Model (used across all services)
interface Location {
  lat: number;           // Decimal(10,8)
  lng: number;           // Decimal(11,8)
  address?: string;
  landmark?: string;
  pincode: string;       // 6 digits
  city?: string;
  state?: string;
  plusCode?: string;     // Google Plus Code
}

// Contact Person Model
interface ContactPerson {
  name: string;
  phoneNumber: string;   // +91XXXXXXXXXX format
  alternatePhone?: string;
}

// Cargo Details Model
interface CargoDetails {
  type: "GENERAL" | "FRAGILE" | "HAZMAT" | "PERISHABLE" | "HEAVY";
  weight: number;        // tonnes
  volume?: number;       // cubic meters
  packages?: number;
  description: string;
  value?: number;        // for insurance
  hsnCode?: string;      // for E-Way Bill
}

// Vehicle Model
interface Vehicle {
  id: string;
  registrationNumber: string;  // TG01AB1234 format
  type: "TRUCK" | "MINI_TRUCK" | "TRAILER" | "CONTAINER";
  capacity: number;      // tonnes
  make?: string;
  model?: string;
  year?: number;
  fitnessValid: Date;
  permitValid: Date;
  insuranceValid: Date;
  gpsEnabled: boolean;
}

// Driver Model
interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseValidUpto: Date;
  bloodGroup?: string;
  emergencyContact?: ContactPerson;
}
```

### 3.2 Standard Response Formats

```typescript
// Pagination Response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
  links: {
    first: string;
    prev?: string;
    next?: string;
    last: string;
  };
}

// Bulk Operation Response
interface BulkOperationResponse {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    data: any;
  }>;
}

// Health Check Response
interface HealthCheckResponse {
  service: string;
  version: string;
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;  // seconds
  dependencies: Array<{
    name: string;
    status: "up" | "down";
    latency?: number;  // ms
  }>;
  timestamp: Date;
}
```

## 4. Event-Driven Communication

### 4.1 Event Bus Configuration

```yaml
Event Bus:
  Type: Redis Pub/Sub
  Channels:
    - booking.created
    - booking.assigned
    - booking.cancelled
    - status.updated
    - payment.received
    - truck.available
    - driver.assigned
```

### 4.2 Event Schemas

```typescript
// Booking Created Event
interface BookingCreatedEvent {
  eventType: "booking.created";
  timestamp: Date;
  correlationId: string;
  payload: {
    bookingId: string;
    shipperId: string;
    pickupLocation: Location;
    deliveryLocation: Location;
    pickupTime: Date;
    cargoDetails: CargoDetails;
  };
  metadata: {
    version: "1.0";
    source: "booking-service";
  };
}

// Status Updated Event
interface StatusUpdatedEvent {
  eventType: "status.updated";
  timestamp: Date;
  correlationId: string;
  payload: {
    bookingId: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    location?: Location;
    podUrl?: string;
  };
  metadata: {
    version: "1.0";
    source: "route-service";
  };
}

// Payment Received Event
interface PaymentReceivedEvent {
  eventType: "payment.received";
  timestamp: Date;
  correlationId: string;
  payload: {
    bookingId: string;
    invoiceNumber: string;
    amount: number;
    paymentMode: string;
    transactionId: string;
  };
  metadata: {
    version: "1.0";
    source: "payment-service";
  };
}
```

## 5. Service Communication Patterns

### 5.1 Synchronous Patterns

```yaml
Request-Response:
  Use Case: Real-time data needs
  Examples:
    - Authentication validation
    - Price calculation
    - Availability check

Circuit Breaker:
  Open Threshold: 50% failure rate
  Time Window: 60 seconds
  Half-Open Attempts: 3
  Reset Timeout: 30 seconds

Timeout Strategy:
  Fast Operations: 500ms (auth, cache reads)
  Normal Operations: 1-2s (database queries)
  Complex Operations: 3-5s (geo queries, PDF generation)
```

### 5.2 Asynchronous Patterns

```yaml
Event Sourcing:
  Use Case: Audit trail, status updates
  Storage: PostgreSQL event_store table
  Retention: 90 days

Message Queue:
  Use Case: Offline-capable operations
  Implementation: Redis LIST with RPOPLPUSH
  Max Queue Size: 1000 per service
  DLQ Threshold: 5 retries

Saga Pattern:
  Use Case: Booking creation flow
  Steps:
    1. Create booking record
    2. Check truck availability
    3. Calculate price
    4. Assign truck
    5. Send notifications
  Compensation: Reverse each step on failure
```

## 6. Data Consistency Rules

### 6.1 Transaction Boundaries

```yaml
Strong Consistency Required:
  - Payment transactions
  - Truck assignments
  - Booking status transitions
  - Invoice generation

Eventual Consistency Acceptable:
  - Notification delivery
  - Analytics aggregation
  - Search index updates
  - Cache synchronization
```

### 6.2 Idempotency Requirements

```typescript
// Idempotent Operations Configuration
interface IdempotencyConfig {
  operations: {
    createBooking: {
      key: "shipper:{shipperId}:booking:{hash}";
      ttl: 86400;  // 24 hours
    };
    assignTruck: {
      key: "booking:{bookingId}:assign";
      ttl: 3600;   // 1 hour
    };
    generateInvoice: {
      key: "booking:{bookingId}:invoice";
      ttl: 0;      // Permanent
    };
    updateStatus: {
      key: "booking:{bookingId}:status:{status}";
      ttl: 3600;   // 1 hour
    };
  };
}
```

## 7. Service Level Agreements (SLAs)

### 7.1 Latency Requirements

| Operation | P50 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|
| Auth Validation | 50ms | 100ms | 200ms | 500ms |
| Booking Creation | 200ms | 500ms | 1s | 2s |
| Availability Check | 300ms | 800ms | 1.5s | 3s |
| Status Update | 100ms | 300ms | 500ms | 1s |
| Invoice Generation | 500ms | 2s | 3s | 5s |

### 7.2 Availability Targets

```yaml
Service Availability:
  User Service: 99.95%       # ~22 min downtime/month
  Fleet Service: 99.9%       # ~44 min downtime/month
  Booking Service: 99.95%    # ~22 min downtime/month
  Route Service: 99.5%       # ~3.6 hours downtime/month
  Payment Service: 99.99%    # ~4 min downtime/month
  Admin Service: 99%         # ~7.3 hours downtime/month
```

## 8. Error Handling Contracts

### 8.1 Standard Error Response

```typescript
interface ServiceErrorResponse {
  error: {
    code: string;           // Service-specific error code
    message: string;        // Human-readable message
    service: string;        // Originating service
    timestamp: Date;
    requestId: string;
    details?: {
      field?: string;       // For validation errors
      reason?: string;
      suggestion?: string;
    };
    downstream?: {          // If error from another service
      service: string;
      error: string;
      statusCode: number;
    };
  };
}
```

### 8.2 Retry Configuration

```yaml
Retry Strategies:
  Exponential Backoff:
    Base: 100ms
    Multiplier: 2
    Max: 10s
    Jitter: 0-100ms

  Linear Backoff:
    Interval: 500ms
    Max Attempts: 3

  No Retry:
    - Payment processing
    - Truck assignment
    - Idempotent operations
```

## 9. Security Contracts

### 9.1 Inter-Service Authentication

```typescript
// Internal Service Token
interface InternalServiceToken {
  algorithm: "HS256";
  payload: {
    service: string;
    version: string;
    permissions: string[];
    iat: number;
    exp: number;  // 5 minutes
  };
  header: {
    "X-Internal-Token": string;
    "X-Service-Name": string;
    "X-Service-Version": string;
  };
}

// Token Rotation
interface TokenRotation {
  primary: string;    // Current token
  secondary: string;  // Previous token (grace period)
  rotationInterval: 3600;  // 1 hour
  graceperiod: 300;   // 5 minutes
}
```

### 9.2 Data Encryption

```yaml
In-Transit:
  Protocol: TLS 1.3
  Cipher Suites:
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
  Certificate: Internal CA signed

At-Rest:
  Sensitive Fields:
    - phoneNumber: AES-256-GCM
    - bankAccount: AES-256-GCM
    - gstNumber: Hashed (SHA-256)
  Key Management: AWS KMS / HashiCorp Vault
```

## 10. Monitoring & Observability

### 10.1 Distributed Tracing

```typescript
// Trace Context
interface TraceContext {
  headers: {
    "X-Request-ID": string;      // Unique request ID
    "X-Correlation-ID": string;  // Business transaction ID
    "X-Parent-Span": string;      // Parent span ID
    "X-Trace-ID": string;         // Distributed trace ID
  };
  baggage: {
    userId?: string;
    bookingId?: string;
    serviceVersion: string;
  };
}
```

### 10.2 Metrics Collection

```yaml
Required Metrics:
  - Request rate (req/sec)
  - Error rate (errors/sec)
  - Latency (p50, p95, p99)
  - Active connections
  - Queue depth
  - Circuit breaker state

Service-Specific:
  Booking Service:
    - Bookings created/hour
    - Assignment success rate
    - Cancellation rate

  Fleet Service:
    - Truck utilization %
    - Average search radius
    - Assignment latency

  Payment Service:
    - Invoice generation time
    - Settlement success rate
    - GST calculation errors
```

## 11. Migration & Versioning

### 11.1 API Versioning Strategy

```yaml
Versioning:
  Strategy: URL path versioning
  Format: /api/v{major}/resource
  Deprecation: 6 months notice
  Sunset: 3 months after deprecation

Backward Compatibility:
  - Support 2 major versions
  - No breaking changes in minor versions
  - Feature flags for gradual rollout
```

### 11.2 Schema Evolution

```typescript
// Schema Versioning
interface SchemaVersion {
  version: string;  // semver format
  changes: Array<{
    type: "ADD_FIELD" | "REMOVE_FIELD" | "RENAME_FIELD" | "TYPE_CHANGE";
    field: string;
    description: string;
    migration?: string;  // SQL or script
  }>;
  compatible: {
    forward: boolean;   // New can read old
    backward: boolean;  // Old can read new
  };
}
```

## 12. Integration Testing Contracts

### 12.1 Contract Testing

```yaml
Test Coverage:
  - All inter-service endpoints
  - All event schemas
  - All error scenarios
  - Timeout behaviors
  - Circuit breaker triggers

Tools:
  - Pact for consumer-driven contracts
  - Postman collections for API tests
  - K6 for load testing contracts
```

### 12.2 Test Data Contracts

```typescript
// Test Data Requirements
interface TestDataContract {
  service: string;
  datasets: {
    minimal: any;      // Minimum required fields
    typical: any;      // Common use case
    edge: any;         // Edge cases
    invalid: any;      // For negative testing
  };
  cleanup: string[];   // Cleanup queries
  seed: string[];      // Seed data queries
}
```

---

*This Data Dictionary must be maintained and versioned alongside the codebase to ensure consistent inter-service communication throughout the development lifecycle.*