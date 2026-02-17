# UberTruck: Execution Framework & Master Prompt Templates

**Version**: 1.0
**Date**: 2026-02-13
**Status**: Ready for Implementation
**Audience**: Engineering Teams (Frontend, Backend, QA)

---

## Table of Contents

1. [Framework Overview](#framework-overview)
2. [Context Tracking Rules](#context-tracking-rules)
3. [Master Prompt Templates](#master-prompt-templates)
4. [Guardrails & Fail-Safe Mechanisms](#guardrails--fail-safe-mechanisms)
5. [Cross-Check Validation Checklist](#cross-check-validation-checklist)
6. [State Machine Tracking](#state-machine-tracking)
7. [Execution Workflow](#execution-workflow)

---

# FRAMEWORK OVERVIEW

## Purpose
Provide structured, reusable prompt templates that:
- Prevent frontend-backend misalignment
- Enforce consistent state management
- Validate against API contracts (Swagger)
- Track context across all phases
- Implement guardrails to catch errors early

## Key Principles
1. **Contract-First**: All code must match OpenAPI 3.1.0 spec
2. **State-Aware**: Every function understands its current state
3. **Validation-Strict**: No assumptions, validate everything
4. **Error-Visible**: All errors include request IDs + context
5. **Test-Integrated**: Test cases embedded in templates

---

# CONTEXT TRACKING RULES

## Rule 1: API Contract Alignment

Every API call must:
1. Match exact endpoint path from Swagger
2. Include all required fields per schema
3. Validate input format per regex patterns
4. Return response matching documented schema
5. Include requestId in every response for tracing

**Validation**:
```typescript
// ✅ CORRECT
const response = await api.bookings.create({
  pickupLocation: {
    lat: 17.0,           // Number, -90 to 90
    lng: 79.5,           // Number, -180 to 180
    pincode: '508001',   // Pattern: ^[5]\d{5}$ (India pincodes start with 5)
    address: '...',      // String, max 500 chars
    landmark: '...'      // String, max 200 chars
  },
  deliveryLocation: { /* same */ },
  cargoDetails: {
    type: 'GENERAL',     // Enum: GENERAL|FRAGILE|HAZMAT|PERISHABLE|HEAVY
    weight: 2.5,         // Number, 0.1-50
    volume: 5.0,         // Optional
    packages: 3,         // Integer >= 1
    description: '...',  // String, max 1000
    value: 50000,        // Optional, for insurance
    hsnCode: '0101'      // Pattern: ^\d{4,8}$
  },
  pickupContact: {
    name: 'John',        // String, 2-100
    phoneNumber: '+919876543210',  // Pattern: ^\+91[6-9]\d{9}$
    alternatePhone: '...'           // Optional
  },
  deliveryContact: { /* same */ },
  pickupTime: '2026-02-13T10:30:00Z',  // ISO datetime, >= now + 1 hour
  invoiceDetails: {
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-02-13',
    invoiceValue: 50000
  }
});

// ❌ WRONG
const response = await api.bookings.create({
  pickupLocation: { address: 'Somewhere' },  // Missing required fields
  cargoDetails: { weight: 100 },             // Out of range (0.1-50 only)
  phoneNumber: '9876543210'                  // Wrong format (needs +91 prefix)
});
```

---

## Rule 2: State Machine Compliance

Booking status follows strict state transitions:

```
CREATED → ASSIGNED → ACCEPTED → PICKUP_STARTED → IN_TRANSIT → DELIVERED → COMPLETED

Allowed transitions:
- CREATED  → ASSIGNED (system assigns vehicle)
- ASSIGNED → ACCEPTED (carrier accepts)
- ACCEPTED → PICKUP_STARTED (driver starts pickup)
- PICKUP_STARTED → IN_TRANSIT (cargo in transit)
- IN_TRANSIT → DELIVERED (reached destination)
- DELIVERED → COMPLETED (after POD upload)

Also allowed:
- CREATED or ASSIGNED → CANCELLED (before pickup starts)
```

**Validation**:
```typescript
// Define allowed transitions
const STATE_TRANSITIONS = {
  'CREATED': ['ASSIGNED', 'CANCELLED'],
  'ASSIGNED': ['ACCEPTED', 'CANCELLED'],
  'ACCEPTED': ['PICKUP_STARTED'],
  'PICKUP_STARTED': ['IN_TRANSIT'],
  'IN_TRANSIT': ['DELIVERED'],
  'DELIVERED': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': []
};

// ✅ CORRECT
const canTransition = (from, to) =>
  STATE_TRANSITIONS[from]?.includes(to) ?? false;

canTransition('CREATED', 'ASSIGNED');  // true
canTransition('CREATED', 'IN_TRANSIT'); // false - invalid

// ❌ WRONG
booking.status = 'COMPLETED';  // Without going through DELIVERED state
```

---

## Rule 3: Token Lifecycle Management

JWT tokens have specific lifecycles:

```
User logs in → GET /auth/login → OTP sent (sessionId, expiresIn=300s)
   ↓
User enters OTP → POST /auth/verify-otp → JWT token (expiresIn=3600s)
   ↓
Token stored → localStorage.token + localStorage.refreshToken
   ↓
API call uses Authorization: Bearer {token}
   ↓
If API returns 401 → POST /auth/refresh with refreshToken
   ↓
New token received → Update localStorage
   ↓
Retry original API call with new token
```

**Validation**:
```typescript
// ✅ CORRECT
const api = {
  async fetch(endpoint, options) {
    let response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.status === 401) {
      // Token expired, refresh it
      const refreshRes = await fetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken')
        })
      });

      if (refreshRes.ok) {
        const { token } = await refreshRes.json();
        localStorage.setItem('token', token);

        // Retry with new token
        response = await fetch(endpoint, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/auth';
      }
    }

    return response;
  }
};

// ❌ WRONG
// Storing token in localStorage without refreshToken
localStorage.setItem('token', token);  // What about renewal?

// Not handling 401 responses
const response = await fetch(endpoint);  // If 401, app crashes

// No token rotation
// Token expires, user is logged out abruptly
```

---

## Rule 4: Pricing Calculation Versioning

Every price calculation must include:
- Base rate (₹5/tonne/km - frozen requirement)
- Fuel surcharge (variable)
- GST calculation (18% total, split by state)
- Validity timestamp
- Request ID for tracing

```typescript
// ✅ CORRECT
const priceResult = {
  basePrice: 1250,              // 100 km * 2.5 tonnes * ₹5
  fuelSurcharge: 125,           // 10% surcharge
  gst: {
    taxableAmount: 1375,        // basePrice + fuelSurcharge
    cgst: 123.75,               // 9% (if same state)
    sgst: 123.75,               // 9% (if same state)
    igst: 0,                    // 0% (same state)
    // OR if different states:
    // igst: 247.5             // 18% (across states)
  },
  totalAmount: 1622.5,          // basePrice + fuelSurcharge + GST
  validUntil: '2026-02-13T11:30:00Z',  // Expires in 1 hour
  requestId: 'req-uuid-123'
};

// ❌ WRONG
const price = 450;  // Hardcoded price ignoring distance/weight
const price = distanceKm * 50;  // Wrong formula (should be ₹5/tonne/km, not per km)
const gst = totalAmount * 0.18;  // GST should be calculated first, then added
```

---

## Rule 5: Error Response Structure

Every error must include:
- Unique requestId (UUID)
- Structured error code (pattern: `[A-Z]{3}_[A-Z_]+`)
- User-friendly message
- Technical details for debugging
- Timestamp for correlation

```typescript
// ✅ CORRECT
const errorResponse = {
  code: 'BKG_INVALID_LOCATION',
  message: 'Pickup location pincode must be valid',
  details: {
    field: 'pickupLocation.pincode',
    value: '123456',
    rule: '^[5]\\d{5}$',
    suggestion: 'Indian pincodes must be 6 digits starting with 5'
  },
  timestamp: '2026-02-13T10:30:00Z',
  requestId: 'req-uuid-123'
};

// ❌ WRONG
const error = 'Invalid input';  // No context, no request ID
const error = { message: 'Error' };  // Missing structured code
const error = { statusCode: 400 };  // No details for debugging
```

---

# MASTER PROMPT TEMPLATES

## Template 1: API Service Layer Creation

### Task: Create Centralized API Client

**Input Requirements**:
- OpenAPI 3.1.0 specification (source of truth)
- List of endpoints to implement
- Authentication scheme (JWT + refresh tokens)
- Error handling requirements
- Retry logic specification

**Output Requirements**:
- `src/services/api.ts` (TypeScript)
- 150-200 lines of code
- Full test coverage (unit tests)
- No hardcoded values or test data
- Implements all context tracking rules

**Validation Rules**:
```typescript
// ✅ MUST HAVE
✓ Class-based API client
✓ Token storage/refresh logic
✓ Request/response logging
✓ Error transformation to structured format
✓ Automatic retry on 429/5xx
✓ Request ID propagation
✓ All endpoints match Swagger spec
✓ All payloads validated against schemas
✓ All responses typed against schemas
✓ 100% test coverage

// ❌ MUST NOT HAVE
✗ Hardcoded base URLs (unless in env vars)
✗ Console.log statements
✗ Untyped responses
✗ Global variables for state
✗ Synchronous API calls
✗ Direct localStorage access (use abstraction)
✗ Axios (prefer fetch native)
✗ Duplicate code across endpoints
```

**Master Prompt**:
```
Create the API service layer for UberTruck that will:

CONTEXT:
- This is the foundation for all backend communication
- Must prevent frontend-backend misalignment
- Must enforce API contract compliance
- Must be reusable across all screens

SPECIFICATION:
- Use OpenAPI 3.1.0 spec as source of truth: docs/10-critical-remediation/api-reference-openapi.yaml
- Implement JWT + refresh token handling automatically
- Transform all errors into structured format with request IDs
- Log all requests/responses for debugging
- Retry on network failures (max 3 attempts with exponential backoff)

ENDPOINTS TO IMPLEMENT (Phase 1):
1. POST /auth/login → returns { sessionId, otpExpiresIn }
2. POST /auth/verify-otp → returns { token, refreshToken, user }
3. POST /auth/refresh → returns { token, expiresIn }
4. GET /users/profile → returns user object
5. POST /bookings → returns { bookingId, bookingNumber, status, estimatedPrice }
6. GET /bookings/{id} → returns booking object
7. POST /payments/calculate → returns pricing with GST breakdown
8. GET /tracking/{id}/status → returns current status + history
9. POST /fleet/vehicles → returns registered vehicle
10. GET /fleet/vehicles → returns vehicle list

GUARDRAILS:
- All requests must include Authorization header (except /auth endpoints)
- All responses must be validated against schema before returning
- All errors must include requestId for tracing
- Token refresh must be transparent (automatic retry)
- No API call succeeds without type validation
- All HTTP status codes must be handled explicitly

VALIDATION RULES:
- Phone format: ^\+91[6-9]\d{9}$
- Pincode format: ^[5]\d{5}$
- OTP format: ^\d{6}$
- GST format: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
- All regex patterns from OpenAPI spec must be enforced

OUTPUT:
- File: src/services/api.ts
- Type definitions: TypeScript interfaces for all payloads
- Error types: Custom error class with structured properties
- Test file: src/services/api.test.ts with 20+ test cases
- Documentation: JSDoc comments for every method

CROSS-CHECK:
Before submitting:
- [ ] All endpoints in template are implemented
- [ ] All schemas match OpenAPI spec
- [ ] All validation rules from spec are enforced
- [ ] Token refresh tested with 401 response
- [ ] Error transformation tested
- [ ] Request IDs on every response
- [ ] No hardcoded values
- [ ] TypeScript strict mode passes
- [ ] Test coverage >= 90%
```

---

## Template 2: Authentication Flow Implementation

### Task: Complete OTP-Based Authentication

**Input Requirements**:
- API service layer (from Template 1)
- Auth flow diagram (phone → OTP → JWT)
- User profile context
- Navigation/routing setup
- Token storage mechanism

**Output Requirements**:
- 3 new screens (PhoneEntry, OTPVerification, ProfileSetup)
- Auth context/hook for state management
- Session persistence
- Error handling with user feedback
- Full test coverage

**Master Prompt**:
```
Implement complete authentication flow that:

CONTEXT:
- User must go through OTP verification (not skip it)
- Must support both login and registration paths
- Must store tokens securely
- Must handle session expiration gracefully

FLOW REQUIREMENTS:

Screen 1: PhoneEntry
├─ Input: Phone number (+91XXXXXXXXXX format)
├─ Validation: Real-time format validation
├─ API Call: POST /auth/login → gets sessionId
├─ On Success: Show OTP screen with sessionId
├─ On Error: Show error message + retry
├─ Guardrails:
│  ├─ Accept only Indian phone numbers
│  ├─ Disable button until valid phone
│  ├─ Show loading state during API call
│  └─ Show specific error messages (not generic "error")

Screen 2: OTPVerification
├─ Input: 6-digit OTP
├─ Display: Countdown timer (5 minutes)
├─ API Call: POST /auth/verify-otp → gets JWT
├─ On Success: Save tokens + navigate to dashboard
├─ On Error: Show error + resend option
├─ Guardrails:
│  ├─ Accept only 6 digits
│  ├─ Auto-focus on first digit
│  ├─ Show countdown timer
│  ├─ Disable verify button if OTP incomplete
│  ├─ Show remaining attempts on 429 (rate limit)
│  └─ Auto-resend after timer expires (optional)

Screen 3: ProfileSetup (for new users)
├─ Input: Business name, address, GST (optional)
├─ API Call: PUT /users/profile → save profile
├─ On Success: Navigate to dashboard
├─ On Error: Stay on screen + show error

State Management:
├─ useAuth() hook that returns:
│  ├─ user: { id, phone, businessName, userType, verified }
│  ├─ token: string | null
│  ├─ isLoading: boolean
│  ├─ error: string | null
│  ├─ login: (phone) => Promise<void>
│  ├─ verifyOtp: (otp) => Promise<void>
│  ├─ logout: () => void
│  └─ refreshToken: () => Promise<void> (automatic)

Token Storage:
├─ Store token in httpOnly cookie (preferred) OR
├─ localStorage with encryption (fallback)
├─ Store refreshToken separately
├─ Clear tokens on logout
├─ Check token expiry on app load

GUARDRAILS:
- No token should be logged or shown in console
- No sensitive data in localStorage unencrypted
- OTP input should be masked/hidden
- Timers must reset on resend
- Navigation to protected routes should check token first
- Token refresh must happen transparently (no user interaction)
- Handle network errors gracefully (offline detection)

VALIDATION:
- Phone: ^\+91[6-9]\d{9}$
- OTP: ^\d{6}$ (exactly 6 digits)
- Business name: 3-200 characters
- GST (optional): ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$

TESTING:
- [ ] Happy path: phone → OTP → dashboard
- [ ] Invalid phone rejected
- [ ] Invalid OTP rejected
- [ ] OTP timeout (5 min)
- [ ] Resend OTP works
- [ ] Rate limiting (429) handled
- [ ] Network error → retry
- [ ] Token refresh on 401
- [ ] Logout clears tokens
- [ ] Session persists on reload
```

---

## Template 3: Dynamic Price Calculation

### Task: Implement Real-Time Pricing with GST

**Input Requirements**:
- Pricing formula (₹5/tonne/km - frozen)
- GST rules (CGST 9% + SGST 9% OR IGST 18%)
- Surcharge rules (fuel, night delivery, urgent)
- State mapping for GST split
- Price validity rules (1-hour expiry)

**Output Requirements**:
- `usePriceCalculation` hook
- Price display component with GST breakdown
- Real-time validation of inputs
- Request caching to reduce API calls
- Full test coverage

**Master Prompt**:
```
Implement dynamic pricing that:

CALCULATION FORMULA (FROZEN REQUIREMENT):
Base Price = Distance (km) × Weight (tonnes) × ₹5

Example:
- Distance: 100 km
- Weight: 2.5 tonnes
- Base Price = 100 × 2.5 × 5 = ₹1250

SURCHARGES (Applied to base price):
- Fuel surcharge: 10% (if selected)
- Night delivery: +15% (between 10pm-6am)
- Urgent delivery: +25% (delivery within 6 hours)

GST CALCULATION (After surcharges):
Taxable Amount = Base Price + Surcharges
GST = Taxable Amount × 18%

Split by state:
- Same state: CGST 9% + SGST 9% (split equal)
- Different states: IGST 18% (single line item)

Example (same state):
- Taxable Amount: ₹1375 (1250 + 125 fuel)
- CGST (9%): ₹123.75
- SGST (9%): ₹123.75
- Total GST: ₹247.50
- Final Price: ₹1375 + ₹247.50 = ₹1622.50

VALIDATION RULES:
- Distance: > 0 km (required)
- Weight: 0.1 - 50 tonnes (required)
- Vehicle type: TRUCK|MINI_TRUCK|TRAILER|CONTAINER (required)
- Pincode (pickup): ^[5]\d{5}$ (required)
- Pincode (delivery): ^[5]\d{5}$ (required)
- Price valid until: Must be >= now + 1 hour

API CALL:
Endpoint: POST /payments/calculate
Request body:
{
  distance: number,
  weight: number,
  vehicleType: string,
  cargoType?: string,
  pickupPincode: string,
  deliveryPincode: string,
  surcharges?: {
    fuelSurcharge: boolean,
    nightDelivery: boolean,
    urgentDelivery: boolean
  }
}

Response:
{
  basePrice: number,
  fuelSurcharge: number,
  gst: {
    taxableAmount: number,
    cgst: number,
    sgst: number,
    igst: number
  },
  totalAmount: number,
  validUntil: string (ISO datetime),
  requestId: string
}

GUARDRAILS:
- No hardcoded prices
- Every API call must have pricing validation
- Price must update whenever distance/weight changes
- Price validity must be checked before booking
- Expired prices must show warning
- GST calculation must match legal requirements
- All intermediate calculations must be visible
- Minimum charge rules must be enforced

CACHING RULES:
- Cache pricing for 5 minutes (or until validUntil)
- Cache key: JSON.stringify({ distance, weight, vehicleType })
- Invalidate on pincode change
- Show "Calculating..." during API call

COMPONENTS NEEDED:
1. usePriceCalculation hook
   - Input: { distance, weight, vehicleType, ... }
   - Output: { pricing, isLoading, error, refresh }

2. PriceBreakdown component
   - Show: Base Price | Surcharges | GST components | Total
   - Show: Valid until timestamp
   - Show: Request ID for debugging

3. PriceInputForm component
   - Inputs: distance, weight, vehicle type, pincodes
   - Real-time validation
   - Price updates on change

TEST CASES:
- [ ] Basic calculation (100 km, 2.5 tonnes) = ₹1250
- [ ] With fuel surcharge (+10%)
- [ ] With night delivery (+15%)
- [ ] With urgent delivery (+25%)
- [ ] Same state GST (CGST 9% + SGST 9%)
- [ ] Different state GST (IGST 18%)
- [ ] Price caching works
- [ ] Expired prices show warning
- [ ] Invalid inputs rejected
- [ ] API error handling
- [ ] Decimal precision (paise level)

CROSS-CHECK:
- [ ] All calculations match frozen ₹5/tonne/km formula
- [ ] GST split correct based on state
- [ ] Price validity timestamp enforced
- [ ] Caching reduces API calls
- [ ] All surcharges optional and correctly applied
```

---

## Template 4: Real-Time Tracking with Polling

### Task: Implement Live Booking Status Updates

**Input Requirements**:
- Tracking API endpoint spec
- Status state machine definition
- Polling interval requirements
- WebSocket alternative (optional)
- Error handling for offline scenarios

**Output Requirements**:
- Real-time status component
- Automatic polling with UI indicators
- Status history display
- Offline detection and handling
- Full test coverage

**Master Prompt**:
```
Implement real-time tracking that:

FLOW REQUIREMENTS:

Polling Strategy:
├─ Poll every 10 seconds (not 5s to reduce load)
├─ Use exponential backoff on failures (10s → 20s → 30s)
├─ Stop polling when status = COMPLETED or CANCELLED
├─ Resume polling if user navigates back
├─ Show offline indicator if no response in 30s

Status Display:
├─ Current status: Large, clear indicator
├─ Status history: Timeline with timestamps
├─ Location: If available, show on map
├─ Estimated delivery: If available, show countdown
├─ Last update: Show timestamp of last status change
├─ Request ID: Show in details (for support)

Status Transitions (Validate against state machine):
├─ CREATED → ASSIGNED (waiting for carrier to accept)
├─ ASSIGNED → ACCEPTED (carrier accepted)
├─ ACCEPTED → PICKUP_STARTED (driver picked up cargo)
├─ PICKUP_STARTED → IN_TRANSIT (in transit)
├─ IN_TRANSIT → DELIVERED (reached destination)
├─ DELIVERED → COMPLETED (after POD uploaded)
└─ Any → CANCELLED (if cancelled by shipper)

API CALL:
Endpoint: GET /tracking/{bookingId}/status
Response:
{
  currentStatus: string,
  statusHistory: [
    {
      status: string,
      timestamp: ISO datetime,
      location: { lat, lng, address },
      notes: string,
      networkStatus: 'online'|'offline'
    }
  ],
  estimatedDelivery: ISO datetime,
  lastUpdate: ISO datetime,
  requestId: string
}

GUARDRAILS:
- No hardcoded status updates (only from API)
- Invalid state transitions must be rejected
- Network errors must not crash the UI
- Offline status must be visible
- Polling must stop automatically when booking is complete
- Navigation away must pause polling (resume on return)
- Failed polls must retry with backoff
- Request IDs must be logged for debugging

OFFLINE HANDLING:
├─ Detect offline: navigator.onLine OR no response in 30s
├─ Show offline banner at top
├─ Queue any user actions (e.g., POD upload)
├─ Retry queued actions when online
├─ Show last known status while offline

COMPONENTS NEEDED:
1. useTracking hook
   - Input: bookingId, enabled (boolean)
   - Output: { status, isLoading, error, isOffline }
   - Side effect: Auto-polling

2. StatusTimeline component
   - Show status history as timeline
   - Each item: status + timestamp + location

3. CurrentStatus component
   - Large indicator showing current status
   - Countdown to delivery if available
   - Offline indicator if applicable

4. OfflineBanner component
   - Shows when offline
   - Auto-hides when online
   - Retries queued actions

ERROR HANDLING:
- 404: Booking not found → show error
- 401: Unauthorized → redirect to login
- 5xx: Server error → retry with backoff
- Network error: Show offline banner
- Invalid status: Log and ignore

TESTING:
- [ ] Polling starts when component mounts
- [ ] Polling stops when status = COMPLETED
- [ ] Status updates in real-time (mock API)
- [ ] Offline detected and banner shown
- [ ] Status transitions validated
- [ ] Request ID in each response
- [ ] Network error → retry works
- [ ] Navigation preserves polling state
- [ ] No duplicate requests
- [ ] Memory cleanup on unmount

PERFORMANCE:
- Cache last status (don't re-render on same status)
- Batch updates if multiple come in quick succession
- Unsubscribe from polling on unmount
- No memory leaks
```

---

## Template 5: Input Validation & Error Handling

### Task: Enforce Validation Rules Across App

**Input Requirements**:
- Validation rules from OpenAPI spec
- Error message specifications
- User feedback requirements
- Regex patterns for all inputs
- Error code mapping

**Output Requirements**:
- Validation utility library
- Error boundary component
- Input validation hooks
- Error display component
- Full test coverage

**Master Prompt**:
```
Create validation system that:

VALIDATION RULES (From OpenAPI Spec):

1. Phone Number
   - Format: ^\+91[6-9]\d{9}$
   - Accepts: +919876543210 or 9876543210 (auto-adds +91)
   - Rejects: any other format
   - Error: "Please enter a valid 10-digit phone number"

2. OTP
   - Format: ^\d{6}$
   - Accepts: 123456 (exactly 6 digits)
   - Rejects: 12345, 1234567, ABC123
   - Error: "Please enter a 6-digit OTP"

3. Pincode
   - Format: ^[5]\d{5}$ (starts with 5, total 6 digits)
   - Accepts: 508001, 500001
   - Rejects: 123456 (doesn't start with 5)
   - Error: "Invalid pincode (must start with 5)"

4. Weight (Cargo)
   - Format: 0.1 - 50 (tonnes)
   - Accepts: 0.5, 10, 50
   - Rejects: 0.05 (too small), 51 (too large)
   - Error: "Weight must be between 0.1 and 50 tonnes"

5. GST Number
   - Format: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
   - Example: 27AABCC1234A1Z5
   - Error: "Invalid GST format"

6. IFSC Code (Bank)
   - Format: ^[A-Z]{4}0[A-Z0-9]{6}$
   - Example: HDFC0000123
   - Error: "Invalid IFSC code"

7. Vehicle Registration
   - Format: ^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$
   - Example: TG01AB1234
   - Error: "Invalid vehicle registration number"

8. License Number
   - Format: ^[A-Z]{2}[0-9]{2}[0-9]{11}$
   - Example: TS0220234567890
   - Error: "Invalid license number"

9. Email (Optional)
   - Format: Standard email regex
   - Error: "Invalid email address"

10. Date & Time
    - Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
    - Validation: Must be >= now + 1 hour (for bookings)
    - Error: "Booking must be at least 1 hour in advance"

VALIDATION UTILITY FUNCTIONS:

export const validate = {
  phone: (value: string): { valid: boolean, error?: string } => { ... },
  otp: (value: string): { valid: boolean, error?: string } => { ... },
  pincode: (value: string): { valid: boolean, error?: string } => { ... },
  weight: (value: number): { valid: boolean, error?: string } => { ... },
  gst: (value: string): { valid: boolean, error?: string } => { ... },
  // ... all others
};

FORM VALIDATION HOOK:

const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (rule && rule.validate) {
      const result = rule.validate(value);
      return result.error || null;
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Validate on change
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { values, errors, touched, handleChange, handleBlur, validateAll };
};

ERROR BOUNDARY:

<ErrorBoundary>
  <App />
</ErrorBoundary>

Catches:
- JavaScript errors
- API errors
- Validation errors
- Network errors

Shows:
- Error message
- Request ID
- Suggested action
- Retry button

ERROR DISPLAY:

Show validation errors:
- [ ] Below input field (red text)
- [ ] On hover (tooltip)
- [ ] On form submit (highlighted field)
- [ ] Include actionable suggestion

Error codes must follow pattern:
- AUTH_*: Authentication errors
- BKG_*: Booking errors
- PRC_*: Pricing errors
- VAL_*: Validation errors
- NET_*: Network errors

GUARDRAILS:
- Don't allow form submission with errors
- Show errors only after blur (not on every keystroke)
- Clear errors when user fixes input
- Don't persist errors across sessions
- Log all validation failures with context
- Include request ID in error logs

TESTING:
- [ ] Valid inputs pass validation
- [ ] Invalid inputs rejected
- [ ] Error messages clear and actionable
- [ ] Validation rules from spec enforced
- [ ] Form can't submit with errors
- [ ] Errors cleared on fix
- [ ] Error boundary catches crashes
- [ ] Request IDs in all errors
```

---

# GUARDRAILS & FAIL-SAFE MECHANISMS

## Guardrail 1: Contract Enforcement

**Hard Constraint**: No API call succeeds without schema validation

```typescript
// ✅ CORRECT
const booking = await api.fetch('/bookings', {
  method: 'POST',
  body: validateAgainstSchema(payload, BookingRequestSchema)
});

// ❌ REJECTED
const booking = await api.fetch('/bookings', {
  method: 'POST',
  body: payload  // No validation
});
```

**Fail-Safe**: Throw error if validation fails
```typescript
if (!isValidAgainstSchema(payload, schema)) {
  throw new ValidationError({
    code: 'SCHEMA_MISMATCH',
    message: 'Payload does not match API schema',
    details: getValidationErrors(payload, schema),
    requestId: generateRequestId()
  });
}
```

---

## Guardrail 2: State Machine Enforcement

**Hard Constraint**: Only allow valid status transitions

```typescript
// ✅ CORRECT
if (canTransition(currentStatus, newStatus)) {
  updateStatus(newStatus);
}

// ❌ REJECTED
booking.status = 'COMPLETED';  // Without going through DELIVERED
```

**Fail-Safe**: Log invalid transitions and alert
```typescript
function updateStatus(bookingId, newStatus) {
  const booking = getBooking(bookingId);

  if (!canTransition(booking.status, newStatus)) {
    logError({
      type: 'INVALID_STATE_TRANSITION',
      from: booking.status,
      to: newStatus,
      bookingId,
      requestId: generateRequestId()
    });
    throw new StateTransitionError(...);
  }

  // Proceed with update
}
```

---

## Guardrail 3: Token Expiry & Refresh

**Hard Constraint**: Transparent token refresh on 401

```typescript
// ✅ CORRECT
if (response.status === 401) {
  const newToken = await refreshToken();
  localStorage.setItem('token', newToken);
  return retry(originalRequest, newToken);
}

// ❌ REJECTED
if (response.status === 401) {
  // Silently fail or log out without trying refresh
  logout();
}
```

---

## Guardrail 4: No Hardcoded Values

**Hard Constraint**: All magic numbers must be constants with comments

```typescript
// ✅ CORRECT
const PRICING_RATE_PER_TONNE_KM = 5;  // Frozen requirement
const GST_RATE = 0.18;
const OTP_EXPIRY_SECONDS = 300;
const TOKEN_REFRESH_THRESHOLD = 5 * 60;  // 5 minutes before expiry

// ❌ REJECTED
const price = distance * weight * 450;  // Hardcoded, wrong formula
setTimer(300);  // Magic number, no explanation
```

---

## Guardrail 5: Request ID Propagation

**Hard Constraint**: Every request/response must include request ID

```typescript
// ✅ CORRECT
const requestId = generateUUID();
const response = await fetch(url, {
  headers: { 'X-Request-ID': requestId }
});
// Response must include same requestId

// ❌ REJECTED
const response = await fetch(url);  // No request ID
```

---

## Guardrail 6: Offline Detection

**Hard Constraint**: Detect offline and queue requests

```typescript
// ✅ CORRECT
if (!navigator.onLine) {
  queueRequest(request);
  showOfflineBanner();
  return;
}

const response = await fetch(url);

// ❌ REJECTED
const response = await fetch(url);  // Crashes if offline
```

---

## Guardrail 7: Error Visibility

**Hard Constraint**: All errors must surface to user

```typescript
// ✅ CORRECT
try {
  await api.createBooking(booking);
} catch (error) {
  showErrorToast({
    message: error.message,
    requestId: error.requestId,
    action: 'Retry'
  });
}

// ❌ REJECTED
try {
  await api.createBooking(booking);
} catch (error) {
  console.error(error);  // Silently logged, user doesn't see
}
```

---

# CROSS-CHECK VALIDATION CHECKLIST

## Pre-Commit Validation

### Code Quality
```
✓ TypeScript strict mode passes
✓ No console.log statements
✓ No var (only const/let)
✓ No any types (unless @ts-ignore with justification)
✓ No hardcoded values (use constants)
✓ All functions documented with JSDoc
✓ All types exported in index.ts
✓ Max function length: 30 lines (break up long functions)
✓ No duplicated code
```

### API Contract Alignment
```
✓ All endpoints in code match Swagger spec
✓ All request payloads include required fields
✓ All response payloads match spec schemas
✓ All validation patterns from spec are enforced
✓ All error codes follow spec format
✓ All HTTP status codes handled explicitly
```

### State Management
```
✓ State transitions follow state machine
✓ No orphaned states (all states reachable)
✓ No circular transitions (unless intentional)
✓ State changes logged with request ID
✓ State persisted across navigation
✓ State cleared on logout
```

### Testing
```
✓ All functions have unit tests
✓ All API calls have integration tests
✓ All error paths tested
✓ Happy path tested
✓ Edge cases tested (empty arrays, null values, etc.)
✓ Test coverage >= 80%
✓ All tests pass locally
✓ All tests pass in CI/CD
```

### Security
```
✓ No tokens in localStorage (use httpOnly cookies)
✓ No sensitive data in logs
✓ No passwords in error messages
✓ No API keys in frontend code
✓ HTTPS enforced in production
✓ CORS configured properly
✓ No XSS vulnerabilities (sanitize user input)
✓ No CSRF vulnerabilities (token validation)
```

### Performance
```
✓ No N+1 queries
✓ API responses cached where applicable
✓ Images optimized
✓ Lazy loading implemented
✓ Bundle size monitored
✓ No memory leaks
✓ Page load time < 3 seconds
✓ API response time p95 < 200ms
```

### UX States
```
✓ Loading indicators visible
✓ Error messages clear and actionable
✓ Success feedback visible
✓ Disabled states clear
✓ Empty states handled
✓ No jank or flickering
```

---

## Pre-Merge Validation

All pre-commit checks PLUS:

```
✓ Code reviewed by 2 developers
✓ Tests reviewed by QA
✓ API contract validated against Swagger
✓ No breaking changes
✓ Backwards compatible (if possible)
✓ Database migrations tested
✓ Environment variables documented
```

---

## Pre-Deployment Validation

All pre-merge checks PLUS:

```
✓ Load testing passed (1000 req/s)
✓ Stress testing passed (10,000 concurrent users)
✓ Soak testing passed (24 hours)
✓ Security scanning passed (OWASP Top 10)
✓ Accessibility audit passed (WCAG 2.1 AA)
✓ Performance baseline established
✓ Monitoring dashboard configured
✓ Alerting rules configured
✓ Runbooks created
✓ Rollback plan documented
```

---

# STATE MACHINE TRACKING

## Booking Status State Machine

```
Diagram:
┌──────────┐
│ CREATED  │
└────┬─────┘
     │
     ├─→ CANCELLED (if shipper cancels before pickup)
     │
     └─→ ASSIGNED (system assigns vehicle)
         │
         ├─→ CANCELLED (if shipper cancels before carrier accepts)
         │
         └─→ ACCEPTED (carrier accepts booking)
             │
             └─→ PICKUP_STARTED (driver begins pickup)
                 │
                 └─→ IN_TRANSIT (cargo in transit)
                     │
                     └─→ DELIVERED (reached destination)
                         │
                         └─→ COMPLETED (after POD uploaded)

Cancellation Rules:
- Before PICKUP_STARTED: Full or partial refund possible
- After PICKUP_STARTED: Cannot cancel (or 100% cancellation fee)

Validation:
- No backtracking (can't go from IN_TRANSIT back to ASSIGNED)
- No skipping states (must go through all states in order)
- CANCELLED is terminal (no transitions out)
- COMPLETED is terminal (no transitions out)
```

## Logging Requirements

Every state transition must log:
```typescript
{
  transitionId: UUID,
  bookingId: UUID,
  fromStatus: string,
  toStatus: string,
  timestamp: ISO8601,
  userId: UUID (who triggered),
  ipAddress: string,
  requestId: UUID (correlate with API call),
  metadata: {
    reason?: string,
    cancellationFee?: number,
    refundAmount?: number
  }
}
```

---

# EXECUTION WORKFLOW

## Phase 1 Execution (Week 1)

### Day 1-2: API Service Layer
1. Read Template 1 (API Service Layer)
2. Create `src/services/api.ts`
3. Implement all Phase 1 endpoints
4. Create test file with 20+ tests
5. Achieve 90%+ coverage
6. **Checkpoint**: API calls work, schemas validated

### Day 2-3: Authentication
1. Read Template 2 (Auth Flow)
2. Create PhoneEntry screen
3. Create OTPVerification screen
4. Create useAuth hook
5. Implement token storage
6. Add session persistence
7. **Checkpoint**: Can log in, tokens stored

### Day 3-4: Booking Creation
1. Read Template 3 (Dynamic Pricing)
2. Add location picker
3. Add cargo details form
4. Add contact person form
5. Integrate price calculation
6. **Checkpoint**: Full booking form works, price calculates

### Day 5: Testing & QA
1. Run all tests (>80% coverage)
2. Manual testing: auth flow
3. Manual testing: booking flow
4. Manual testing: price changes
5. Fix bugs found
6. **Checkpoint**: Phase 1 complete

---

## Phase 2 Execution (Weeks 2-3)

### Real-Time Tracking
1. Read Template 4 (Real-Time Tracking)
2. Implement polling
3. Implement status timeline
4. Implement offline detection
5. Add POD upload capability
6. **Checkpoint**: Live tracking works

### Fleet Management
1. Create vehicle list screen
2. Create vehicle details screen
3. Create add vehicle form
4. Create driver list screen
5. Create add driver form
6. Implement CRUD operations
7. **Checkpoint**: Carriers can manage fleet

### GST & Invoicing
1. Show GST breakdown in price
2. Add invoice generation
3. Add invoice download
4. Add E-Way Bill generation (if value >= 50k)
5. **Checkpoint**: GST tracking works

---

## Phase 3 Execution (Week 4)

### Error Handling & Monitoring
1. Create error boundary
2. Add global error handler
3. Implement request ID logging
4. Create error dashboard
5. Set up alerting
6. **Checkpoint**: Errors visible, tracked, logged

### Optimization
1. Implement caching
2. Optimize images
3. Code splitting
4. Lazy loading
5. Performance monitoring
6. **Checkpoint**: Load time < 3 seconds

---

## Cross-Check After Each Phase

After completing each phase, run:
```
✓ Pre-Commit Validation (all checks)
✓ Code Review (2 developers)
✓ Test Coverage (>=80%)
✓ Manual Testing (QA)
✓ API Contract Check (swagger validation)
✓ Regression Testing (all previous features)
✓ Performance Testing (load time, API response)
```

---

## Success Metrics

### Phase 1
- Auth success rate > 95%
- Booking creation success > 90%
- Test coverage >= 80%
- Zero hardcoded values
- API contract violations: 0

### Phase 2
- Tracking accuracy > 99%
- POD upload success > 95%
- Fleet management CRUD working 100%
- Error rate < 1%
- Test coverage >= 85%

### Phase 3
- System uptime > 99.5%
- Error rate < 0.5%
- API response time p95 < 200ms
- Page load time < 3 seconds
- Test coverage >= 90%

---

## Documentation Requirements

After each feature:
1. Update API documentation
2. Update user manual
3. Update runbooks
4. Update error codes list
5. Update deployment guide

---

**Document prepared by**: Architecture Team
**Date**: 2026-02-13
**Status**: Ready for execution
**Next**: Assign Phase 1 tasks to developers

