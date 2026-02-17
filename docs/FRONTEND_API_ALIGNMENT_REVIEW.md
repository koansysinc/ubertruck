# UberTruck Frontend-API Alignment Review

## Executive Summary

The current React frontend prototype implements a polished mobile UX flow but has **significant misalignments** with the comprehensive REST API defined in OpenAPI 3.1.0 specification. The frontend is using mock data and simplified flows, while the API supports complex enterprise features (GST, E-Way Bills, settlements, driver verification).

**Overall Status**: ⚠️ **CRITICAL GAPS** - Frontend needs substantial refactoring to align with API capabilities.

---

## Part 1: Frontend Code Structure Analysis

### Current Implementation
```
Frontend (React + Framer Motion):
├── Splash Screen (2s auto-advance)
├── Auth Screen (Phone number only)
├── Dashboard (Basic booking CTA)
├── Booking Screen (Truck selection)
└── Tracking Screen (Live animation)
```

### Architecture Issues

| Issue | Severity | Details |
|-------|----------|---------|
| No API integration | CRITICAL | Uses mock data, no actual API calls |
| Incomplete auth flow | CRITICAL | Missing OTP verification, token handling |
| No user role distinction | CRITICAL | All users see same flows (should differ by role) |
| Hardcoded pricing | HIGH | Uses mock truck types, no dynamic pricing |
| No error handling | HIGH | No API error states, loading states, or retries |
| Missing screens | HIGH | No fleet management, driver tracking, invoicing |

---

## Part 2: API Specification vs Frontend Gaps

### A. Authentication (API: `/auth/*`)

#### API Provides:
```
POST /auth/register       → UserRegistration → OTP sent
POST /auth/verify-otp     → OTPVerification → JWT token
POST /auth/login          → Phone → OTP sent
POST /auth/refresh        → RefreshToken → New JWT
GET  /users/profile       → User profile with GST, bank details
PUT  /users/profile       → Update profile
POST /users/bank-details  → Bank verification
```

#### Frontend Implements:
```javascript
// AuthScreen - INCOMPLETE
const AuthScreen = ({ onLogin }) => {
  const [phone, setPhone] = useState('');

  // ❌ NO API CALL
  // ❌ NO OTP VERIFICATION STEP
  // ❌ NO TOKEN STORAGE/REFRESH

  return <input phone />; // Direct login bypass
};
```

#### Gaps:
1. **No OTP flow** - API requires `/auth/verify-otp` with 6-digit OTP
2. **No token management** - Frontend doesn't store/use JWT tokens
3. **No refresh token handling** - Session management missing
4. **No phone validation** - API requires pattern: `^\+91[6-9]\d{9}$`
5. **No registration vs login distinction** - Same flow for both

#### Required Frontend Changes:

```typescript
// NEED: Complete auth flow
interface AuthState {
  sessionId: string;      // From /auth/register or /auth/login
  phoneNumber: string;
  otpSent: boolean;
  otpExpiresIn: number;   // 300 seconds from API
  token?: string;
  refreshToken?: string;
}

// SCREENS NEEDED:
// 1. PhoneEntry → calls /auth/login or /auth/register
// 2. OTPVerify → calls /auth/verify-otp
// 3. ProfileSetup (for new users) → PUT /users/profile
// 4. BankDetails (optional) → POST /users/bank-details
```

---

### B. Booking Management (API: `/bookings/*`)

#### API Requires (BookingRequest schema):
```yaml
pickupLocation:          # Required: {lat, lng, pincode, address}
deliveryLocation:        # Required: {lat, lng, pincode, address}
cargoDetails:           # Required
  - type: GENERAL|FRAGILE|HAZMAT|PERISHABLE|HEAVY
  - weight: 0.1-50 tonnes
  - volume: cubic meters
  - packages: integer
  - description: max 1000 chars
  - value: for insurance
  - hsnCode: for E-Way Bill (pattern: ^\d{4,8}$)
invoiceDetails:         # Optional but recommended
  - invoiceNumber
  - invoiceDate
  - invoiceValue
pickupContact:          # Required: {name, phone}
deliveryContact:        # Required: {name, phone}
specialInstructions:    # Optional, max 500 chars
pickupTime:            # Required: ISO datetime
```

