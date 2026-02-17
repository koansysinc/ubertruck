# API ENDPOINT MISMATCH - ROOT CAUSE ANALYSIS
**Date**: 2026-02-13T15:15:00Z
**Issue**: Frontend calling wrong API endpoints
**Error**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

---

## ROOT CAUSE

**Frontend is calling**: `/auth/login`
**Backend expects**: `/api/v1/users/login`

**Result**: 404 Not Found → HTML error page returned → JSON parse error

---

## ERROR TRACE

```
POST http://localhost:3000/auth/login
Status: 404 (Not Found)
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON

This happens because:
1. Frontend calls `/auth/login`
2. Backend doesn't have this route
3. Backend returns 404 HTML page
4. Frontend tries to parse HTML as JSON
5. JSON.parse() fails with "Unexpected token '<'"
```

---

## BACKEND ROUTES (VERIFIED)

**From**: `/home/koans/projects/ubertruck/src/index.js`

```javascript
// Line 90-95
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fleet', fleetRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
```

**All backend routes use prefix**: `/api/v1/`

---

## FRONTEND API CLIENT (INCORRECT)

**From**: `/home/koans/projects/ubertruck/ubertruck-ui/src/services/api.ts`

**Found Issues**:

| Line | Frontend Calls | Backend Expects | Status |
|------|----------------|-----------------|--------|
| 477 | `/auth/login` | `/api/v1/users/login` | ❌ WRONG |
| 517 | `/auth/verify-otp` | `/api/v1/users/verify-otp` | ❌ WRONG |
| 548 | `/auth/refresh` | `/api/v1/users/refresh` (if exists) | ❌ WRONG |
| 563 | `/users/profile` | `/api/v1/users/profile` | ❌ WRONG |
| 594 | `/bookings` | `/api/v1/bookings` | ❌ WRONG |
| 617 | `/bookings/{id}` | `/api/v1/bookings/{id}` | ❌ WRONG |
| 712 | `/payments/calculate` | `/api/v1/payments/calculate` | ❌ WRONG |
| 736 | `/payments/invoices/{id}` | `/api/v1/payments/invoices/{id}` | ❌ WRONG |
| 758 | `/tracking/{id}/status` | `/api/v1/tracking/{id}/status` | ❌ WRONG |
| 809 | `/fleet/vehicles` | `/api/v1/fleet/vehicles` | ❌ WRONG |

**Pattern**: Frontend is missing `/api/v1/` prefix on ALL endpoints

---

## WHY E2E TESTS PASSED BUT UI FAILS

**E2E Tests (Python/Bash)**:
- Called endpoints directly with full paths
- Example: `curl http://localhost:4000/api/v1/users/login`
- ✅ WORKED

**React UI**:
- Uses API client with base URL + endpoint path
- Base URL: `http://localhost:4000`
- Endpoint: `/auth/login`
- Full URL: `http://localhost:4000/auth/login` ❌ WRONG
- Should be: `http://localhost:4000/api/v1/users/login` ✅ CORRECT

---

## CORRECT ENDPOINT MAPPING

### Authentication Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `login()` | `/auth/login` | `/api/v1/users/login` |
| `verifyOtp()` | `/auth/verify-otp` | `/api/v1/users/verify-otp` |
| `refresh()` | `/auth/refresh` | `/api/v1/users/refresh` |

### User Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `getUserProfile()` | `/users/profile` | `/api/v1/users/profile` |
| `updateUserProfile()` | `/users/profile` | `/api/v1/users/profile` |

### Booking Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `createBooking()` | `/bookings` | `/api/v1/bookings` |
| `getBooking()` | `/bookings/{id}` | `/api/v1/bookings/{id}` |
| `listBookings()` | `/bookings` | `/api/v1/bookings` |
| `cancelBooking()` | `/bookings/{id}/cancel` | `/api/v1/bookings/{id}/cancel` |

### Payment Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `calculatePrice()` | `/payments/calculate` | `/api/v1/payments/calculate` |
| `getInvoice()` | `/payments/invoices/{id}` | `/api/v1/payments/invoices/{id}` |

### Tracking Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `getTrackingStatus()` | `/tracking/{id}/status` | `/api/v1/tracking/{id}/status` |
| `uploadPOD()` | `/tracking/{id}/pod` | `/api/v1/tracking/{id}/pod` |

### Fleet Endpoints
| Frontend Method | Current Path | Correct Path |
|----------------|--------------|--------------|
| `listVehicles()` | `/fleet/vehicles` | `/api/v1/fleet/vehicles` |
| `registerVehicle()` | `/fleet/vehicles` | `/api/v1/fleet/vehicles` |
| `listDrivers()` | `/fleet/drivers` | `/api/v1/fleet/drivers` |
| `registerDriver()` | `/fleet/drivers` | `/api/v1/fleet/drivers` |

---

## FIX REQUIRED

**Option 1: Fix Frontend API Client** ✅ RECOMMENDED
- Update all endpoint paths in `api.ts` to include `/api/v1/` prefix
- No backend changes needed
- Matches existing backend architecture

**Option 2: Add Backend Route Aliases** ❌ NOT RECOMMENDED
- Add duplicate routes without `/api/v1/` prefix
- Increases maintenance burden
- Creates confusion

**Option 3: Change Base URL in Frontend** ❌ NOT RECOMMENDED
- Set base URL to `http://localhost:4000/api/v1`
- But then registration might fail if it expects `/users/register` instead of just `/register`
- Still would need path corrections

---

## IMPLEMENTATION PLAN

### Step 1: Update api.ts Endpoints
Replace all endpoint paths to include `/api/v1/` prefix:

```typescript
// Authentication
'/auth/login' → '/api/v1/users/login'
'/auth/verify-otp' → '/api/v1/users/verify-otp'
'/auth/refresh' → '/api/v1/users/refresh'

// Users
'/users/profile' → '/api/v1/users/profile'

// Bookings
'/bookings' → '/api/v1/bookings'

// Payments
'/payments/calculate' → '/api/v1/payments/calculate'

// Fleet
'/fleet/vehicles' → '/api/v1/fleet/vehicles'
'/fleet/drivers' → '/api/v1/fleet/drivers'

// Tracking
'/tracking/{id}/status' → '/api/v1/tracking/{id}/status'
```

### Step 2: Verify Registration Endpoint
Check if registration uses `/auth/register` or `/users/register`

### Step 3: Test All Endpoints
- Login flow
- OTP verification
- Profile access
- Price calculation
- Booking creation

### Step 4: Update Documentation
Update E2E test report with corrected endpoint paths

---

## VERIFICATION COMMAND

After fix, test with:
```bash
# Frontend should now call correct endpoints
curl http://localhost:3000
# Check browser console - should see successful API calls

# Or test specific endpoint
curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999"}'
```

---

**Report Generated**: 2026-02-13T15:15:00Z
**Issue Type**: Frontend-Backend API Path Mismatch
**Severity**: HIGH (blocks all functionality)
**Resolution**: Update frontend api.ts with correct `/api/v1/` prefixed paths
