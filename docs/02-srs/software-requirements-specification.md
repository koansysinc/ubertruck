# Software Requirements Specification (SRS)
## Ubertruck MVP - Digital Freight Platform
### Version 1.0.0-FROZEN | Date: February 2024

> **⚠️ IMPORTANT: This document contains FROZEN requirements. No modifications allowed without formal change request and approval process.**

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a comprehensive description of the Ubertruck MVP system. It defines the functional and non-functional requirements for developers, testers, project managers, and stakeholders.

### 1.2 Scope
**Product Name**: Ubertruck MVP
**Product Vision**: A simplified digital freight booking platform for the Nalgonda-Miryalguda corridor with fixed-rate pricing.

**What the system will do**:
- Enable shipper registration and booking creation
- Facilitate truck registration and assignment
- Track booking status and delivery
- Generate invoices and manage settlements
- Provide basic analytics and reporting

**What the system will NOT do** (MVP exclusions):
- Dynamic pricing or bidding
- Real-time GPS tracking
- Multiple language support
- Mobile applications
- Automated payment processing

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| GMV | Gross Merchandise Value |
| KYC | Know Your Customer |
| MVP | Minimum Viable Product |
| OTP | One-Time Password |
| POD | Proof of Delivery |
| SRS | Software Requirements Specification |
| REST | Representational State Transfer |
| JWT | JSON Web Token |
| CRUD | Create, Read, Update, Delete |

### 1.4 References
- Vision & Requirements Document v1.0
- REST API Standards (RESTful Web Services)
- OWASP Security Guidelines
- Indian GST Compliance Requirements

### 1.5 Overview
This document is organized into:
- Section 2: Overall system description
- Section 3: Detailed functional requirements
- Section 4: REST API specifications
- Section 5: Microservice architecture details
- Section 6: Non-functional requirements
- Section 7: Use cases and data flows

---

## 2. Overall Description

### 2.1 Product Perspective

The Ubertruck MVP is a standalone web-based system that will eventually integrate with:
- SMS gateways for notifications
- Government systems for compliance (future)
- Payment gateways (future)
- GPS tracking systems (future)

**System Context Diagram (Textual)**:
```
External Entities:
├── Shippers (Create bookings)
├── Carriers (Provide trucks)
├── Drivers (Execute deliveries)
├── Admin Users (Monitor system)
├── SMS Gateway (Send notifications)
└── Bank Systems (Manual settlements)

Ubertruck System:
├── Web Interface
├── API Gateway
├── Microservices
├── Database
└── Cache Layer
```

### 2.2 Product Functions

#### Core Functionalities:
1. **User Management**: Registration, authentication, profile management
2. **Booking Management**: Create, view, track bookings
3. **Fleet Management**: Truck registration, availability management
4. **Assignment System**: Auto-assign trucks to bookings
5. **Tracking System**: Status updates, POD management
6. **Payment System**: Invoice generation, settlement tracking
7. **Admin System**: Metrics, reports, system management

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Expertise | Frequency of Use |
|------------|-------------|-------------------|------------------|
| **Shippers** | Companies booking trucks | Low | Daily |
| **Carriers** | Truck owners | Low | Daily |
| **Drivers** | Execute deliveries | Very Low | Per trip |
| **Admin** | Platform operators | Medium | Continuous |
| **Support** | Customer service | Low | As needed |

### 2.4 Operating Environment

```yaml
Client Side:
  - Modern web browsers (Chrome, Firefox)
  - Mobile responsive web
  - Minimum 2G connectivity
  - Screen size: 5" and above

Server Side:
  - Ubuntu 22.04 LTS
  - Node.js 18.x runtime
  - PostgreSQL 14 database
  - Redis 6.x cache
  - Nginx web server

Network:
  - HTTPS protocol
  - RESTful APIs
  - WebSocket for future real-time features
```

### 2.5 Design and Implementation Constraints

```yaml
Technical Constraints:
  - Single server deployment (MVP)
  - Shared database across services
  - 100 concurrent users maximum
  - 50GB storage limit

Business Constraints:
  - ₹10 lakh development budget
  - 6-week development timeline
  - English language only
  - Nalgonda-Miryalguda corridor only

Regulatory Constraints:
  - GST compliance required
  - Data localization (Indian servers)
  - Basic KYC requirements
```

### 2.6 Assumptions and Dependencies

```yaml
Assumptions:
  - Users have smartphones
  - Basic internet connectivity available
  - Users can read English
  - Manual payment processing acceptable
  - Fixed pricing model acceptable

Dependencies:
  - SMS gateway service availability
  - Server hosting availability
  - Development team availability
  - Domain and SSL certificates
```

---

## 3. Detailed Functional Requirements

### 3.1 User Management Module

#### FR-001: User Registration