#### Frontend Implements:
```javascript
// BookingScreen - OVERSIMPLIFIED
const BookingScreen = ({ onConfirm }) => {
  const [selectedTruck, setSelectedTruck] = useState('mini');

  // ❌ MISSING: Cargo details form
  // ❌ MISSING: Contact person info
  // ❌ MISSING: Invoice/GST details
  // ❌ MISSING: Location details (lat/lng/pincode)
  // ❌ MISSING: Price calculation API call

  return (
    <div>
      <TruckSelector />  // Only truck selection
    </div>
  );
};
```

#### Gaps:
1. **No location picker** - API requires lat/lng/pincode for both locations
2. **No cargo details form** - Missing weight, type, HSN code
3. **No contact person collection** - API requires name + phone for both ends
4. **No price calculation** - Should call `POST /payments/calculate`
5. **No GST/Invoice handling** - API supports full GST compliance
6. **No truck type mapping** - Frontend mock types don't match API types: `TRUCK|MINI_TRUCK|TRAILER|CONTAINER`

#### Required Frontend Changes:

```typescript
// SCREENS NEEDED:
// 1. LocationPicker → Search & map-based location selection
//    - Should collect: address, landmark, lat/lng, pincode
//
// 2. CargoDetails → Form for cargo info
//    - Type selector (GENERAL/FRAGILE/HAZMAT/PERISHABLE/HEAVY)
//    - Weight input (0.1-50 tonnes)
//    - Volume, packages, description
//    - Insurance value
//    - HSN code (for GST compliance)
//
// 3. ContactDetails → Pickup & delivery person info
//    - Name + phone for both ends
//
// 4. PriceBreakdown → After collecting data
//    - Call POST /payments/calculate
//    - Show: basePrice, fuelSurcharge, GST (CGST/SGST/IGST), total
//    - Show validUntil timestamp
//
// 5. InvoiceDetails (Optional) → For business shipments
//    - Invoice number, date, value
//
// 6. ConfirmBooking → Review screen
//    - Call POST /bookings with full BookingRequest
//    - Show estimatedDeliveryTime from response
//    - Show booking number (BK format)
```

---

### C. Fleet Management (API: `/fleet/*`)

#### API Provides:
```
GET    /fleet/vehicles              → List carrier vehicles
POST   /fleet/vehicles              → Register new vehicle
GET    /fleet/vehicles/{vehicleId}  → Get details
PUT    /fleet/vehicles/{vehicleId}  → Update
DELETE /fleet/vehicles/{vehicleId}  → Remove

GET    /fleet/drivers               → List drivers
POST   /fleet/drivers               → Register new driver
```

#### Requires (Vehicle schema):
```yaml
registrationNumber: TG01AB1234      # Pattern validation
vehicleType: TRUCK|MINI_TRUCK|TRAILER|CONTAINER
capacity: 1-50 tonnes
make, model, year
fitnessValidUpto: date
permitValidUpto: date
insuranceValidUpto: date
gpsEnabled: boolean
vahanVerified: boolean              # Vahan API integration
vahanResponse: object
```

#### Frontend Status:
```javascript
// ❌ COMPLETELY MISSING
// No fleet management screens at all
```

#### Required Addition:
```typescript
// SCREENS NEEDED FOR CARRIERS:
// 1. FleetDashboard
//    - List all vehicles (with pagination)
//    - Show: registration, capacity, utilization
//    - Quick status indicators
//
// 2. VehicleDetails/{vehicleId}
//    - Full vehicle info with document expiry
//    - Edit form for updates
//    - Delete with active booking check
//
// 3. RegisterVehicle
//    - Form with Vahan verification integration
//    - Document upload for fitness/permit/insurance
//
// 4. DriversList
//    - List drivers with availability
//    - Sarathi verification status
//
// 5. RegisterDriver
//    - License verification via Sarathi
//    - Emergency contact collection
```

---

### D. Tracking (API: `/tracking/*`)

#### API Provides:
```
GET /tracking/{bookingId}/status       → Current + history
PUT /tracking/{bookingId}/status       → Update (driver only)
POST /tracking/{bookingId}/pod         → Upload POD image (max 2MB)
```

#### StatusUpdate schema:
```yaml
status: PICKUP_STARTED|IN_TRANSIT|DELIVERED|COMPLETED
timestamp: ISO datetime
location: {lat, lng, address, landmark}
notes: max 500 chars
podImage: base64 encoded (max 2MB)
networkStatus: online|offline
```

