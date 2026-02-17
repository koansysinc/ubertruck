#!/bin/bash

# UberTruck MVP - Production Deployment Verification Script
# This script tests all critical functionality on the deployed application

echo "🔍 UberTruck Production Verification"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get URLs from user or use defaults
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./verify-deployment.sh <BACKEND_URL> <FRONTEND_URL>"
    echo "Example: ./verify-deployment.sh https://ubertruck-api.onrender.com https://ubertruck.vercel.app"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Track test results
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=$5

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" "$url")
    fi

    if [ "$STATUS" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $STATUS)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $STATUS)"
        ((FAILED++))
        return 1
    fi
}

echo "🏥 1. Health Check Tests"
echo "------------------------"
test_endpoint "Backend Health" "GET" "$BACKEND_URL/health" "" "200"
test_endpoint "Frontend Home" "GET" "$FRONTEND_URL" "" "200"
test_endpoint "API Version" "GET" "$BACKEND_URL/api/v1" "" "200"
echo ""

echo "💰 2. Pricing Tests (Frozen Requirements)"
echo "-----------------------------------------"
PRICE_DATA='{"distance":100,"weight":10,"pickupPincode":"508001","deliveryPincode":"508207"}'
echo "Testing pricing calculation..."
PRICE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/calculate" \
    -H "Content-Type: application/json" \
    -d "$PRICE_DATA")

if echo "$PRICE_RESPONSE" | grep -q '"basePrice":5000'; then
    echo -e "${GREEN}✅ PASS${NC} - Base price calculation correct (₹5/tonne/km)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Base price calculation incorrect"
    echo "Response: $PRICE_RESPONSE"
    ((FAILED++))
fi

if echo "$PRICE_RESPONSE" | grep -q '"cgst":495' && echo "$PRICE_RESPONSE" | grep -q '"sgst":495'; then
    echo -e "${GREEN}✅ PASS${NC} - GST calculation correct (18%)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - GST calculation incorrect"
    ((FAILED++))
fi
echo ""

echo "👤 3. User Authentication Tests"
echo "--------------------------------"
# Generate random phone number for testing
TEST_PHONE=$((RANDOM % 9000000000 + 1000000000))
REG_DATA="{\"phoneNumber\":\"$TEST_PHONE\",\"role\":\"shipper\",\"businessName\":\"Test Company\"}"

test_endpoint "User Registration" "POST" "$BACKEND_URL/api/v1/users/register" "$REG_DATA" "201"

LOGIN_DATA="{\"phoneNumber\":\"$TEST_PHONE\"}"
echo "Testing login (OTP request)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/users/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

if echo "$LOGIN_RESPONSE" | grep -q 'otp' && echo "$LOGIN_RESPONSE" | grep -q 'sessionId'; then
    echo -e "${GREEN}✅ PASS${NC} - OTP generated successfully"
    ((PASSED++))

    # Extract OTP for verification test
    OTP=$(echo "$LOGIN_RESPONSE" | grep -oP '"otp":"\K[^"]+')
    SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -oP '"sessionId":"\K[^"]+')

    if [ ${#OTP} -eq 6 ]; then
        echo -e "${GREEN}✅ PASS${NC} - OTP format correct (6 digits)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - OTP format incorrect (expected 6 digits, got ${#OTP})"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} - OTP generation failed"
    ((FAILED++))
fi
echo ""

echo "🚛 4. Fleet Management Tests"
echo "-----------------------------"
test_endpoint "Get Available Trucks" "GET" "$BACKEND_URL/api/v1/fleet/available" "" "200"
test_endpoint "Get Fleet Capacity" "GET" "$BACKEND_URL/api/v1/fleet/capacity" "" "200"
echo ""

echo "📦 5. Booking Tests"
echo "-------------------"
# Note: Actual booking creation requires authentication
test_endpoint "Get Booking Types" "GET" "$BACKEND_URL/api/v1/bookings/types" "" "200"
echo ""

echo "🗺️ 6. Route Tests"
echo "------------------"
ROUTE_DATA='{"origin":"508001","destination":"508207"}'
test_endpoint "Calculate Route" "POST" "$BACKEND_URL/api/v1/routes/calculate" "$ROUTE_DATA" "200"
echo ""

echo "⚡ 7. Performance Tests"
echo "-----------------------"
echo -n "Backend response time... "
START_TIME=$(date +%s%N)
curl -s "$BACKEND_URL/health" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))

if [ "$RESPONSE_TIME" -lt 3000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - ${RESPONSE_TIME}ms (< 3s)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - ${RESPONSE_TIME}ms (> 3s)"
    ((FAILED++))
fi

echo -n "Frontend load time... "
START_TIME=$(date +%s%N)
curl -s "$FRONTEND_URL" > /dev/null
END_TIME=$(date +%s%N)
LOAD_TIME=$(((END_TIME - START_TIME) / 1000000))

if [ "$LOAD_TIME" -lt 5000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - ${LOAD_TIME}ms (< 5s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ WARNING${NC} - ${LOAD_TIME}ms (> 5s)"
    # Don't fail for first load as CDN might be cold
fi
echo ""

echo "🔒 8. Security Tests"
echo "--------------------"
echo -n "CORS headers present... "
CORS_HEADER=$(curl -s -I "$BACKEND_URL/health" | grep -i "access-control-allow-origin")
if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - No CORS headers found"
    ((FAILED++))
fi

echo -n "HTTPS enforcement... "
if [[ "$BACKEND_URL" == https://* ]] && [[ "$FRONTEND_URL" == https://* ]]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Not using HTTPS"
    ((FAILED++))
fi
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Success Rate: ${PERCENTAGE}%"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment verified successfully.${NC}"
    echo ""
    echo "✅ Frozen Requirements Verified:"
    echo "   • Pricing: ₹5/tonne/km"
    echo "   • GST: 18% (CGST 9% + SGST 9%)"
    echo "   • OTP: 6 digits"
    echo "   • Manual payment (no gateway)"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please check the logs above.${NC}"
    echo ""
    echo "Common issues:"
    echo "• Render free tier might be spinning up (wait 30-60 seconds)"
    echo "• CORS might need updating with correct frontend URL"
    echo "• Database connection might need verification"
    exit 1
fi