```yaml
Requirement ID: FR-001
Priority: Critical
Description: System shall allow new users to register

Input Fields:
  - Mobile Number (10 digits, Indian format)
  - User Type (Shipper/Carrier)
  - Business Name (3-100 characters)
  - GST Number (15 characters, optional for carriers)
  - Email (optional, valid format)
  - Address (text, required)

Process Flow:
  1. User enters mobile number
  2. System sends OTP via SMS
  3. User enters OTP (6 digits)
  4. System validates OTP (5-minute expiry)
  5. User fills registration form
  6. System validates GST format (if provided)
  7. System creates user account
  8. System sends welcome SMS

Validation Rules:
  - Mobile number must be unique
  - GST format: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
  - OTP valid for 5 minutes only
  - Maximum 3 OTP attempts

Output:
  - User ID (USR-YYYYMMDD-XXXX format)
  - JWT token for session
  - Success/Error message

Error Conditions:
  - Duplicate mobile number
  - Invalid OTP
  - Invalid GST format
  - Network failure
```

#### FR-002: User Authentication

```yaml
Requirement ID: FR-002
Priority: Critical
Description: System shall authenticate users via OTP

Process:
  1. User enters mobile number
  2. System checks if user exists
  3. System sends OTP
  4. User enters OTP
  5. System validates OTP
  6. System creates session (JWT)
  7. System redirects to dashboard

Session Management:
  - Token validity: 24 hours
  - Refresh token: 7 days
  - Idle timeout: 30 minutes
  - Concurrent sessions: Allowed
```

### 3.2 Booking Management Module

#### FR-003: Create Booking

```yaml
Requirement ID: FR-003
Priority: Critical
Description: Shippers shall create fixed-rate bookings

Input Fields:
  - Pickup Date (Today to +7 days)
  - Pickup Time (6 AM to 6 PM, hourly slots)
  - Delivery Area (Dropdown selection)
  - Number of Trucks (1-10)
  - Contact Person Name
  - Contact Mobile
  - Special Instructions (optional, 200 chars max)

Delivery Areas & Distances:
  - Electronic City: 15 km
  - Bommanahalli: 20 km
  - Silk Board: 25 km
  - Marathahalli: 35 km
  - Whitefield: 40 km

Price Calculation:
  Base Rate: ₹5 per tonne per km
  Truck Capacity: 20 tonnes

  Formula:
  - Base Amount = Trucks × 20 tonnes × Distance × ₹5
  - Loading Charges = Trucks × ₹1,000
  - Unloading Charges = Trucks × ₹1,000
  - Subtotal = Base + Loading + Unloading
  - GST = Subtotal × 0.18
  - Total = Subtotal + GST

Process Flow:
  1. Shipper fills booking form
  2. System calculates price
  3. Shipper confirms booking
  4. System creates booking record
  5. System triggers auto-assignment
  6. System sends confirmation SMS

Output:
  - Booking ID (BK-YYYYMMDD-XXXX)
  - Price breakdown
  - Assigned truck details
  - Confirmation message
```

#### FR-004: View Bookings

```yaml
Requirement ID: FR-004
Priority: High
Description: Users shall view their bookings

Features:
  - List view with pagination (20 per page)
  - Filters: Status, Date range
  - Search by Booking ID
  - Sort by date (newest first)

Display Fields:
  - Booking ID
  - Date & Time
  - Status (with icon)
  - Truck Number (if assigned)
  - Amount
  - Actions (View Details, Download Invoice)

Permissions:
  - Shippers: See only their bookings
  - Carriers: See assigned bookings
  - Admin: See all bookings
```

#### FR-005: Booking Status Management

```yaml
Requirement ID: FR-005
Priority: Critical
Description: System shall track booking status

Status Flow:
  CREATED → ASSIGNED → CONFIRMED → EN_ROUTE →
  LOADING → IN_TRANSIT → UNLOADING → DELIVERED → COMPLETED

Status Transitions:
  - CREATED to ASSIGNED: Auto on truck assignment
  - ASSIGNED to CONFIRMED: Driver accepts
  - CONFIRMED to EN_ROUTE: Driver starts trip
  - EN_ROUTE to LOADING: Reaches pickup
  - LOADING to IN_TRANSIT: Loading complete
  - IN_TRANSIT to UNLOADING: Reaches delivery
  - UNLOADING to DELIVERED: Unloading complete
  - DELIVERED to COMPLETED: POD uploaded

Notifications:
  - SMS on each major status change
  - Email if configured
```

### 3.3 Fleet Management Module

#### FR-006: Truck Registration

```yaml
Requirement ID: FR-006
Priority: Critical
Description: Carriers shall register their trucks

Input Fields:
  - Truck Number (Format: KA-XX-XX-XXXX)
  - Capacity (Dropdown: 10T, 15T, 20T)
  - Truck Type (Open/Closed)
  - Driver Name
  - Driver Mobile
  - Driver License Number
  - Bank Account Details (for payments)

Validation:
  - Truck number must be unique
  - Valid Karnataka registration format
  - Driver mobile must be 10 digits
  - Bank account verification via penny drop

Process:
  1. Carrier enters truck details
  2. System validates truck number format
  3. Carrier enters driver details
  4. Carrier enters bank details
  5. System initiates penny drop verification
  6. System creates truck record
  7. Truck marked as available

Output:
  - Truck ID (TRK-YYYYMMDD-XXXX)
  - Registration confirmation
```