#### Frontend Implements:
```javascript
// TrackingScreen - PARTIAL IMPLEMENTATION
const TrackingScreen = ({ onCancel }) => {
  const [progress, setProgress] = useState(0);

  // ✓ Shows animated truck position (good UX)
  // ❌ NO API POLLING FOR REAL STATUS
  // ❌ NO WEBSOCKET/REAL-TIME UPDATES
  // ❌ NO POD UPLOAD CAPABILITY
  // ❌ MOCK DRIVER DATA

  return (
    <div>
      <DriverInfo />        // Mocked
      <AnimatedPath />      // Animated, not real
      <CancelButton />      // Just confirmation, no refund calculation
    </div>
  );
};
```

#### Gaps:
1. **No real-time status polling** - Should call `GET /tracking/{bookingId}/status` periodically
2. **No WebSocket** - For live location updates
3. **No POD upload** - Should upload image via `POST /tracking/{bookingId}/pod`
4. **No offline handling** - `networkStatus: online|offline` not checked
5. **Mock driver data** - Uses hardcoded avatar and info
6. **No refund calculation** - Cancel should show `cancellationFee` and `refundAmount` from API

#### Required Changes:

```typescript
// NEED: Real-time tracking
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const status = await fetch(`/api/v1/tracking/${bookingId}/status`);
    const data = await status.json();

    // Update: currentStatus, statusHistory, lastUpdate, estimatedDelivery
    // Handle: networkStatus for offline UI state
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(pollInterval);
}, [bookingId]);

// NEED: POD Upload
const handlePODUpload = async (imageFile, signature) => {
  const formData = new FormData();
  formData.append('podImage', imageFile);
  formData.append('receiverSignature', signature);

  await fetch(`/api/v1/tracking/${bookingId}/pod`, {
    method: 'POST',
    body: formData
  });
};

// NEED: Cancellation with refund calc
const handleCancel = async (reason) => {
  const response = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });

  const { cancellationFee, refundAmount } = await response.json();
  // Show user: refundAmount = totalPrice - cancellationFee
};
```

---

### E. Payments (API: `/payments/*`)

#### API Provides:
```
POST /payments/calculate              → Price breakdown
GET  /payments/invoices/{bookingId}   → Get invoice
POST /payments/invoices/{bookingId}   → Generate invoice
GET  /payments/settlements            → Carrier settlements
```

#### PriceCalculation response:
```yaml
basePrice: number
fuelSurcharge: number
gst:
  cgst: number
  sgst: number
  igst: number
  taxableAmount: number
totalAmount: number
priceBreakdown:
  ratePerKm: number
  ratePerTonne: number
  minimumCharge: number
validUntil: ISO datetime
```

#### Frontend Status:
```javascript
// ❌ NO PAYMENT/PRICING SCREENS
const TRUCK_TYPES = [
  { id: 'mini', price: '₹450' },  // HARDCODED - should be dynamic
];
```

#### Gaps:
1. **No dynamic pricing** - Should call `/payments/calculate` with distance/weight
2. **No GST display** - Should show CGST/SGST/IGST breakdown
3. **No invoice download** - Missing invoice UI
4. **No settlement tracking** - Carriers can't see payments for completed bookings
5. **No price validity** - `validUntil` not used to invalidate stale quotes

#### Required Additions:

```typescript
// SCREEN NEEDED: PriceQuote
const PriceQuote = ({ bookingDetails }) => {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    // Call POST /payments/calculate
    const price = await fetch('/api/v1/payments/calculate', {
      method: 'POST',
      body: JSON.stringify({
        distance: bookingDetails.distance,
        weight: bookingDetails.weight,
        vehicleType: bookingDetails.vehicleType,
        cargoType: bookingDetails.cargoType,
        pickupPincode: bookingDetails.pickupPincode,
        deliveryPincode: bookingDetails.deliveryPincode
      })
    });

    setPricing(await price.json());
  }, [bookingDetails]);

  return (
    <div>
      <Line label="Base Price" value={pricing.basePrice} />
      <Line label="Fuel Surcharge" value={pricing.fuelSurcharge} />

      <Section title="GST Calculation">
        <Line label="CGST (9%)" value={pricing.gst.cgst} />
        <Line label="SGST (9%)" value={pricing.gst.sgst} />
        <Line label="IGST (18%)" value={pricing.gst.igst} />
      </Section>

      <Line label="Total" value={pricing.totalAmount} bold />
      <Text size="xs" color="gray">
        Price valid until {new Date(pricing.validUntil).toLocaleString()}
      </Text>
    </div>
  );
};
```

