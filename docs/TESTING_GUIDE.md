# Testing Guide - UberTruck MVP Phase 1

**How to Test All Features Built So Far**

This guide covers manual testing, automated testing, and integration testing for all Phase 1 features.

---

## Table of Contents

1. [Quick Start - Running Tests](#quick-start---running-tests)
2. [Manual Testing Setup](#manual-testing-setup)
3. [Testing Authentication Flow](#testing-authentication-flow)
4. [Testing Booking Flow](#testing-booking-flow)
5. [Testing API Integration](#testing-api-integration)
6. [Automated Test Suite](#automated-test-suite)
7. [Component Testing](#component-testing)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start - Running Tests

### 1. Run All Automated Tests

```bash
# Install dependencies (if not done)
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm test -- --watch

# Run specific test file
npm test -- src/hooks/__tests__/useAuth.test.ts
```

**Expected Output:**
```
Test Suites: 5 passed, 5 total
Tests:       65 passed, 65 total
Time:        5.632s
```

### 2. Quick Manual Test (Without Backend)

Since we don't have a React app setup yet (only the code), here's how to test the logic:

```bash
# Test API client directly in Node
node
> const { api } = require('./src/services/api.ts')
> // Test methods (will fail without backend, but validates code)
```

---

## Manual Testing Setup

### Prerequisites

To fully test the features manually, you need:

1. **Backend API Running**
   - Ensure backend is deployed and accessible
   - API base URL configured in environment

2. **React App Setup** (Future - not done yet)
   ```bash
   # Create React app (if starting from scratch)
   npx create-react-app ubertruck-frontend --template typescript

   # Copy our source files
   cp -r src/* ubertruck-frontend/src/

   # Install dependencies
   cd ubertruck-frontend
   npm install react-router-dom
   ```

3. **Environment Variables**
   Create `.env.local`:
   ```
   REACT_APP_API_BASE_URL=http://localhost:3000
   REACT_APP_API_TIMEOUT=30000
   ```

---

## Testing Authentication Flow

### Feature: Phone Number Entry

**Location:** `src/screens/PhoneEntry.tsx`

#### Manual Test Steps:

1. **Valid Phone Number**
   ```
   Input: 9876543210
   Expected: Green border, "Next" button enabled
   ```

2. **Invalid Phone Number (too short)**
   ```
   Input: 98765
   Expected: Red border, error message shown
   Message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
   ```

3. **Invalid Phone Number (wrong starting digit)**
   ```
   Input: 1876543210
   Expected: Red border, error message shown
   ```

4. **Valid Phone Number Submission**
   ```
   Input: 9876543210
   Click: "Next" button
   Expected:
   - Loading state shown ("Sending OTP...")
   - API call to POST /auth/login
   - Navigate to OTP screen on success
   ```

#### Automated Test:

```bash
npm test -- src/screens/__tests__/PhoneEntry.test.tsx
# (Not created yet - future work)
```

#### Test with Hook Directly:

```typescript
// In Jest test or Node REPL
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './src/hooks/useAuth';

const { result } = renderHook(() => useAuth());

act(async () => {
  await result.current.login('+919876543210');
});

// Check result
console.log(result.current.isLoading); // false
console.log(result.current.error); // null or error message
```

---

### Feature: OTP Verification

**Location:** `src/screens/OTPVerification.tsx`

#### Manual Test Steps:

1. **OTP Input - Auto-focus**
   ```
   Action: Screen loads
   Expected: First OTP box is focused
   ```

2. **OTP Input - Digit Entry**
   ```
   Input: Type "1"
   Expected: Focus moves to next box
   Input: Type "2", "3", "4", "5", "6"
   Expected: All 6 boxes filled, auto-submit triggered
   ```

3. **OTP Input - Paste Support**
   ```
   Action: Paste "123456" (Ctrl+V or Cmd+V)
   Expected: All 6 boxes filled with digits
   ```

4. **OTP Input - Backspace**
   ```
   Action: Press backspace on empty box
   Expected: Focus moves to previous box
   ```

5. **OTP Input - Arrow Keys**
   ```
   Action: Press left arrow
   Expected: Focus moves to previous box
   Action: Press right arrow
   Expected: Focus moves to next box
   ```

6. **Countdown Timer**
   ```
   Initial: "Code expires in 5:00"
   After 1 second: "Code expires in 4:59"
   After 5 minutes: "Resend OTP" button appears
   ```

7. **Auto-submit**
   ```
   Action: Enter 6th digit
   Expected:
   - Loading state shown ("Verifying...")
   - API call to POST /auth/verify-otp
   - Navigate to profile/dashboard on success
   ```

8. **Resend OTP**
   ```
   Action: Wait for timer to reach 0:00
   Expected: "Resend OTP" button appears
   Click: "Resend OTP"
   Expected:
   - API call to POST /auth/login (again)
   - Timer resets to 5:00
   - OTP boxes cleared
   ```

9. **Invalid OTP**
   ```
   Input: 000000 (wrong OTP)
   Expected:
   - Error message shown in red box
   - All OTP boxes highlighted in red
   - OTP cleared
   - Focus returns to first box
   ```

#### Automated Test:

```bash
# Test useAuth hook (includes OTP verification)
npm test -- src/hooks/__tests__/useAuth.test.ts

# Test integration flow
npm test -- src/__tests__/integration/authFlow.integration.test.ts
```

---

### Feature: Profile Setup (Optional)

**Location:** `src/screens/ProfileSetup.tsx`

#### Manual Test Steps:

1. **Business Name Validation**
   ```
   Input: "AB" (too short)
   Action: Blur (click outside)
   Expected: Error "Business name must be at least 3 characters"

   Input: "ABC Transport"
   Expected: No error, green border
   ```

2. **GST Number Validation**
   ```
   Input: "invalid"
   Action: Blur
   Expected: Error "Invalid GST number format (e.g., 27AABCC1234A1Z5)"

   Input: "27AABCT1234A1Z5"
   Expected: No error, uppercase formatting applied
   ```

3. **Pincode Validation**
   ```
   Input: "123456" (doesn't start with 5)
   Action: Blur
   Expected: Error "Invalid pincode (must be 6 digits starting with 5)"

   Input: "508001"
   Expected: No error
   ```

4. **Skip Profile**
   ```
   Click: "Skip for now"
   Expected: Navigate to dashboard without API call
   ```

5. **Save Profile**
   ```
   Fill: All fields with valid data
   Click: "Save Profile"
   Expected:
   - Loading state ("Saving...")
   - API call to PUT /users/profile
   - Navigate to dashboard on success
   ```

#### Automated Test:

```bash
# Test via useAuth hook (updateProfile method)
npm test -- src/hooks/__tests__/useAuth.test.ts

# Look for: "should update user profile"
```

---

## Testing Booking Flow

### Feature: Location Picker

**Location:** `src/components/LocationPicker.tsx`

#### Manual Test Steps:

1. **Address Validation**
   ```
   Input: "ABC" (too short)
   Action: Blur
   Expected: Error "Address must be at least 5 characters"

   Input: "Nalgonda, Telangana, India"
   Expected: No error
   ```

2. **Pincode Validation**
   ```
   Input: "123456"
   Action: Blur
   Expected: Error "Invalid pincode (6 digits starting with 5)"

   Input: "508001"
   Expected: No error
   ```

3. **Latitude/Longitude**
   ```
   Input Lat: "17.0491"
   Input Lng: "79.2649"
   Expected: No errors, valid coordinates

   Input Lat: "100" (out of range)
   Expected: Error "Invalid latitude (-90 to 90)"
   ```

4. **Complete Location**
   ```
   Fill all fields:
   - Address: "Nalgonda, Telangana"
   - Pincode: "508001"
   - Latitude: "17.0491"
   - Longitude: "79.2649"

   Expected: onChange callback triggered with complete Location object
   ```

---

### Feature: Cargo Details Form

**Location:** `src/components/CargoDetailsForm.tsx`

#### Manual Test Steps:

1. **Cargo Type Selection**
   ```
   Options available:
   - General Cargo
   - Perishable Goods
   - Fragile Items
   - Hazardous Materials
   - Agricultural Products
   - Construction Materials
   - Industrial Equipment

   Select: "Agricultural Products"
   Expected: Dropdown shows selected value
   ```

2. **Weight Validation**
   ```
   Input: "0.05" (below minimum)
   Expected: Error "Minimum weight is 0.1 tonnes (100 kg)"

   Input: "60" (above maximum)
   Expected: Error "Maximum weight is 50 tonnes"

   Input: "5.5"
   Expected: No error, valid weight
   ```

3. **Volume (Optional)**
   ```
   Leave empty: No error (optional field)

   Input: "15.5"
   Expected: No error, valid volume

   Input: "1500" (too large)
   Expected: Error "Maximum volume is 1000 cubic meters"
   ```

4. **Description**
   ```
   Input: "Rice" (too short)
   Expected: Error "Description must be at least 5 characters"

   Input: "Rice bags for transport from Nalgonda"
   Expected: No error, character counter shows "38/500"
   ```

5. **HSN Code (Optional)**
   ```
   Leave empty: No error

   Input: "123" (too short)
   Expected: Error "HSN code must be 4-8 digits"

   Input: "10063000"
   Expected: No error, valid HSN code
   ```

---

### Feature: Contact Details Form

**Location:** `src/components/ContactDetailsForm.tsx`

#### Manual Test Steps:

1. **Name Validation**
   ```
   Input: "A" (too short)
   Expected: Error "Name must be at least 2 characters"

   Input: "Rajesh123" (contains numbers)
   Expected: Error "Name can only contain letters and spaces"

   Input: "Rajesh Kumar"
   Expected: No error
   ```

2. **Phone Validation**
   ```
   Input: "123456" (too short)
   Expected: Error "Invalid phone number (10 digits starting with 6-9)"

   Input: "1876543210" (wrong starting digit)
   Expected: Error "Invalid phone number (10 digits starting with 6-9)"

   Input: "9876543210"
   Expected: No error, +91 prefix shown in UI
   ```

3. **Auto-formatting**
   ```
   Input: "98-765-432-10" (with dashes)
   Expected: Auto-formatted to "9876543210"

   Input: "98765432109876" (too long)
   Expected: Truncated to "9876543210"
   ```

---

### Feature: Price Calculation

**Location:** `src/hooks/usePriceCalculation.ts`

#### Manual Test Steps:

1. **Calculate Price**
   ```typescript
   const { calculatePrice } = usePriceCalculation();

   await calculatePrice({
     pickupLocation: { address: "...", latitude: 17.0491, longitude: 79.2649, pincode: "508001" },
     deliveryLocation: { address: "...", latitude: 16.8749, longitude: 79.5643, pincode: "508207" },
     cargoDetails: { type: "AGRICULTURAL", weight: 10, description: "Rice bags" },
     pickupTime: "2026-02-15T10:00:00Z"
   });

   Expected Response:
   - calculationId: "calc-xyz-789"
   - basePrice: 500 (distance × weight × ₹5)
   - surcharges: [fuel, toll, etc.]
   - gstBreakdown: { cgst: 51.3, sgst: 51.3, igst: 0 }
   - totalPrice: 672.6
   - validUntil: "2026-02-13T10:15:00Z" (15 minutes from now)
   ```

2. **Price Validity Timer**
   ```
   Initial: timeRemaining = 900 (15 minutes = 900 seconds)
   After 1 second: timeRemaining = 899
   After 15 minutes: timeRemaining = 0, isExpired = true
   ```

3. **Pickup Time Validation**
   ```
   Invalid (< 1 hour):
   pickupTime: new Date(Date.now() + 30*60*1000) // +30 minutes
   Expected: Error "Pickup time must be at least 1 hour in the future"

   Valid:
   pickupTime: new Date(Date.now() + 2*60*60*1000) // +2 hours
   Expected: Price calculation succeeds
   ```

#### Automated Test:

```bash
npm test -- src/hooks/__tests__/usePriceCalculation.test.ts
```

Look for these tests:
- "should calculate price successfully"
- "should validate pickup time is at least 1 hour in future"
- "should detect price expiry"

---

### Feature: Price Breakdown Display

**Location:** `src/components/PriceBreakdown.tsx`

#### Manual Test Steps:

1. **Price Display**
   ```
   Input: priceCalculation object
   Expected Display:
   - Base Price: ₹500.00
   - Surcharges:
     - Fuel Surcharge (10%): ₹50.00
     - Toll Charges: ₹20.00
   - Subtotal (before tax): ₹570.00
   - GST (18%):
     - CGST (9%): ₹51.30
     - SGST (9%): ₹51.30
   - Total Amount: ₹672.60
   ```

2. **Animated Total**
   ```
   Action: Component mounts with price data
   Expected: Total amount animates from ₹0.00 to ₹672.60 over 500ms
   ```

3. **Countdown Timer**
   ```
   Initial: "Valid for 15:00"
   After 1 second: "Valid for 14:59"
   Color: Black (normal)

   When < 1 minute: "Valid for 0:45"
   Color: Red (urgent)

   When expired: "Expired - Please recalculate"
   Color: Red
   Button: "Recalculate" appears
   ```

4. **Interstate vs Intrastate GST**
   ```
   Same state (e.g., both Telangana):
   Expected: CGST 9% + SGST 9% shown

   Different states (e.g., Telangana to Karnataka):
   Expected: IGST 18% shown (CGST/SGST hidden)
   ```

5. **Distance and Weight Cards**
   ```
   Expected:
   - Distance: "50 km" (from API)
   - Weight: "10 tonnes" (from cargo details)
   ```

---

### Feature: Complete Booking Form (4-Step Wizard)

**Location:** `src/screens/BookingForm.tsx`

#### Manual Test Steps:

**Step 1: Locations**

1. **Initial State**
   ```
   Expected:
   - Progress bar: Step 1 of 4 (25%)
   - Two LocationPicker components
   - Pickup time datetime input
   - "Next" button disabled initially
   ```

2. **Fill Locations**
   ```
   Fill pickup location:
   - Address: "Nalgonda, Telangana"
   - Pincode: "508001"
   - Lat: 17.0491, Lng: 79.2649

   Fill delivery location:
   - Address: "Miryalguda, Telangana"
   - Pincode: "508207"
   - Lat: 16.8749, Lng: 79.5643

   Select pickup time: Tomorrow 10:00 AM

   Expected: "Next" button enabled
   ```

3. **Click Next**
   ```
   Action: Click "Next"
   Expected: Navigate to Step 2 (Cargo Details)
   ```

**Step 2: Cargo Details**

4. **Fill Cargo**
   ```
   Select type: "Agricultural Products"
   Weight: 10 tonnes
   Volume: 15 m³
   Description: "Rice bags for transport"
   HSN Code: 10063000

   Expected: "Next" button enabled
   ```

5. **Click Next**
   ```
   Expected: Navigate to Step 3 (Contact Information)
   ```

**Step 3: Contact Information**

6. **Fill Contacts**
   ```
   Pickup Contact:
   - Name: "Rajesh Kumar"
   - Phone: 9876543210

   Delivery Contact:
   - Name: "Suresh Reddy"
   - Phone: 9876543211

   Expected: "Next" button enabled
   ```

7. **Click Next (Calculates Price)**
   ```
   Expected:
   - Loading: "Calculating Price..."
   - API call: POST /payments/calculate
   - Navigate to Step 4 on success
   ```

**Step 4: Review & Confirm**

8. **Review Booking Summary**
   ```
   Expected Display:
   - Pickup: Nalgonda, Telangana @ 2026-02-14 10:00 AM
   - Delivery: Miryalguda, Telangana
   - Cargo: Agricultural Products - 10 tonnes
   - Pickup Contact: Rajesh Kumar, +91 9876543210
   - Delivery Contact: Suresh Reddy, +91 9876543211
   ```

9. **Review Price Breakdown**
   ```
   Expected:
   - Base Price calculation shown
   - Surcharges listed
   - GST breakdown
   - Total amount (animated)
   - Validity timer counting down
   ```

10. **Create Booking**
    ```
    Click: "Confirm & Create Booking"
    Expected:
    - Loading: "Creating Booking..."
    - API call: POST /bookings
    - Success callback with booking object
    - Navigate to tracking/confirmation page
    ```

**Navigation Features**

11. **Back Button**
    ```
    Action: Click "Back" from Step 2/3/4
    Expected: Return to previous step, data retained

    Action: Click "Back" from Step 4
    Expected: Price calculation cleared (needs recalculation)
    ```

12. **Cancel Button**
    ```
    Click: "X" (close button)
    Expected: Exit booking flow, call onCancel callback
    ```

**Error Scenarios**

13. **Price Expired**
    ```
    Action: Wait 15 minutes on Step 4
    Expected:
    - "Expired - Please recalculate" message
    - "Confirm" button disabled
    - "Recalculate" button appears
    ```

14. **API Error**
    ```
    Scenario: API returns error
    Expected:
    - Error message displayed in red box
    - Ability to retry (form still functional)
    ```

#### Automated Test:

```bash
npm test -- src/__tests__/integration/bookingFlow.integration.test.ts
```

Look for:
- "should complete full booking flow"
- "should validate pickup time"
- "should detect price expiry"

---

## Testing API Integration

### Using the API Client Directly

```typescript
import { api } from './src/services/api';

// 1. Login (Send OTP)
const loginResult = await api.login('+919876543210');
console.log('Session ID:', loginResult.sessionId);
console.log('OTP expires in:', loginResult.otpExpiresIn, 'seconds');

// 2. Verify OTP
const authResult = await api.verifyOtp('+919876543210', '123456', loginResult.sessionId);
console.log('JWT Token:', authResult.token);
console.log('User:', authResult.user);

// 3. Get User Profile
const profile = await api.getUserProfile();
console.log('Profile:', profile);

// 4. Update Profile
await api.updateUserProfile({
  businessName: 'Test Transport Co',
  gstNumber: '27AABCT1234A1Z5'
});

// 5. Calculate Price
const price = await api.calculatePrice({
  pickupLocation: { address: "...", latitude: 17.0491, longitude: 79.2649, pincode: "508001" },
  deliveryLocation: { address: "...", latitude: 16.8749, longitude: 79.5643, pincode: "508207" },
  cargoDetails: { type: "AGRICULTURAL", weight: 10, description: "Rice" },
  pickupTime: new Date(Date.now() + 2*60*60*1000).toISOString()
});
console.log('Price:', price);

// 6. Create Booking
const booking = await api.createBooking({
  pickupLocation: { /*...*/ },
  deliveryLocation: { /*...*/ },
  cargoDetails: { /*...*/ },
  pickupTime: "...",
  pickupContact: { name: "Rajesh", phone: "+919876543210" },
  deliveryContact: { name: "Suresh", phone: "+919876543211" },
  priceCalculationId: price.calculationId
});
console.log('Booking ID:', booking.bookingId);
```

### Testing with Mock Backend

If you don't have a backend, you can mock responses:

```typescript
// In tests or development
jest.mock('./src/services/api');

const mockedApi = api as jest.Mocked<typeof api>;

mockedApi.login.mockResolvedValue({
  message: 'OTP sent',
  sessionId: 'mock-session-123',
  otpExpiresIn: 300,
  requestId: 'req-001'
});

mockedApi.verifyOtp.mockResolvedValue({
  success: true,
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: {
    id: 'user-123',
    phoneNumber: '+919876543210',
    userType: 'SHIPPER',
    verified: true
  },
  requestId: 'req-002'
});
```

---

## Automated Test Suite

### Running Specific Test Categories

```bash
# All tests
npm test

# Only unit tests (hooks + services)
npm test -- src/hooks/__tests__ src/services/__tests__

# Only integration tests
npm test -- src/__tests__/integration

# Specific test file
npm test -- src/hooks/__tests__/useAuth.test.ts

# Specific test case
npm test -- -t "should complete full authentication flow"

# Watch mode (re-runs on file changes)
npm test -- --watch

# Coverage report
npm run test:coverage

# Verbose output
npm test -- --verbose
```

### Understanding Test Output

```
PASS  src/hooks/__tests__/useAuth.test.ts
  useAuth Hook
    Initialization
      ✓ should initialize with no user when no token exists (45ms)
      ✓ should load user when valid token exists (52ms)
    login
      ✓ should send OTP and return sessionId (23ms)
      ✓ should set error on login failure (18ms)
    verifyOtp
      ✓ should verify OTP and set user state (31ms)
```

- ✓ = Test passed
- ✗ = Test failed
- (23ms) = Execution time

### Coverage Report Interpretation

```
File                     | % Stmts | % Branch | % Funcs | % Lines |
-------------------------|---------|----------|---------|---------|
hooks/useAuth.ts         |   93.65 |       50 |   94.11 |   94.33 |
hooks/usePriceCalc.ts    |   98.18 |    81.81 |     100 |   98.07 |
```

- **% Stmts**: Statement coverage (lines executed)
- **% Branch**: Branch coverage (if/else paths)
- **% Funcs**: Function coverage
- **% Lines**: Line coverage

---

## Component Testing

### Future: React Component Tests

Once React app is set up, you can test components:

```typescript
// Example: Testing PhoneEntry screen
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneEntry from './src/screens/PhoneEntry';

test('should validate phone number on input', async () => {
  const onSuccess = jest.fn();
  render(<PhoneEntry onSuccess={onSuccess} />);

  const input = screen.getByPlaceholderText('Enter phone number');

  // Invalid phone
  fireEvent.change(input, { target: { value: '123' } });
  fireEvent.blur(input);

  expect(screen.getByText(/Please enter a valid/)).toBeInTheDocument();

  // Valid phone
  fireEvent.change(input, { target: { value: '9876543210' } });
  fireEvent.blur(input);

  expect(screen.queryByText(/Please enter a valid/)).not.toBeInTheDocument();
});
```

---

## Troubleshooting

### Common Issues

**1. Tests Failing Due to Timeout**
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**2. Mock Not Working**
```typescript
// Ensure mock is before import
jest.mock('./src/services/api');
import { api } from './src/services/api';
```

**3. localStorage Not Available**
```
Error: localStorage is not defined

Solution: Already fixed in src/setupTests.ts
```

**4. React Hooks Error**
```
Error: Invalid hook call

Solution: Ensure using renderHook from @testing-library/react
```

**5. TypeScript Errors**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Fix any type errors shown
```

### Debug Mode

```bash
# Run tests with debug output
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

### Test Coverage Too Low

```bash
# See uncovered lines
npm run test:coverage

# Look at coverage/lcov-report/index.html in browser
npx http-server coverage/lcov-report
```

---

## Test Checklist

### Before Committing Code

- [ ] All tests pass (`npm test`)
- [ ] Coverage > 80% on new code (`npm run test:coverage`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console.log statements
- [ ] Tests run in < 10 seconds

### Before Deploying

- [ ] All automated tests pass
- [ ] Manual smoke tests completed
- [ ] API integration verified
- [ ] Error scenarios tested
- [ ] Performance acceptable (Lighthouse > 80)

---

## Summary

### What We Can Test NOW (Without React App)

✅ **Unit Tests** - Already working
```bash
npm test
```

✅ **Integration Tests** - Already working
```bash
npm test -- src/__tests__/integration
```

✅ **Hook Logic** - Test in isolation
```bash
npm test -- src/hooks/__tests__
```

✅ **API Client** - Test with mocks
```bash
npm test -- src/services/__tests__
```

### What Needs React App Setup

⏳ **Component Visual Testing** - Needs React app running
⏳ **Screen Flow Testing** - Needs routing setup
⏳ **E2E Testing** - Needs full app + backend
⏳ **Manual UI Testing** - Needs browser

### Recommended Next Step

**Option 1: Create Simple Test App**
```bash
# Quick React app to test components
npx create-react-app test-app --template typescript
cd test-app
# Copy components and test manually
```

**Option 2: Use Storybook**
```bash
# Visual component development
npx storybook init
# Create stories for each component
```

**Option 3: Continue with Automated Tests**
```bash
# Already have 65 passing tests
# Add more integration scenarios
```

---

**Questions?**
- Check test files in `src/__tests__/` and `src/**/__tests__/`
- Review `PHASE_1_FINAL_REPORT.md` for feature details
- See `DEPLOYMENT_CHECKLIST.md` for production testing

---

*Last Updated: 2026-02-13*
*Phase 1 Complete - 65 Tests Passing*