#### FR-007: Truck Assignment Logic

```yaml
Requirement ID: FR-007
Priority: Critical
Description: System shall auto-assign trucks to bookings

Assignment Algorithm:
  1. Get available trucks (status = 'AVAILABLE')
  2. Filter by capacity (≥ required)
  3. Filter by operating hours
  4. Sort by:
     - Previous trips for same shipper (priority)
     - Success rate
     - Registration order (FIFO)
  5. Select first matching truck
  6. Update truck status to 'ASSIGNED'
  7. Send SMS to driver
  8. Wait for confirmation (15 minutes)
  9. If no confirmation, assign next truck

Constraints:
  - One active trip per truck
  - Maximum 2 trips/day per truck
  - Operating hours: 6 AM to 8 PM
  - 40 km distance limit
```

### 3.4 Tracking Module

#### FR-008: Status Updates

```yaml
Requirement ID: FR-008
Priority: High
Description: Drivers shall update trip status

Update Methods:
  - Web portal (mobile responsive)
  - SMS commands (future)

Available Actions by Status:
  CONFIRMED: Start Trip
  EN_ROUTE: Reached Pickup
  LOADING: Loading Complete
  IN_TRANSIT: Reached Delivery
  UNLOADING: Upload POD

Process:
  1. Driver logs in with mobile/OTP
  2. System shows assigned booking
  3. Driver clicks status update button
  4. System validates status transition
  5. System updates status
  6. System sends notifications
```

#### FR-009: POD Upload

```yaml
Requirement ID: FR-009
Priority: Critical
Description: Drivers shall upload proof of delivery

Requirements:
  - Image format: JPG/PNG
  - Maximum size: 2MB
  - Minimum resolution: 800x600
  - Clear visibility of signature/stamp

Process:
  1. Driver clicks "Upload POD"
  2. System opens camera/file selector
  3. Driver captures/selects image
  4. System validates image
  5. System compresses if needed
  6. System stores POD
  7. Booking marked as DELIVERED
  8. Invoice auto-generated

Storage:
  - Local server storage (MVP)
  - Path: /uploads/pods/{booking-id}/
  - Retention: 90 days
```

### 3.5 Payment Module

#### FR-010: Invoice Generation

```yaml
Requirement ID: FR-010
Priority: Critical
Description: System shall generate GST-compliant invoices

Trigger: POD upload completion

Invoice Contents:
  - Invoice Number (Sequential)
  - Invoice Date
  - Shipper Details (Name, GST, Address)
  - Carrier Details (Name, Truck Number)
  - Booking Details (ID, Route, Date)
  - Price Breakdown:
    * Base Freight Charges
    * Loading/Unloading
    * Subtotal
    * GST (18%)
    * Total Amount
  - Payment Terms (7 days)
  - Bank Details

Format:
  - PDF generation
  - A4 size
  - Company branding
  - Digital signature (future)

Distribution:
  - Email (if provided)
  - SMS with download link
  - Available in portal
```

#### FR-011: Payment Tracking

```yaml
Requirement ID: FR-011
Priority: High
Description: System shall track payment status

Payment States:
  - PENDING: Invoice generated
  - PROCESSING: Payment initiated
  - COMPLETED: Payment confirmed
  - FAILED: Payment failed
  - REFUNDED: Refund processed

Manual Process (MVP):
  1. Admin receives bank statement
  2. Admin matches payments with invoices
  3. Admin updates payment status
  4. System sends confirmation to carrier
  5. Settlement marked complete

Future Automation:
  - Payment gateway integration
  - Auto-reconciliation
  - Instant settlements
```

---

## 4. REST API Specifications

### 4.1 API Standards and Conventions

```yaml
Base URL: https://api.ubertruck.in/api/v1

Standards:
  - RESTful principles
  - JSON request/response
  - UTF-8 encoding
  - ISO 8601 date format
  - Consistent error responses

Authentication:
  - Bearer token (JWT)
  - Token in Authorization header
  - Format: "Bearer <token>"

Rate Limiting:
  - 100 requests per minute per user
  - 1000 requests per hour per user
  - Headers: X-RateLimit-Limit, X-RateLimit-Remaining

Versioning:
  - URL versioning (/v1/, /v2/)
  - Backward compatibility for 6 months
  - Deprecation notices in headers

Error Response Format:
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": {},
      "timestamp": "2024-02-01T10:00:00Z"
    }
  }

Success Response Format:
  {
    "success": true,
    "data": {},
    "message": "Operation successful",
    "timestamp": "2024-02-01T10:00:00Z"
  }
```

### 4.2 User Service APIs

#### POST /api/v1/users/register