---

### F. E-Way Bill Integration (API: `/eway-bill/*`)

#### API Provides:
```
POST /eway-bill/generate              → Generate EWB
PUT  /eway-bill/{ewbNumber}/update-vehicle  → Part B vehicle change
```

#### Frontend Status:
```javascript
// ❌ COMPLETELY MISSING
// No E-Way Bill workflow at all
```

#### Why Critical for India:
- **Mandatory for shipments > ₹50,000**
- **Invoice + HSN code based**
- **12-digit number with QR code**
- **Valid for limited time based on distance**

#### Required Addition:

```typescript
// SCREENS NEEDED:
// 1. EWayBillGeneration (after delivery confirmation)
//    - Only show if invoiceValue >= 50000
//    - Requires: HSN code, invoice number, date, amount
//    - Call POST /eway-bill/generate
//    - Display: EWB number, validity dates, QR code
//
// 2. EWayBillPartB (vehicle change during transit)
//    - For transhipments or breakdowns
//    - Call PUT /eway-bill/{ewbNumber}/update-vehicle
//    - Reason codes: 1=Breakdown, 2=Transhipment, 4=Others
```

---

### G. Admin Features (API: `/admin/*`)

#### API Provides:
```
GET  /admin/dashboard         → Metrics, alerts, recent bookings
POST /admin/reconciliation    → Reconcile bank transactions
```

#### Frontend Status:
```javascript
// ❌ COMPLETELY MISSING
// No admin dashboard at all
```

#### Should Include:
- Real-time booking metrics
- Revenue tracking
- User/vehicle statistics
- Utilization rates
- Alert management
- Bank reconciliation UI

---

## Part 3: Data Model Mismatches

### Authentication Context

#### API Response (AuthResponse):
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "phoneNumber": "+919876543210",
    "businessName": "ABC Logistics",
    "userType": "SHIPPER",    // or CARRIER
    "verified": true
  }
}
```

#### Frontend Stores:
```javascript
// ❌ ONLY: phone number
const [user, setUser] = useState(null);
// Should store: token, refreshToken, userType, businessName, etc.
```

### Booking Status Progression

#### API defines (frozen):
```
CREATED → ASSIGNED → ACCEPTED → PICKUP_STARTED → IN_TRANSIT → DELIVERED → COMPLETED
        (Optional):
        CANCELLED (can happen from CREATED or ASSIGNED)
```

#### Frontend tracks:
```javascript
// Mock tracking - hardcoded progress
const [progress, setProgress] = useState(0);
// Should track actual status state machine
```

---

## Part 4: Critical Missing Implementations

### Rate Limiting

#### API defines:
```
create-booking: 50 requests/hour
general: 100 requests/minute
Retry-After header on 429 responses
```

#### Frontend status:
```javascript
// ❌ No rate limit handling
// ❌ No retry-after implementation
// ❌ Could spam API with duplicate requests
```

### Error Handling

#### API Error Schema:
```yaml
code: USR_NOT_FOUND|AUTH_INVALID_OTP|BOOKING_NO_TRUCKS
message: string
details:
  field: string
  reason: string
  suggestion: string
timestamp: ISO datetime
requestId: UUID (for support tracking)
downstream:
  service: string
  error: string
  statusCode: integer
