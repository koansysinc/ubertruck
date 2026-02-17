# Error Flows and Exception Handling Specifications
## Comprehensive Error Management for Ubertruck MVP
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document defines comprehensive error flows and exception handling mechanisms to address the critical gap of missing error specifications in the original SRS, covering 25 primary error scenarios across all services.

## 1. Error Classification Framework

### 1.1 Error Categories

```typescript
enum ErrorCategory {
  VALIDATION = 'VALIDATION',        // 400 - Input validation failures
  AUTHENTICATION = 'AUTH',          // 401 - Authentication failures
  AUTHORIZATION = 'AUTHZ',          // 403 - Permission denied
  NOT_FOUND = 'NOT_FOUND',         // 404 - Resource not found
  CONFLICT = 'CONFLICT',            // 409 - State conflicts
  BUSINESS_LOGIC = 'BUSINESS',     // 422 - Business rule violations
  RATE_LIMIT = 'RATE_LIMIT',       // 429 - Too many requests
  EXTERNAL_SERVICE = 'EXTERNAL',   // 502 - Third-party failures
  INTERNAL = 'INTERNAL',            // 500 - System errors
  TIMEOUT = 'TIMEOUT'               // 504 - Operation timeout
}

interface StandardErrorResponse {
  error: {
    code: string;           // e.g., "USR_OTP_MAX_ATTEMPTS"
    category: ErrorCategory;
    message: string;        // User-friendly message
    details?: any;          // Additional context
    timestamp: Date;
    requestId: string;      // For tracking
    retryAfter?: number;    // For rate limiting
  };
}
```

## 2. User Service Error Flows

### 2.1 Registration Errors

```yaml
ERROR: USR_PHONE_DUPLICATE
  Trigger: Phone number already registered
  Response:
    Code: 409 (Conflict)
    Message: "This phone number is already registered"
    Action: Prompt user to login instead
    Retry: Not applicable

ERROR: USR_OTP_MAX_ATTEMPTS
  Trigger: >3 failed OTP attempts
  Response:
    Code: 429 (Too Many Requests)
    Message: "Maximum OTP attempts exceeded. Please try after 15 minutes"
    Action: Lock account for 15 minutes
    Retry: After lockout period

ERROR: USR_OTP_EXPIRED
  Trigger: OTP validation after 5 minutes
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "OTP has expired. Please request a new one"
    Action: Prompt for new OTP request
    Retry: Immediate with new OTP

ERROR: USR_GST_INVALID
  Trigger: Invalid GST number format/checksum
  Response:
    Code: 400 (Bad Request)
    Message: "Invalid GST number. Please verify and try again"
    Details: { field: "gstNumber", pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" }
    Action: Show GST format helper
    Retry: Immediate after correction
```

### 2.2 Authentication Errors

```yaml
ERROR: AUTH_TOKEN_EXPIRED
  Trigger: JWT token past expiry
  Response:
    Code: 401 (Unauthorized)
    Message: "Session expired. Please login again"
    Action: Redirect to login
    Client: Use refresh token if available

ERROR: AUTH_TOKEN_INVALID
  Trigger: Malformed or tampered JWT
  Response:
    Code: 401 (Unauthorized)
    Message: "Invalid authentication token"
    Action: Clear local storage, redirect to login
    Security: Log potential attack

ERROR: AUTH_SESSION_CONCURRENT
  Trigger: Login from new device while active session
  Response:
    Code: 409 (Conflict)
    Message: "Active session detected on another device"
    Action: Option to force logout other session
    Audit: Log all session activities
```

## 3. Fleet Service Error Flows

### 3.1 Vehicle Registration Errors

```yaml
ERROR: FLT_VEHICLE_DUPLICATE
  Trigger: Registration number already exists
  Response:
    Code: 409 (Conflict)
    Message: "Vehicle with registration {number} already registered"
    Action: Show existing vehicle details
    Resolution: Contact support if ownership dispute

ERROR: FLT_VAHAN_VERIFICATION_FAILED
  Trigger: Vahan API returns invalid/blacklisted vehicle
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Vehicle verification failed. Please check registration number"
    Details: { reason: "FITNESS_EXPIRED" | "PERMIT_INVALID" | "NOT_FOUND" }
    Action: Allow manual document upload for admin review
    Fallback: Manual verification queue

ERROR: FLT_CAPACITY_MISMATCH
  Trigger: Declared capacity != Vahan records
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Vehicle capacity mismatch with official records"
    Details: { declared: 10, official: 12 }
    Action: Use official capacity, notify user
    Audit: Flag for review
```

### 3.2 Driver Assignment Errors

```yaml
ERROR: FLT_DRIVER_UNAVAILABLE
  Trigger: Driver already assigned to another vehicle
  Response:
    Code: 409 (Conflict)
    Message: "Driver is currently assigned to vehicle {number}"
    Action: Show current assignment, option to reassign
    Business Rule: One driver per vehicle at a time

ERROR: FLT_LICENSE_EXPIRED
  Trigger: Sarathi API shows expired license
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Driver license expired on {date}"
    Action: Block driver from new assignments
    Notification: Alert driver and carrier

ERROR: FLT_LICENSE_TYPE_MISMATCH
  Trigger: License doesn't have commercial vehicle endorsement
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Driver license not valid for commercial vehicles"
    Details: { requiredClass: "HMV", actualClass: "LMV" }
    Action: Prevent assignment
    Resolution: Driver must update license
```