```yaml
Description: Register new user
Authorization: None
Rate Limit: 5 requests per hour per IP

Request Body:
  {
    "mobile": "9876543210",
    "otp": "123456",
    "userType": "shipper|carrier",
    "businessName": "ABC Enterprises",
    "gstNumber": "29ABCDE1234F1Z5",  // Optional
    "email": "contact@abc.com",        // Optional
    "address": {
      "line1": "123 Industrial Area",
      "city": "Nalgonda",
      "state": "Tamil Nadu",
      "pincode": "635109"
    }
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "userId": "USR-20240201-0001",
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 86400
    }
  }

Error Responses:
  400: Invalid input data
  409: Mobile number already registered
  429: Too many requests
```

#### POST /api/v1/users/login

```yaml
Description: User login via OTP
Authorization: None

Request Body:
  {
    "mobile": "9876543210",
    "otp": "123456"
  }

Response (200 OK):
  {
    "success": true,
    "data": {
      "userId": "USR-20240201-0001",
      "userType": "shipper",
      "businessName": "ABC Enterprises",
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }

Error Responses:
  401: Invalid OTP
  404: User not found
```

#### GET /api/v1/users/{id}

```yaml
Description: Get user profile
Authorization: Required

Path Parameters:
  id: User ID (USR-YYYYMMDD-XXXX)

Response (200 OK):
  {
    "success": true,
    "data": {
      "userId": "USR-20240201-0001",
      "mobile": "9876543210",
      "userType": "shipper",
      "businessName": "ABC Enterprises",
      "gstNumber": "29ABCDE1234F1Z5",
      "email": "contact@abc.com",
      "address": {},
      "createdAt": "2024-02-01T10:00:00Z",
      "status": "active"
    }
  }

Error Responses:
  401: Unauthorized
  403: Forbidden (accessing other user's data)
  404: User not found
```

### 4.3 Fleet Service APIs

#### POST /api/v1/fleet/trucks

```yaml
Description: Register new truck
Authorization: Required (Carrier only)

Request Body:
  {
    "truckNumber": "KA-01-AB-1234",
    "capacity": "20T",
    "truckType": "closed",
    "driver": {
      "name": "Rajesh Kumar",
      "mobile": "9876543211",
      "licenseNumber": "KA012345678901"
    },
    "bankAccount": {
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "accountHolderName": "Rajesh Kumar"
    }
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "truckId": "TRK-20240201-0001",
      "status": "active",
      "verificationStatus": "pending"
    }
  }

Error Responses:
  400: Invalid truck number format
  409: Truck already registered
  403: Not a carrier account
```

#### GET /api/v1/fleet/trucks

```yaml
Description: List trucks
Authorization: Required

Query Parameters:
  status: active|inactive|assigned
  page: 1 (default)
  limit: 20 (default, max 100)

Response (200 OK):
  {
    "success": true,
    "data": {
      "trucks": [
        {
          "truckId": "TRK-20240201-0001",
          "truckNumber": "KA-01-AB-1234",
          "capacity": "20T",
          "status": "active",
          "currentLocation": "Nalgonda",
          "driver": {
            "name": "Rajesh Kumar",
            "mobile": "9876543211"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 45,
        "pages": 3
      }
    }
  }
```

#### PUT /api/v1/fleet/trucks/{id}/availability

```yaml
Description: Update truck availability
Authorization: Required (Owner only)

Path Parameters:
  id: Truck ID

Request Body:
  {
    "available": true,
    "nextAvailableDate": "2024-02-02",
    "currentLocation": "Nalgonda"
  }

Response (200 OK):
  {
    "success": true,
    "message": "Availability updated"
  }
```

### 4.4 Booking Service APIs

#### POST /api/v1/bookings

```yaml
Description: Create new booking
Authorization: Required (Shipper only)

Request Body:
  {
    "pickupDate": "2024-02-02",
    "pickupTime": "09:00",
    "deliveryArea": "Electronic City",
    "numberOfTrucks": 2,
    "contactPerson": {
      "name": "John Doe",
      "mobile": "9876543212"
    },
    "specialInstructions": "Handle with care"
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "bookingId": "BK-20240201-0001",
      "status": "ASSIGNED",
      "pricing": {
        "baseAmount": 3000,
        "loadingCharges": 2000,
        "unloadingCharges": 2000,
        "subtotal": 7000,
        "gst": 1260,
        "total": 8260
      },
      "assignedTrucks": [
        {
          "truckId": "TRK-20240201-0001",
          "truckNumber": "KA-01-AB-1234",
          "driver": {
            "name": "Rajesh Kumar",
            "mobile": "9876543211"
          }
        }
      ]
    }
  }

Error Responses:
  400: Invalid input
  403: Not a shipper account
  404: No trucks available
```

#### GET /api/v1/bookings

```yaml
Description: List bookings
Authorization: Required

Query Parameters:
  status: CREATED|ASSIGNED|IN_TRANSIT|DELIVERED|COMPLETED
  from: 2024-02-01 (date)
  to: 2024-02-28 (date)
  page: 1
  limit: 20

Response (200 OK):
  {
    "success": true,
    "data": {
      "bookings": [
        {
          "bookingId": "BK-20240201-0001",
          "pickupDate": "2024-02-02",
          "pickupTime": "09:00",
          "deliveryArea": "Electronic City",
          "status": "ASSIGNED",
          "totalAmount": 8260,
          "createdAt": "2024-02-01T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 150,
        "pages": 8
      }
    }
  }
```

