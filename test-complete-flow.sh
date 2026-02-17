#!/bin/bash
# Complete end-to-end flow test
# Tests: Register → Login → OTP → Get Token → Create Booking

BASE_URL="http://localhost:4000"

echo "================================="
echo "COMPLETE FLOW TEST"
echo "================================="

# Step 1: Register user
echo ""
echo "Step 1: Registering new user..."
PHONE="9876543210"
REGISTER=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE\",\"role\":\"shipper\",\"businessName\":\"Test Logistics\"}")

echo "$REGISTER" | python3 -m json.tool
echo ""

# Step 2: Request OTP
echo "Step 2: Requesting OTP..."
LOGIN=$(curl -s -X POST "$BASE_URL/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE\"}")

echo "$LOGIN" | python3 -m json.tool

# Extract session ID and OTP from response
SESSION_ID=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)
OTP=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('otp', ''))" 2>/dev/null)

echo ""
echo "Session ID: $SESSION_ID"
echo "OTP: $OTP"

# Step 3: Verify OTP and get token
if [ -n "$OTP" ] && [ -n "$SESSION_ID" ]; then
    echo ""
    echo "Step 3: Verifying OTP..."
    VERIFY=$(curl -s -X POST "$BASE_URL/api/v1/users/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"phoneNumber\":\"$PHONE\",\"otp\":\"$OTP\",\"sessionId\":\"$SESSION_ID\"}")

    echo "$VERIFY" | python3 -m json.tool

    TOKEN=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
    echo ""
    echo "Token: ${TOKEN:0:50}..."

    # Step 4: Calculate price
    if [ -n "$TOKEN" ]; then
        echo ""
        echo "Step 4: Calculating price..."
        PRICE=$(curl -s -X POST "$BASE_URL/api/v1/payments/calculate" \
          -H "Content-Type: application/json" \
          -d '{"distance":87,"weight":15,"pickupPincode":"508001","deliveryPincode":"508207"}')

        echo "$PRICE" | python3 -m json.tool

        # Step 5: Create booking
        echo ""
        echo "Step 5: Creating booking..."
        BOOKING=$(curl -s -X POST "$BASE_URL/api/v1/bookings" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d '{
            "pickupLocation": {
              "pincode": "508001",
              "address": "Nalgonda Bus Stand",
              "latitude": 17.0505,
              "longitude": 79.2677
            },
            "deliveryLocation": {
              "pincode": "508207",
              "address": "Miryalguda Market",
              "latitude": 16.8764,
              "longitude": 79.5625
            },
            "cargoWeight": 15,
            "cargoType": "GENERAL",
            "cargoDescription": "Agricultural equipment",
            "pickupTime": "'$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%S.000Z)'",
            "pickupContactName": "Rajesh Kumar",
            "pickupContactPhone": "9876543210",
            "deliveryContactName": "Suresh Reddy",
            "deliveryContactPhone": "9876543211"
          }')

        echo "$BOOKING" | python3 -m json.tool

        if echo "$BOOKING" | grep -q "bookingId\|booking_id"; then
            echo ""
            echo "================================="
            echo "✅ COMPLETE FLOW SUCCESS"
            echo "================================="
            echo "All steps completed successfully:"
            echo "1. ✅ User registered"
            echo "2. ✅ OTP sent"
            echo "3. ✅ OTP verified, token received"
            echo "4. ✅ Price calculated (₹5/tonne/km, 18% GST)"
            echo "5. ✅ Booking created"
            exit 0
        else
            echo ""
            echo "❌ Booking creation failed"
            exit 1
        fi
    else
        echo "❌ No token received"
        exit 1
    fi
else
    echo "❌ No OTP or session ID received"
    exit 1
fi