## 4. Booking Service Error Flows

### 4.1 Booking Creation Errors

```yaml
ERROR: BKG_NO_TRUCKS_AVAILABLE
  Trigger: No trucks available for route/time
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "No trucks available for selected route and time"
    Details: { nearestAvailable: "2024-02-15T14:00:00Z" }
    Action: Suggest alternative times
    Queue: Add to waiting list if user agrees

ERROR: BKG_ROUTE_NOT_SERVICEABLE
  Trigger: Pickup/delivery outside service area
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Location outside current service area"
    Details: { serviceArea: "Nalgonda-Miryalguda corridor" }
    Action: Collect interest for future expansion
    Analytics: Track demand for new areas

ERROR: BKG_WEIGHT_EXCEEDS_CAPACITY
  Trigger: Cargo weight > available truck capacity
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Cargo weight exceeds available truck capacity"
    Details: { requestedWeight: 25, maxAvailable: 20 }
    Action: Suggest splitting shipment
    Alternative: Show larger trucks if available

ERROR: BKG_CONCURRENT_BOOKING
  Trigger: Same user creating multiple bookings simultaneously
  Response:
    Code: 429 (Too Many Requests)
    Message: "Please complete current booking before creating another"
    Action: Show pending booking
    Rate Limit: 1 booking per 30 seconds
```

### 4.2 Cancellation Errors

```yaml
ERROR: BKG_CANCELLATION_LATE
  Trigger: Cancellation after truck dispatch
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Cancellation not allowed after truck dispatch"
    Details: { dispatchTime: "2024-02-15T10:00:00Z", cancellationFee: 500 }
    Action: Show cancellation fee, require confirmation
    Policy: Charge dry-run compensation

ERROR: BKG_ALREADY_CANCELLED
  Trigger: Attempting to cancel already cancelled booking
  Response:
    Code: 409 (Conflict)
    Message: "Booking is already cancelled"
    Details: { cancelledAt: "2024-02-15T09:30:00Z", cancelledBy: "user" }
    Action: Show cancellation details
    Idempotent: Return success to avoid confusion
```

## 5. Payment Service Error Flows

### 5.1 Invoice Generation Errors

```yaml
ERROR: PAY_INVOICE_DUPLICATE
  Trigger: Invoice already exists for booking
  Response:
    Code: 409 (Conflict)
    Message: "Invoice already generated for this booking"
    Details: { invoiceNumber: "INV-2024-0001", generatedAt: "2024-02-15T16:00:00Z" }
    Action: Return existing invoice
    Idempotent: Safe to retry

ERROR: PAY_GST_CALCULATION_FAILED
  Trigger: Unable to calculate GST (missing HSN, invalid state codes)
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "GST calculation failed. Missing required information"
    Details: { missing: ["hsnCode", "shipperState"] }
    Action: Collect missing information
    Fallback: Manual invoice generation

ERROR: PAY_EWAY_BILL_GENERATION_FAILED
  Trigger: E-Way Bill API returns error
  Response:
    Code: 502 (Bad Gateway)
    Message: "E-Way Bill generation failed. Please try again"
    Details: { apiError: "GSTIN_NOT_REGISTERED" }
    Action: Queue for retry
    Fallback: Manual E-Way Bill generation link
    Retry: Exponential backoff (1, 2, 4, 8 minutes)
```

### 5.2 Settlement Errors

```yaml
ERROR: PAY_BANK_VERIFICATION_FAILED
  Trigger: Penny drop verification fails
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "Bank account verification failed"
    Details: { reason: "ACCOUNT_CLOSED" | "INVALID_IFSC" | "NAME_MISMATCH" }
    Action: Request updated bank details
    Block: Prevent payouts until verified

ERROR: PAY_SETTLEMENT_DUPLICATE
  Trigger: Settlement already processed for period
  Response:
    Code: 409 (Conflict)
    Message: "Settlement already processed for this period"
    Details: { settlementId: "SET-2024-001", processedAt: "2024-02-15T00:00:00Z" }
    Action: Show settlement details
    Audit: Log attempted duplicate
```

## 6. External Service Error Handling

### 6.1 SMS Gateway Failures

```yaml
ERROR: EXT_SMS_DELIVERY_FAILED
  Trigger: SMS gateway returns failure
  Response:
    Code: 502 (Bad Gateway)
    Message: "SMS delivery failed. Notification sent via app"
    Fallback: In-app notification
    Retry: 3 attempts with exponential backoff
    Queue: Store for batch retry
    Alert: If >10% failure rate

Implementation:
  Primary: 2Factor SMS
  Fallback: Twilio
  Tertiary: In-app only
```