#### GET /api/v1/bookings/{id}

```yaml
Description: Get booking details
Authorization: Required

Response (200 OK):
  {
    "success": true,
    "data": {
      "bookingId": "BK-20240201-0001",
      "shipperId": "USR-20240201-0001",
      "shipperName": "ABC Enterprises",
      "pickupDate": "2024-02-02",
      "pickupTime": "09:00",
      "deliveryArea": "Electronic City",
      "status": "IN_TRANSIT",
      "statusHistory": [
        {
          "status": "CREATED",
          "timestamp": "2024-02-01T10:00:00Z"
        },
        {
          "status": "ASSIGNED",
          "timestamp": "2024-02-01T10:05:00Z"
        }
      ],
      "pricing": {},
      "assignedTrucks": [],
      "trackingInfo": {
        "currentStatus": "IN_TRANSIT",
        "lastUpdated": "2024-02-02T11:00:00Z"
      }
    }
  }
```

### 4.5 Route & Tracking Service APIs

#### POST /api/v1/routes/optimize

```yaml
Description: Optimize route for delivery
Authorization: Required

Request Body:
  {
    "origin": {
      "lat": 12.7409,
      "lng": 77.8253
    },
    "destination": {
      "lat": 12.8468,
      "lng": 77.6616
    },
    "waypoints": [],
    "vehicleType": "truck"
  }

Response (200 OK):
  {
    "success": true,
    "data": {
      "distance": 15.5,
      "duration": 45,
      "route": {
        "polyline": "encoded_polyline_string",
        "steps": []
      }
    }
  }
```

#### PUT /api/v1/tracking/{bookingId}/status

```yaml
Description: Update tracking status
Authorization: Required (Driver/Admin)

Request Body:
  {
    "status": "LOADING",
    "location": {
      "lat": 12.7409,
      "lng": 77.8253
    },
    "notes": "Started loading"
  }

Response (200 OK):
  {
    "success": true,
    "message": "Status updated successfully"
  }
```

#### POST /api/v1/tracking/{bookingId}/pod

```yaml
Description: Upload proof of delivery
Authorization: Required (Driver/Admin)
Content-Type: multipart/form-data

Request Body:
  file: image file (JPG/PNG, max 2MB)
  notes: "Delivered successfully"

Response (200 OK):
  {
    "success": true,
    "data": {
      "podUrl": "/uploads/pods/BK-20240201-0001/pod.jpg",
      "uploadedAt": "2024-02-02T15:00:00Z",
      "invoiceGenerated": true
    }
  }

Error Responses:
  400: Invalid file format
  413: File too large
  404: Booking not found
```

### 4.6 Payment Service APIs

#### POST /api/v1/payments/invoice

```yaml
Description: Generate invoice
Authorization: Required

Request Body:
  {
    "bookingId": "BK-20240201-0001"
  }

Response (200 OK):
  {
    "success": true,
    "data": {
      "invoiceId": "INV-20240202-0001",
      "invoiceNumber": "UBT/2024/0001",
      "amount": 8260,
      "gst": 1260,
      "dueDate": "2024-02-09",
      "downloadUrl": "/invoices/INV-20240202-0001.pdf"
    }
  }
```

#### GET /api/v1/payments/{id}

```yaml
Description: Get payment details
Authorization: Required

Response (200 OK):
  {
    "success": true,
    "data": {
      "paymentId": "PAY-20240202-0001",
      "invoiceId": "INV-20240202-0001",
      "amount": 8260,
      "status": "PENDING",
      "dueDate": "2024-02-09",
      "bankDetails": {
        "accountNumber": "1234567890",
        "ifscCode": "SBIN0001234",
        "accountHolderName": "Ubertruck Pvt Ltd"
      }
    }
  }
```

### 4.7 Admin Service APIs

#### GET /api/v1/admin/metrics

```yaml
Description: Get dashboard metrics
Authorization: Required (Admin only)

Query Parameters:
  from: 2024-02-01
  to: 2024-02-28

Response (200 OK):
  {
    "success": true,
    "data": {
      "overview": {
        "totalBookings": 450,
        "activeBookings": 23,
        "completedBookings": 427,
        "totalGMV": 3500000,
        "averageDeliveryTime": 4.5
      },
      "users": {
        "totalShippers": 15,
        "totalCarriers": 98,
        "activeToday": 45
      },
      "performance": {
        "onTimeDelivery": 95.5,
        "successRate": 98.2,
        "averageRating": 4.3
      }
    }
  }
```

#### GET /api/v1/admin/logs

```yaml
Description: Get system logs
Authorization: Required (Admin only)

Query Parameters:
  level: info|warn|error
  service: user|booking|fleet|payment
  from: 2024-02-01T00:00:00Z
  to: 2024-02-01T23:59:59Z
  page: 1
  limit: 50

Response (200 OK):
  {
    "success": true,
    "data": {
      "logs": [
        {
          "timestamp": "2024-02-01T10:00:00Z",
          "level": "info",
          "service": "booking",
          "message": "Booking created successfully",
          "metadata": {
            "bookingId": "BK-20240201-0001",
            "userId": "USR-20240201-0001"
          }
        }
      ],
      "pagination": {}
    }
  }
```

