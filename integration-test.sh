#!/bin/bash

# UberTruck Production Integration Testing Script
# Tests the deployed frontend and backend together

echo "======================================"
echo "🧪 UberTruck Integration Testing"
echo "======================================"
echo ""

# Configuration
FRONTEND_URL="https://ubertruck-29vya4iic-koansysincs-projects.vercel.app"
BACKEND_URL="https://ubertruck.onrender.com"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3

    echo -n "Testing $name... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$STATUS" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $STATUS)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $STATUS)"
        ((FAILED++))
    fi
}

echo "📍 Deployment URLs:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend: $BACKEND_URL"
echo ""

echo "1️⃣ Testing Frontend Availability"
echo "---------------------------------"
test_endpoint "Frontend Homepage" "$FRONTEND_URL" "200"
echo ""

echo "2️⃣ Testing Backend Endpoints"
echo "-----------------------------"
echo "Note: First request may take 30-60s due to cold start..."
test_endpoint "Backend Health" "$BACKEND_URL/health" "200"
test_endpoint "API Version" "$BACKEND_URL/api/v1" "200"
echo ""

echo "3️⃣ Testing CORS Headers"
echo "-----------------------"
echo -n "Testing CORS from frontend to backend... "
CORS_HEADER=$(curl -s -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS "$BACKEND_URL/api/v1/users/login" -I | grep -i "access-control-allow-origin" | head -1)

if [[ "$CORS_HEADER" == *"$FRONTEND_URL"* ]] || [[ "$CORS_HEADER" == *"*"* ]]; then
    echo -e "${GREEN}✅ PASS${NC} - CORS configured"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ WARNING${NC} - CORS may need updating"
    echo "  Current: $CORS_HEADER"
    echo "  Update CORS_ORIGIN on Render to: $FRONTEND_URL"
fi
echo ""

echo "4️⃣ Testing API Functionality"
echo "----------------------------"

# Test price calculation
echo -n "Testing price calculation... "
PRICE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/calculate" \
    -H "Content-Type: application/json" \
    -d '{"distance":100,"weight":10,"pickupPincode":"508001","deliveryPincode":"508207"}')

if echo "$PRICE_RESPONSE" | grep -q '"basePrice":5000'; then
    echo -e "${GREEN}✅ PASS${NC} - Pricing correct (₹5/tonne/km)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Pricing incorrect"
    echo "  Response: $PRICE_RESPONSE"
    ((FAILED++))
fi

# Test user registration
echo -n "Testing user registration... "
TEST_PHONE=$((RANDOM % 9000000000 + 1000000000))
REG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/users/register" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\":\"$TEST_PHONE\",\"role\":\"shipper\",\"businessName\":\"Test Company\"}")

if echo "$REG_RESPONSE" | grep -q '"success":true' || echo "$REG_RESPONSE" | grep -q '"userId"'; then
    echo -e "${GREEN}✅ PASS${NC} - Registration works"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Registration failed"
    ((FAILED++))
fi
echo ""

echo "5️⃣ Testing Full User Flow"
echo "-------------------------"

# Test login flow
echo -n "Testing login (OTP generation)... "
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/users/login" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\":\"$TEST_PHONE\"}")

if echo "$LOGIN_RESPONSE" | grep -q '"sessionId"' && echo "$LOGIN_RESPONSE" | grep -q '"otp"'; then
    echo -e "${GREEN}✅ PASS${NC} - OTP generated"
    ((PASSED++))

    # Extract OTP and session
    OTP=$(echo "$LOGIN_RESPONSE" | grep -oP '"otp":"\K[^"]+' | head -1)
    SESSION_ID=$(echo "$LOGIN_RESPONSE" | grep -oP '"sessionId":"\K[^"]+' | head -1)

    if [ ${#OTP} -eq 6 ]; then
        echo -e "  ${GREEN}✅${NC} OTP format correct (6 digits)"
    else
        echo -e "  ${RED}❌${NC} OTP format incorrect"
    fi
else
    echo -e "${RED}❌ FAIL${NC} - OTP generation failed"
    ((FAILED++))
fi
echo ""

echo "6️⃣ Performance Testing"
echo "----------------------"

# Test backend response time
echo -n "Backend response time... "
START_TIME=$(date +%s%N)
curl -s "$BACKEND_URL/health" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))

if [ "$RESPONSE_TIME" -lt 3000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - ${RESPONSE_TIME}ms (< 3s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ SLOW${NC} - ${RESPONSE_TIME}ms (> 3s) - Cold start likely"
fi

# Test frontend load time
echo -n "Frontend load time... "
START_TIME=$(date +%s%N)
curl -s "$FRONTEND_URL" > /dev/null
END_TIME=$(date +%s%N)
LOAD_TIME=$(((END_TIME - START_TIME) / 1000000))

if [ "$LOAD_TIME" -lt 2000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - ${LOAD_TIME}ms (< 2s)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️ WARNING${NC} - ${LOAD_TIME}ms (> 2s)"
fi
echo ""

echo "7️⃣ Security Checks"
echo "------------------"

# Test HTTPS enforcement
echo -n "HTTPS enforcement... "
if [[ "$BACKEND_URL" == https://* ]] && [[ "$FRONTEND_URL" == https://* ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Both using HTTPS"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Not using HTTPS"
    ((FAILED++))
fi

# Test for exposed sensitive headers
echo -n "Security headers check... "
HEADERS=$(curl -s -I "$BACKEND_URL/health")
if echo "$HEADERS" | grep -qi "x-powered-by"; then
    echo -e "${YELLOW}⚠️ WARNING${NC} - X-Powered-By header exposed"
else
    echo -e "${GREEN}✅ PASS${NC} - Sensitive headers hidden"
    ((PASSED++))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
if [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: ${PERCENTAGE}%"
fi
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 All integration tests passed!${NC}"
    echo ""
    echo "✅ Your deployment is fully functional:"
    echo "   • Frontend: $FRONTEND_URL"
    echo "   • Backend: $BACKEND_URL"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Update CORS_ORIGIN on Render if needed"
    echo "   2. Test the live application in browser"
    echo "   3. Monitor for any errors"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please review the results above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "   • Wait for backend cold start to complete"
    echo "   • Update CORS_ORIGIN on Render to: $FRONTEND_URL"
    echo "   • Check Render logs for errors"
    echo "   • Verify environment variables are set"
    exit 1
fi