```

#### Frontend has:
```javascript
// ❌ No error boundary
// ❌ No typed error handling
// ❌ No user-friendly error messages
// ❌ No request ID logging for debugging
```

### Validation

#### API enforces:
```
- Phone: ^\+91[6-9]\d{9}$
- Vehicle Registration: ^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$
- GST: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
- Pincode: ^[5][0-9]{5}$ (Starts with 5)
- IFSC: ^[A-Z]{4}0[A-Z0-9]{6}$
- Bank Account: ^\d{9,18}$
- License: ^[A-Z]{2}[0-9]{2}[0-9]{11}$
- E-Way Bill: ^\d{12}$
```

#### Frontend has:
```javascript
// ❌ No validation beyond basic required checks
// ❌ No pattern matching
// ❌ Could send invalid data to API
```

---

## Part 5: Performance & Security Issues

### Security

| Issue | Risk | Fix |
|-------|------|-----|
| Token not stored securely | HIGH | Use httpOnly cookies or secure storage |
| No HTTPS validation | MEDIUM | Enforce HTTPS in production |
| CORS not configured | MEDIUM | Should use credentials: 'include' |
| Phone visible in logs | MEDIUM | Sanitize auth data before logging |
| No token refresh automation | HIGH | Implement refresh token rotation |

### Performance

| Issue | Impact | Fix |
|-------|--------|-----|
| Heavy animation on low-end devices | MEDIUM | Reduce FPS, add CPU throttling |
| No request caching | HIGH | Cache `/fleet/vehicles`, `/fleet/drivers` |
| Poll every 5s might be excess | MEDIUM | Use WebSocket for live tracking |
| No pagination for list screens | HIGH | Implement infinite scroll/pagination |
| No lazy loading for images | LOW | Add image optimization |

---

## Part 6: Recommended Implementation Roadmap

### Phase 1: Core Authentication & Foundation (Week 1-2)
```
✓ Fix auth flow with OTP verification
✓ Implement secure token storage
✓ Add token refresh mechanism
✓ Create API service layer (axios/fetch wrapper)
✓ Add error boundaries and error handling
✓ Input validation for all forms
```

### Phase 2: Complete Booking Flow (Week 2-3)
```
✓ Location picker component with map integration
✓ Cargo details form
✓ Contact person collection
✓ Real pricing via /payments/calculate
✓ Booking confirmation with validation
✓ Order history/bookings list
```

### Phase 3: Role-Based UX (Week 3-4)
```
✓ Different flows for SHIPPER vs CARRIER
✓ Fleet management screens (for carriers)
✓ Driver management screens (for carriers)
✓ Booking assignment UI
```

### Phase 4: Tracking & Delivery (Week 4-5)
```
✓ Real-time status polling with WebSocket
✓ POD upload with image capture
✓ Offline handling for driver app
✓ Push notifications for status updates
```

### Phase 5: Payments & GST (Week 5-6)
```
✓ Invoice generation UI
✓ E-Way Bill integration
✓ Settlement tracking (for carriers)
✓ GST compliance UI
```

### Phase 6: Admin & Monitoring (Week 6-7)
```
✓ Admin dashboard
✓ Metrics and analytics
✓ Bank reconciliation UI
✓ Alert management
```

---

## Part 7: Code Quality Issues in Frontend

### 1. Type Safety
```javascript
// Current: No TypeScript
const AuthScreen = ({ onLogin }) => { ... }

// Required: TypeScript interfaces
interface AuthScreenProps {
  onLogin: (phone: string) => Promise<void>;
}

interface AppState {
  token: string | null;
  user: UserType | null;
  isLoading: boolean;
  error: AppError | null;
}
```

### 2. State Management
```javascript
// Current: Multiple useState hooks
const [screen, setScreen] = useState('splash');
const [user, setUser] = useState(null);

// Better: Context + reducer for app state
const [appState, dispatch] = useReducer(appStateReducer, initialState);
```

### 3. Component Organization
```javascript
// Current: Everything in one App.tsx file
export default function App() {
  switch(screen) {
    case 'splash': return <SplashScreen />;
    case 'auth': return <AuthScreen />;
    // ...
  }
}