---

## 5. Microservice Architecture Details

### 5.1 Service Boundaries and Responsibilities

```yaml
API Gateway (Nginx):
  Port: 80/443
  Responsibilities:
    - Request routing
    - Authentication verification
    - Rate limiting
    - SSL termination
    - CORS handling
    - Request/Response logging
  Routes:
    /api/v1/users/* → User Service (3001)
    /api/v1/fleet/* → Fleet Service (3002)
    /api/v1/bookings/* → Booking Service (3003)
    /api/v1/tracking/* → Tracking Service (3004)
    /api/v1/payments/* → Payment Service (3005)
    /api/v1/admin/* → Admin Service (3006)

User Service:
  Port: 3001
  Database Tables: users, user_sessions, otp_logs
  Responsibilities:
    - User registration and authentication
    - Profile management
    - OTP generation and validation
    - Session management
    - Password reset (future)
  External Dependencies:
    - SMS Gateway for OTP

Fleet Service:
  Port: 3002
  Database Tables: trucks, drivers, availability
  Responsibilities:
    - Truck registration and management
    - Driver management
    - Availability tracking
    - Assignment eligibility checks
  Dependencies:
    - User Service (authentication)

Booking Service:
  Port: 3003
  Database Tables: bookings, booking_items, pricing_rules
  Responsibilities:
    - Booking creation and management
    - Price calculation
    - Auto-assignment orchestration
    - Status management
  Dependencies:
    - User Service (shipper validation)
    - Fleet Service (truck availability)
    - Tracking Service (status updates)

Route & Tracking Service:
  Port: 3004
  Database Tables: tracking_updates, routes, pods
  Responsibilities:
    - Route optimization
    - Status tracking
    - POD management
    - Timeline generation
  Dependencies:
    - Booking Service (booking data)

Payment Service:
  Port: 3005
  Database Tables: invoices, payments, settlements
  Responsibilities:
    - Invoice generation
    - Payment tracking
    - Settlement management
    - Financial reporting
  Dependencies:
    - Booking Service (booking details)
    - User Service (user details)

Admin Service:
  Port: 3006
  Database Tables: metrics, audit_logs
  Responsibilities:
    - Metrics aggregation
    - Report generation
    - System monitoring
    - Admin operations
  Dependencies:
    - All services (read-only access)

Notification Service:
  Port: 3007
  Database Tables: notifications, sms_logs
  Responsibilities:
    - SMS notifications
    - Email notifications (future)
    - Notification templates
    - Delivery tracking
  External Dependencies:
    - SMS Gateway
```

### 5.2 Inter-Service Communication

```yaml
Communication Patterns:

Synchronous (REST):
  - Service-to-service HTTP calls
  - Timeout: 5 seconds
  - Retry: 3 attempts with exponential backoff
  - Circuit breaker: 5 failures trigger open state

Asynchronous (Event-Driven):
  Event Bus: Redis Pub/Sub

  Events:
    USER_REGISTERED:
      Publisher: User Service
      Subscribers: Admin Service, Notification Service

    TRUCK_REGISTERED:
      Publisher: Fleet Service
      Subscribers: Admin Service

    BOOKING_CREATED:
      Publisher: Booking Service
      Subscribers: Fleet Service, Notification Service

    TRUCK_ASSIGNED:
      Publisher: Booking Service
      Subscribers: Fleet Service, Tracking Service

    STATUS_UPDATED:
      Publisher: Tracking Service
      Subscribers: Booking Service, Notification Service

    POD_UPLOADED:
      Publisher: Tracking Service
      Subscribers: Payment Service, Notification Service

    INVOICE_GENERATED:
      Publisher: Payment Service
      Subscribers: Notification Service
```

### 5.3 Data Flow Diagrams

#### Booking Creation Flow

```
1. Client → API Gateway: POST /bookings
2. API Gateway → Booking Service: Create booking
3. Booking Service → Database: Save booking
4. Booking Service → Fleet Service: Get available trucks
5. Fleet Service → Database: Query trucks
6. Fleet Service → Booking Service: Return trucks
7. Booking Service → Database: Assign truck
8. Booking Service → Event Bus: Publish BOOKING_CREATED
9. Notification Service → SMS Gateway: Send SMS
10. Booking Service → API Gateway: Return booking details
11. API Gateway → Client: Booking confirmation
```

#### Status Update Flow

```
1. Driver App → API Gateway: PUT /tracking/status
2. API Gateway → Tracking Service: Update status
3. Tracking Service → Database: Save update
4. Tracking Service → Event Bus: Publish STATUS_UPDATED
5. Notification Service → SMS Gateway: Send notification
6. Booking Service → Database: Update booking status
7. Tracking Service → API Gateway: Success response
8. API Gateway → Driver App: Confirmation
```

### 5.4 Database Schema