### 6.2 Maps API Failures

```yaml
ERROR: EXT_MAPS_QUOTA_EXCEEDED
  Trigger: Google Maps API quota exceeded
  Response:
    Code: 429 (Too Many Requests)
    Message: "Route calculation temporarily unavailable"
    Fallback: Use cached routes
    Cache Strategy: Store top 100 route combinations
    Recovery: Reset at midnight

ERROR: EXT_MAPS_ROUTE_NOT_FOUND
  Trigger: No route between locations
  Response:
    Code: 422 (Unprocessable Entity)
    Message: "No route found between locations"
    Action: Manual distance entry by admin
    Validation: Reasonable distance bounds
```

## 7. Network and Connectivity Errors

### 7.1 Offline Handling

```yaml
ERROR: NET_OFFLINE_QUEUE_FULL
  Trigger: >50 pending operations in offline queue
  Response:
    Code: 507 (Insufficient Storage)
    Message: "Too many pending operations. Please sync when online"
    Action: Prioritize critical operations
    Cleanup: Remove old draft bookings

ERROR: NET_SYNC_CONFLICT
  Trigger: Offline changes conflict with server state
  Response:
    Code: 409 (Conflict)
    Message: "Sync conflict detected"
    Details: { local: {...}, server: {...} }
    Resolution:
      - Last-write-wins for status updates
      - Server-wins for pricing
      - Manual resolution for bookings
```

### 7.2 Timeout Handling

```yaml
ERROR: NET_REQUEST_TIMEOUT
  Trigger: API request exceeds 30 seconds
  Response:
    Code: 504 (Gateway Timeout)
    Message: "Request timed out. Please try again"
    Client Strategy:
      - Retry with exponential backoff
      - Maximum 3 retries
      - Show offline mode after failures
```

## 8. Global Error Handling Implementation

### 8.1 Express Error Middleware

```typescript
// Global error handler
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
    method: req.method
  });

  // Prepare response
  const response: StandardErrorResponse = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      category: err.category || ErrorCategory.INTERNAL,
      message: err.isOperational ? err.message : 'An unexpected error occurred',
      timestamp: new Date(),
      requestId: req.id
    }
  };

  // Add retry header for rate limits
  if (err.category === ErrorCategory.RATE_LIMIT) {
    res.setHeader('Retry-After', err.retryAfter || 60);
    response.error.retryAfter = err.retryAfter;
  }

  // Send response
  res.status(err.statusCode || 500).json(response);

  // Alert on critical errors
  if (!err.isOperational) {
    alertService.critical({
      service: process.env.SERVICE_NAME,
      error: err.message,
      requestId: req.id
    });
  }
};
```

### 8.2 Client-Side Error Handling

```typescript
// Axios interceptor for centralized error handling
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle token expiry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    }

    // Handle offline
    if (!navigator.onLine) {
      queueRequest(originalRequest);
      return Promise.resolve({
        data: { offline: true, queued: true }
      });
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      await sleep(retryAfter * 1000);
      return axios(originalRequest);
    }

    // Show user-friendly error
    showErrorNotification(error.response?.data?.error?.message);

    return Promise.reject(error);
  }
);
```

## 9. Error Recovery Strategies

### 9.1 Retry Policies

```yaml
Retry Matrix:
  Network Errors:
    Strategy: Exponential backoff
    Attempts: 3
    Delays: [1s, 2s, 4s]

  External Service Errors:
    Strategy: Circuit breaker
    Threshold: 5 failures in 1 minute
    Cooldown: 30 seconds

  Database Deadlocks:
    Strategy: Immediate retry
    Attempts: 2
    Delay: 100ms

  Business Logic Errors:
    Strategy: No retry
    Action: User intervention required
```

### 9.2 Fallback Mechanisms

```yaml
Service Fallbacks:
  SMS Delivery:
    Primary: 2Factor
    Secondary: Twilio
    Tertiary: In-app notification

  Distance Calculation:
    Primary: Google Maps API
    Secondary: OpenStreetMap
    Tertiary: Haversine formula

  Vehicle Verification:
    Primary: Vahan API
    Secondary: Manual document upload

  Payment Processing:
    Primary: Bank transfer
    Secondary: Manual reconciliation
```

## 10. Error Monitoring and Alerting

### 10.1 Error Metrics

```yaml
Key Metrics:
  - Error rate by category
  - P95 error response time
  - Recovery success rate
  - Fallback usage rate
  - Retry exhaustion rate

Alerts:
  Critical:
    - Error rate >5% for 5 minutes
    - Authentication errors >100/minute
    - All payment errors

  Warning:
    - Error rate >2% for 10 minutes
    - External service failures >50/minute
    - Retry exhaustion >10/minute
```

### 10.2 Error Dashboard

```yaml
Dashboard Panels:
  - Real-time error rate graph
  - Error distribution by category
  - Top 10 error codes
  - Failed external service calls
  - User impact metrics
  - Recovery success rates
```

---

*This comprehensive error handling specification ensures robust error management across all services and scenarios identified in the audit.*