// Better: Separate components with routing
<BrowserRouter>
  <Routes>
    <Route path="/splash" element={<SplashScreen />} />
    <Route path="/auth" element={<AuthScreen />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</BrowserRouter>
```

### 4. API Integration
```javascript
// Missing: API service layer
// Need:
// services/api.ts
export const api = {
  auth: {
    register: (phone: string) => POST('/auth/register', { phoneNumber: phone }),
    verifyOtp: (sessionId, otp) => POST('/auth/verify-otp', { sessionId, otp }),
    login: (phone: string) => POST('/auth/login', { phoneNumber: phone }),
    refreshToken: (token) => POST('/auth/refresh', { refreshToken: token })
  },
  bookings: {
    create: (booking) => POST('/bookings', booking),
    list: (filters) => GET('/bookings', { params: filters }),
    getById: (id) => GET(`/bookings/${id}`),
    cancel: (id, reason) => POST(`/bookings/${id}/cancel`, { reason })
  },
  // ... more endpoints
};
```

### 5. Error Handling
```javascript
// Current: No error handling
const [phone, setPhone] = useState('');

// Need:
const [phone, setPhone] = useState('');
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  try {
    setError(null);
    setIsLoading(true);
    const response = await api.auth.login(phone);
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 6. Loading States
```javascript
// Current: No loading indicators
<Button onClick={onLogin}>Next</Button>

// Need:
<Button
  onClick={handleLogin}
  disabled={isLoading}
>
  {isLoading ? 'Sending OTP...' : 'Next'}
</Button>
```

---

## Part 8: Unit Test Coverage Gaps

### Current: 0% coverage
```javascript
// No tests at all
```

### Required tests:
```typescript
// auth.test.ts
describe('AuthScreen', () => {
  it('should call /auth/register with phone number');
  it('should validate phone number pattern');
  it('should show error on invalid OTP');
  it('should save JWT token after successful OTP');
  it('should show OTP expiration countdown');
});

// bookingForm.test.ts
describe('BookingForm', () => {
  it('should calculate price via /payments/calculate');
  it('should validate cargo weight between 0.1-50 tonnes');
  it('should require both pickup and delivery locations');
  it('should enforce minimum 1 hour booking window');
  it('should show GST breakdown in price');
});

// tracking.test.ts
describe('TrackingScreen', () => {
  it('should poll /tracking/{id}/status every 5 seconds');
  it('should handle offline status from API');
  it('should upload POD via multipart form data');
  it('should show refund amount on cancellation');
});
```

---

## Part 9: Recommendations by Priority

### 🔴 CRITICAL (Do First)

1. **Create API Service Layer** - Centralize all API calls
   - File: `src/services/api.ts`
   - Implement fetch wrapper with auth headers
   - Add request/response interceptors
   - Handle token refresh automatically

2. **Fix Authentication** - Complete OTP flow
   - Add OTP verification screen
   - Store JWT + refresh token securely
   - Add logout functionality

3. **Create Booking Form** - Replace simple selection
   - Location picker with map
   - Cargo details collection
   - Contact person form
   - Real pricing via API

4. **Add Error Handling** - Global error boundary
   - Create ErrorBoundary component
   - Show user-friendly error messages
   - Log errors with request IDs
   - Implement retry logic

### 🟠 HIGH PRIORITY (Week 2)

5. **Real-time Tracking** - Polling + WebSocket setup
6. **Role-Based Screens** - Shipper vs Carrier UX
7. **Fleet Management** - For carrier app flow
8. **Input Validation** - All form inputs
9. **Loading States** - For all async operations
10. **TypeScript Migration** - Add type safety

### 🟡 MEDIUM PRIORITY (Week 3-4)

11. **Payments UI** - Invoice and settlements
12. **E-Way Bill Flow** - GST compliance
13. **Admin Dashboard** - Metrics and management
14. **Offline Support** - For driver app
15. **Unit Tests** - Basic coverage (60%+)

### 🟢 LOW PRIORITY (Later)

16. Performance optimization
17. Advanced analytics
18. Mobile app features
19. A/B testing setup

---

## Part 10: API Compliance Checklist

### Authentication
- [ ] Implement `/auth/register` with phone validation
- [ ] Implement `/auth/verify-otp` 6-digit validation
- [ ] Implement `/auth/login` for returning users
- [ ] Handle `/auth/refresh` token rotation
- [ ] Store JWT in httpOnly cookie or secure storage
- [ ] Implement logout with token invalidation

### Booking
- [ ] Collect all BookingRequest fields
- [ ] Validate booking window (1hr min, 7 days max)
- [ ] Call `/payments/calculate` before confirmation
- [ ] Create booking via `POST /bookings`
- [ ] Show booking number in format `BK[0-9]{10}`
- [ ] Handle `POST /bookings/{id}/cancel` with fee calculation
- [ ] Support `POST /bookings/{id}/assign-truck` for carriers

### Tracking
- [ ] Poll `GET /tracking/{id}/status` every 5-10 seconds
- [ ] Implement status state machine validation
- [ ] Upload POD via `POST /tracking/{id}/pod`
- [ ] Handle offline status from API
- [ ] Show status history with timestamps
- [ ] Support driver status updates for own bookings

### Payments
- [ ] Call `POST /payments/calculate` for pricing
- [ ] Display GST breakdown (CGST/SGST/IGST)
- [ ] Show price validity timestamp
- [ ] Implement invoice download from `GET /payments/invoices/{id}`
- [ ] Show carrier settlements from `GET /payments/settlements`

### Fleet (Carrier App)
- [ ] List vehicles via `GET /fleet/vehicles`
- [ ] Register vehicle via `POST /fleet/vehicles`
- [ ] Validate Vahan registration
- [ ] List drivers via `GET /fleet/drivers`
- [ ] Register driver via `POST /fleet/drivers`
- [ ] Validate Sarathi license

### E-Way Bill
- [ ] Generate E-Way Bill via `POST /eway-bill/generate`
- [ ] Only show for invoices >= ₹50,000
- [ ] Display 12-digit EWB number and QR code
- [ ] Support Part-B vehicle change via `PUT /eway-bill/{id}/update-vehicle`

### Admin
- [ ] Implement admin dashboard with metrics
- [ ] Show real-time booking stats
- [ ] Support bank reconciliation UI
- [ ] Display utilization rates

---

## Part 11: Example Implementation - Auth Flow

Here's how the auth flow SHOULD look:

```typescript
// screens/AuthFlow.tsx
interface AuthFlowState {
  step: 'phone' | 'otp' | 'profile';
  sessionId: string | null;
  phoneNumber: string;
  otpValue: string;
  isLoading: boolean;
  error: string | null;
  otpExpiresIn: number;
}

export const AuthFlow: React.FC = () => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const handlePhoneSubmit = async (phone: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Validate phone format
      if (!isValidPhone(phone)) {
        throw new Error('Invalid phone number');
      }

      // Try login first
      const loginRes = await api.auth.login(phone);

      dispatch({
        type: 'OTP_SENT',
        payload: {
          sessionId: loginRes.sessionId,
          phoneNumber: phone,
          expiresIn: loginRes.otpExpiresIn
        }
      });
    } catch (err) {
      // If not found, show register option
      if (err.statusCode === 404) {
        dispatch({ type: 'SHOW_REGISTER' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      }
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.auth.verifyOtp({
        phoneNumber: state.phoneNumber,
        otp: otp,
        sessionId: state.sessionId
      });

      // Store tokens
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Dispatch authenticated
      dispatch({ type: 'AUTHENTICATED', payload: response.user });

      // Route to next screen based on role
      if (response.user.verified) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  return (
    <>
      {state.step === 'phone' && <PhoneEntry onSubmit={handlePhoneSubmit} />}
      {state.step === 'otp' && (
        <OTPVerification
          onSubmit={handleOtpSubmit}
          expiresIn={state.otpExpiresIn}
          phoneNumber={state.phoneNumber}
        />
      )}
      {state.error && <ErrorMessage message={state.error} />}
    </>
  );
};
```

---

## Conclusion

The UberTruck frontend is **UI-ready but API-disconnected**. It needs:

1. ✅ **Architecture overhaul** - Add routing, state management, API layer
2. ✅ **Complete missing screens** - Location picker, cargo form, fleet management
3. ✅ **Real API integration** - Replace all mock data with actual endpoints
4. ✅ **Error handling** - Implement comprehensive error management
5. ✅ **Type safety** - Migrate to TypeScript
6. ✅ **Testing** - Add unit and integration tests

**Estimated effort**: 4-6 weeks for full implementation with 2-3 developers.

**Next step**: Start with Phase 1 (Auth & API layer) to unblock all other work.

---

## Quick Reference: API Endpoints by Screen

| Screen | Required Endpoints |
|--------|------------------|
| Auth | `/auth/register`, `/auth/login`, `/auth/verify-otp`, `/auth/refresh`, `/users/profile`, `/users/bank-details` |
| Booking | `/bookings`, `POST /bookings`, `/payments/calculate`, `/bookings/{id}/cancel` |
| Tracking | `GET /tracking/{id}/status`, `PUT /tracking/{id}/status`, `POST /tracking/{id}/pod` |
| Fleet | `GET /fleet/vehicles`, `POST /fleet/vehicles`, `GET /fleet/drivers`, `POST /fleet/drivers` |
| Payments | `POST /payments/calculate`, `GET /payments/invoices/{id}`, `GET /payments/settlements` |
| E-Way Bill | `POST /eway-bill/generate`, `PUT /eway-bill/{id}/update-vehicle` |
| Admin | `GET /admin/dashboard`, `POST /admin/reconciliation` |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-13
**Status**: REVIEW COMPLETE
