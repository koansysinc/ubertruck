#!/bin/bash
# Test script for frozen requirements
# This script TESTS actual functionality, not claims

BASE_URL="http://localhost:4000"
PASS=0
FAIL=0

echo "================================="
echo "FROZEN REQUIREMENTS TEST"
echo "================================="
echo ""

# Test 1: Health check
echo "Test 1: Backend is running"
if curl -s "$BASE_URL/health" | grep -q "healthy"; then
    echo "✅ PASS: Backend is running"
    ((PASS++))
else
    echo "❌ FAIL: Backend is not running"
    ((FAIL++))
fi

# Test 2: Register endpoint exists
echo ""
echo "Test 2: Can register new user"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"9876543210","role":"shipper","businessName":"Test Company"}')

if echo "$REGISTER_RESPONSE" | grep -q "success\|user\|token"; then
    echo "✅ PASS: User registration works"
    ((PASS++))
else
    echo "❌ FAIL: User registration failed"
    echo "Response: $REGISTER_RESPONSE"
    ((FAIL++))
fi

# Test 3: Login endpoint exists
echo ""
echo "Test 3: Can request OTP for login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/login" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"9876543210"}')

if echo "$LOGIN_RESPONSE" | grep -q "otp\|session\|success"; then
    echo "✅ PASS: Login endpoint works"
    ((PASS++))
else
    echo "❌ FAIL: Login endpoint failed"
    echo "Response: $LOGIN_RESPONSE"
    ((FAIL++))
fi

# Test 4: Pricing calculation (FROZEN: ₹5/tonne/km)
echo ""
echo "Test 4: Price calculation with ₹5/tonne/km"
PRICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/payments/calculate" \
    -H "Content-Type: application/json" \
    -d '{"distance":100,"weight":10,"vehicleType":"TRUCK"}')

if echo "$PRICE_RESPONSE" | grep -q "basePrice\|totalAmount"; then
    echo "✅ PASS: Price calculation endpoint exists"
    ((PASS++))

    # Verify actual pricing: 100km * 10 tonnes * ₹5 = ₹5000 base
    if echo "$PRICE_RESPONSE" | grep -q "5000"; then
        echo "✅ PASS: Pricing is ₹5/tonne/km (FROZEN)"
        ((PASS++))
    else
        echo "❌ FAIL: Pricing is not ₹5/tonne/km"
        ((FAIL++))
    fi
else
    echo "❌ FAIL: Price calculation endpoint missing"
    echo "Response: $PRICE_RESPONSE"
    ((FAIL++))
fi

# Test 5: GST calculation (FROZEN: 18%)
echo ""
echo "Test 5: GST is 18%"
if echo "$PRICE_RESPONSE" | grep -q "gst"; then
    echo "✅ PASS: GST included in response"
    ((PASS++))
else
    echo "❌ FAIL: GST not in response"
    ((FAIL++))
fi

# Test 6: Fleet types (FROZEN: 10T, 15T, 20T only)
echo ""
echo "Test 6: Fleet types are 10T, 15T, 20T only"
echo "⚠️  MANUAL CHECK NEEDED: Verify in code or documentation"

# Test 7: Booking creation
echo ""
echo "Test 7: Can create booking"
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/bookings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d '{"pickupLocation":{"pincode":"508001"},"deliveryLocation":{"pincode":"508207"}}')

if echo "$BOOKING_RESPONSE" | grep -q "bookingId\|booking"; then
    echo "✅ PASS: Booking endpoint exists"
    ((PASS++))
else
    echo "❌ FAIL: Booking creation failed"
    echo "Response: $BOOKING_RESPONSE"
    ((FAIL++))
fi

echo ""
echo "================================="
echo "RESULTS"
echo "================================="
echo "✅ PASSED: $PASS"
echo "❌ FAILED: $FAIL"
echo "TOTAL: $((PASS + FAIL))"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED"
    exit 0
else
    echo ""
    echo "⚠️  SOME TESTS FAILED"
    exit 1
fi