```sql
-- Shared PostgreSQL Database (MVP compromise)

-- User Service Tables
CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  mobile VARCHAR(10) UNIQUE NOT NULL,
  user_type ENUM('shipper', 'carrier', 'admin'),
  business_name VARCHAR(100),
  gst_number VARCHAR(15),
  email VARCHAR(100),
  address JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fleet Service Tables
CREATE TABLE trucks (
  id VARCHAR(20) PRIMARY KEY,
  owner_id VARCHAR(20) REFERENCES users(id),
  truck_number VARCHAR(15) UNIQUE NOT NULL,
  capacity VARCHAR(10),
  truck_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  id VARCHAR(20) PRIMARY KEY,
  truck_id VARCHAR(20) REFERENCES trucks(id),
  name VARCHAR(100),
  mobile VARCHAR(10),
  license_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking Service Tables
CREATE TABLE bookings (
  id VARCHAR(20) PRIMARY KEY,
  shipper_id VARCHAR(20) REFERENCES users(id),
  pickup_date DATE,
  pickup_time TIME,
  delivery_area VARCHAR(50),
  number_of_trucks INTEGER,
  contact_person JSONB,
  status VARCHAR(20),
  pricing JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_trucks (
  booking_id VARCHAR(20) REFERENCES bookings(id),
  truck_id VARCHAR(20) REFERENCES trucks(id),
  assigned_at TIMESTAMP,
  PRIMARY KEY (booking_id, truck_id)
);

-- Tracking Service Tables
CREATE TABLE tracking_updates (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(20) REFERENCES bookings(id),
  status VARCHAR(20),
  location JSONB,
  notes TEXT,
  updated_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pods (
  id VARCHAR(20) PRIMARY KEY,
  booking_id VARCHAR(20) REFERENCES bookings(id),
  file_path VARCHAR(255),
  uploaded_by VARCHAR(20),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Service Tables
CREATE TABLE invoices (
  id VARCHAR(20) PRIMARY KEY,
  booking_id VARCHAR(20) REFERENCES bookings(id),
  invoice_number VARCHAR(20) UNIQUE,
  amount DECIMAL(10, 2),
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  due_date DATE,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id VARCHAR(20) PRIMARY KEY,
  invoice_id VARCHAR(20) REFERENCES invoices(id),
  amount DECIMAL(10, 2),
  payment_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

```yaml
Response Times:
  - Page Load: ≤3 seconds on 3G connection
  - API Response: ≤500ms for 95th percentile
  - Database Query: ≤100ms average
  - File Upload: ≤10 seconds for 2MB file

Throughput:
  - Concurrent Users: 100 simultaneous
  - API Requests: 1000 per minute
  - Bookings: 100 per day
  - SMS: 500 per hour

Resource Usage:
  - CPU: <70% average, <90% peak
  - Memory: <80% usage
  - Disk I/O: <100 IOPS average
  - Network: <10 Mbps average
```

### 6.2 Reliability Requirements

```yaml
Availability:
  - System Uptime: 99.5% (3.6 hours downtime/month)
  - Planned Maintenance: Sunday 2-5 AM IST
  - Unplanned Downtime: <30 minutes/month

Fault Tolerance:
  - Graceful degradation on service failure
  - Circuit breakers for external services
  - Retry logic with exponential backoff
  - Manual fallback procedures

Data Integrity:
  - ACID compliance for transactions
  - Referential integrity enforced
  - No data loss on system failure
  - Audit trail for all changes
```

### 6.3 Security Requirements

```yaml
Authentication & Authorization:
  - OTP-based authentication
  - JWT tokens with 24-hour expiry
  - Role-based access control (RBAC)
  - Session timeout after 30 minutes idle

Data Protection:
  - TLS 1.2+ for all communications
  - Database encryption at rest
  - Sensitive data masking in logs
  - PII data anonymization

Security Controls:
  - Input validation on all endpoints
  - SQL injection prevention
  - XSS protection
  - CSRF tokens
  - Rate limiting
  - IP whitelisting for admin

Compliance:
  - GDPR basic compliance
  - Indian data localization
  - GST regulations compliance
  - Basic KYC requirements
```

### 6.4 Scalability Requirements

```yaml
Vertical Scaling:
  Current: 4GB RAM, 2 vCPU
  Maximum: 16GB RAM, 8 vCPU
  Trigger: 70% resource utilization

Horizontal Scaling (Future):
  - Load balancer ready architecture
  - Stateless services
  - Database connection pooling
  - Cache layer (Redis)

Growth Projections:
  Month 1: 100 bookings, 50 users
  Month 3: 500 bookings, 200 users
  Month 6: 2000 bookings, 1000 users
  Month 12: 10000 bookings, 5000 users
```

### 6.5 Usability Requirements

```yaml
User Interface:
  - Mobile responsive design
  - Minimum 5-inch screen support
  - Works on 2G/3G networks
  - Simple, intuitive navigation
  - Maximum 3 clicks to any function

Accessibility:
  - Font size minimum 14px
  - High contrast mode
  - Clear error messages
  - Confirmation for critical actions
  - Help text for complex fields

