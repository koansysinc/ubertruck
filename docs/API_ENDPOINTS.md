# UBERTRUCK MVP - COMPLETE API ENDPOINTS

## Base Configuration
- **Base URL:** `http://localhost:3000`
- **API Version:** `v1`
- **Authentication:** Bearer JWT Token (except public endpoints)

---

## 🔐 USER SERVICE (`/api/v1/users`)

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Register new user (shipper/carrier/driver) |
| POST | `/api/v1/users/login` | Login with phone number (sends OTP) |
| POST | `/api/v1/users/verify-otp` | Verify OTP and get JWT token |

### Protected Endpoints (Auth Required)
| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/profile` | Get current user profile | Any |
| PUT | `/api/v1/users/profile` | Update basic profile | Any |
| POST | `/api/v1/users/profile/shipper` | Complete shipper profile | Shipper |
| POST | `/api/v1/users/profile/carrier` | Complete carrier profile | Carrier |
| POST | `/api/v1/users/profile/driver` | Complete driver profile | Driver |
| POST | `/api/v1/users/logout` | Logout user | Any |
| GET | `/api/v1/users/docs` | API documentation | Any |

---

## 🚛 FLEET SERVICE (`/api/v1/fleet`)

### Protected Endpoints (Auth Required)
| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/v1/fleet/trucks` | List all trucks | Carrier/Admin |
| POST | `/api/v1/fleet/trucks` | Add new truck | Carrier/Admin |
| GET | `/api/v1/fleet/trucks/:truckId` | Get truck details | Carrier/Admin |
| PUT | `/api/v1/fleet/trucks/:truckId` | Update truck details | Carrier/Admin |
| DELETE | `/api/v1/fleet/trucks/:truckId` | Delete truck | Carrier/Admin |
| POST | `/api/v1/fleet/trucks/:truckId/assign-driver` | Assign driver to truck | Carrier/Admin |
| GET | `/api/v1/fleet/drivers` | List all drivers | Carrier/Admin |
| POST | `/api/v1/fleet/drivers` | Add new driver | Carrier/Admin |
| GET | `/api/v1/fleet/drivers/:driverId` | Get driver details | Carrier/Admin |
| PUT | `/api/v1/fleet/drivers/:driverId` | Update driver details | Carrier/Admin |
| DELETE | `/api/v1/fleet/drivers/:driverId` | Delete driver | Carrier/Admin |
| GET | `/api/v1/fleet/docs` | API documentation | Any |

---

## 📦 BOOKING SERVICE (`/api/v1/bookings`)

### Protected Endpoints (Auth Required)
| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/v1/bookings` | List user's bookings | Any (filtered by role) |
| POST | `/api/v1/bookings` | Create new booking | Shipper |
| GET | `/api/v1/bookings/stats` | Get booking statistics | Admin |
| GET | `/api/v1/bookings/:bookingId` | Get booking details | Owner/Carrier/Driver/Admin |
| PUT | `/api/v1/bookings/:bookingId/status` | Update booking status | Driver/Admin |
| POST | `/api/v1/bookings/:bookingId/cancel` | Cancel booking | Shipper/Admin |
| POST | `/api/v1/bookings/:bookingId/pod` | Upload proof of delivery | Driver/Admin |
| POST | `/api/v1/bookings/:bookingId/assign-truck` | Assign truck to booking | Carrier/Admin |
| GET | `/api/v1/bookings/docs` | API documentation | Any |

### Booking Status Flow
- `created` → `assigned` → `picked_up` → `in_transit` → `delivered`
- Can be `cancelled` from `created` or `assigned` states only

---

## 💰 PAYMENT SERVICE (`/api/v1/payments`)

### Protected Endpoints (Auth Required)
| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/v1/payments/invoices` | List invoices | Any (filtered by role) |
| GET | `/api/v1/payments/stats` | Payment statistics | Admin |
| POST | `/api/v1/payments/invoices/generate` | Generate invoice for booking | Admin/Carrier |
| GET | `/api/v1/payments/invoices/:invoiceId` | Get invoice details | Owner/Admin |
| POST | `/api/v1/payments/invoices/:invoiceId/record-payment` | Record manual payment | Admin/Carrier |
| GET | `/api/v1/payments/invoices/:invoiceId/download` | Download invoice data | Owner/Admin |

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payments/docs` | API documentation |

### Payment Methods (Manual Only)
- Bank Transfer
- Cheque
- Cash
- UPI

---

## 👨‍💼 ADMIN SERVICE (`/api/v1/admin`)

### Protected Endpoints (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Get dashboard metrics |
| GET | `/api/v1/admin/users` | List all users with filtering |
| PUT | `/api/v1/admin/users/:userId/status` | Update user status (activate/suspend/deactivate) |
| GET | `/api/v1/admin/bookings` | Get all bookings with advanced filtering |
| GET | `/api/v1/admin/reports` | Generate reports (revenue/operations/fleet/compliance) |
| POST | `/api/v1/admin/disputes` | Handle booking disputes and refunds |
| GET | `/api/v1/admin/docs` | API documentation |

### Report Types
- `revenue` - Financial metrics and trends
- `operations` - Operational performance metrics
- `fleet` - Fleet utilization and status
- `compliance` - Frozen requirements compliance check

---

## 🔧 SYSTEM ENDPOINTS

### Health & Status (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| GET | `/api/v1` | API info and available endpoints |

---

## 📚 DOCUMENTATION ENDPOINTS

All documentation endpoints return service-specific information including frozen requirements, endpoints, and compliance rules.

| Service | Documentation Endpoint |
|---------|------------------------|
| User | `/api/v1/users/docs` |
| Fleet | `/api/v1/fleet/docs` |
| Booking | `/api/v1/bookings/docs` |
| Payment | `/api/v1/payments/docs` |
| Admin | `/api/v1/admin/docs` |

---

## 🔒 AUTHENTICATION

### Headers Required for Protected Endpoints
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### JWT Token Payload
```json
{
  "userId": "user-uuid",
  "phoneNumber": "phone",
  "role": "shipper|carrier|driver|admin",
  "iat": "issued-at",
  "exp": "expiry-time"
}
```

---

## 🚨 FROZEN REQUIREMENTS

All endpoints enforce these frozen requirements:
- **Pricing:** ₹5/tonne/km (cannot be changed)
- **GST:** 18% on all invoices
- **Truck Types:** 10T, 15T, 20T only
- **Corridor:** Nalgonda-Miryalguda only
- **OTP:** 6-digit verification
- **Payments:** Manual processing only (NO payment gateway)
- **POD:** Max 2MB file size
- **Booking Window:** Min 1 hour, Max 7 days advance

---

## 📊 RATE LIMITS

| Endpoint Type | Rate Limit |
|---------------|------------|
| Registration | 10 requests per hour |
| OTP Verification | 5 attempts per hour |
| Booking Creation | 50 requests per hour |
| Invoice Generation | 100 requests per hour |
| General API | 100 requests per minute |

---

## 🔍 RESPONSE FORMATS

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [ ... ]
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 📈 METRICS & MONITORING

- **Request Logging:** All requests logged with request ID
- **Response Time:** Tracked for all endpoints
- **Audit Trail:** Critical operations logged
- **Performance Metrics:** Available at Prometheus endpoint
- **Dashboards:** Grafana at port 3000 (when deployed)

---

## 🛡️ SECURITY FEATURES

- JWT-based authentication
- Role-based access control (RBAC)
- OTP verification for login
- Sensitive data masking in logs
- Request rate limiting
- Input validation on all endpoints
- SQL injection prevention
- XSS protection