Browser Support:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
  - Mobile browsers

Localization:
  - English language only (MVP)
  - Indian date format (DD/MM/YYYY)
  - Indian currency (₹)
  - Indian phone format
```

---

## 7. Use Cases

### 7.1 Primary Use Cases

#### UC-001: Shipper Books a Truck

```yaml
Use Case ID: UC-001
Title: Shipper Books a Truck
Primary Actor: Shipper
Preconditions:
  - Shipper is registered and logged in
  - At least one truck is available

Main Flow:
  1. Shipper clicks "New Booking"
  2. System displays booking form
  3. Shipper enters:
     - Pickup date (from calendar)
     - Pickup time (from dropdown)
     - Delivery area (from dropdown)
     - Number of trucks
     - Contact details
  4. System calculates and displays price
  5. Shipper reviews and confirms
  6. System creates booking
  7. System assigns available truck
  8. System sends confirmation SMS
  9. System displays booking details

Alternative Flows:
  3a. Invalid date selected:
      - System shows error
      - Returns to step 3

  7a. No truck available:
      - System notifies shipper
      - Booking saved as pending
      - Admin notified

Postconditions:
  - Booking created in system
  - Truck assigned and notified
  - Shipper receives confirmation

Success Metrics:
  - Completion time <3 minutes
  - 95% successful assignments
```

#### UC-002: Driver Delivers Shipment

```yaml
Use Case ID: UC-002
Title: Driver Delivers Shipment
Primary Actor: Driver
Preconditions:
  - Driver assigned to booking
  - Driver has login credentials

Main Flow:
  1. Driver logs into system
  2. System shows assigned booking
  3. Driver starts trip
  4. Driver updates "Reached Pickup"
  5. Driver updates "Loading Complete"
  6. Driver updates "In Transit"
  7. Driver updates "Reached Delivery"
  8. Driver completes delivery
  9. Driver uploads POD photo
  10. System marks delivery complete
  11. System generates invoice

Alternative Flows:
  9a. POD upload fails:
      - System allows retry
      - Option to upload later

Postconditions:
  - Delivery completed
  - POD stored
  - Invoice generated
```

### 7.2 Data Flow Descriptions

#### Booking Creation Data Flow

```
Input Data:
  ├── User Context (shipper ID, session)
  ├── Pickup Details (date, time)
  ├── Delivery Location (area selection)
  ├── Capacity Needs (number of trucks)
  └── Contact Information

Processing:
  ├── Validation
  │   ├── Date validation (not past, within 7 days)
  │   ├── Time validation (6 AM - 6 PM)
  │   └── Contact validation (mobile format)
  ├── Price Calculation
  │   ├── Distance lookup (based on area)
  │   ├── Base rate calculation (₹5/tonne/km)
  │   ├── Additional charges
  │   └── GST calculation (18%)
  ├── Truck Assignment
  │   ├── Query available trucks
  │   ├── Apply assignment rules
  │   └── Select best match
  └── Notification
      ├── SMS to shipper
      └── SMS to driver

Output Data:
  ├── Booking ID
  ├── Confirmation details
  ├── Assigned truck information
  └── Price breakdown
```

---

## 8. Appendices

### 8.1 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid credentials | 401 |
| AUTH_002 | Session expired | 401 |
| AUTH_003 | Insufficient permissions | 403 |
| VAL_001 | Invalid input format | 400 |
| VAL_002 | Missing required field | 400 |
| VAL_003 | Value out of range | 400 |
| BUS_001 | No trucks available | 404 |
| BUS_002 | Booking not found | 404 |
| BUS_003 | Invalid status transition | 400 |
| SYS_001 | Internal server error | 500 |
| SYS_002 | Service unavailable | 503 |
| SYS_003 | Database error | 500 |

### 8.2 Status Codes

```yaml
Booking Status:
  CREATED: Booking created, awaiting assignment
  ASSIGNED: Truck assigned, awaiting confirmation
  CONFIRMED: Driver accepted assignment
  EN_ROUTE: Driver heading to pickup
  LOADING: At pickup location, loading
  IN_TRANSIT: On the way to delivery
  UNLOADING: At delivery location
  DELIVERED: Delivery completed
  COMPLETED: POD uploaded, invoice generated
  CANCELLED: Booking cancelled

Payment Status:
  PENDING: Invoice generated, awaiting payment
  PROCESSING: Payment being processed
  COMPLETED: Payment confirmed
  FAILED: Payment failed
  REFUNDED: Payment refunded
```

### 8.3 Glossary

| Term | Definition |
|------|------------|
| Shipper | Company/individual booking trucks |
| Carrier | Truck owner providing service |
| Driver | Person operating the truck |
| POD | Proof of Delivery document |
| GMV | Gross Merchandise Value |
| Fixed-rate | Predetermined price per tonne per km |
| Auto-assignment | System automatically assigns trucks |

---

*Document Version: 1.0*
*Last Updated: February 2024*
*Next Review: May 2024*
*Status: Approved for Development*