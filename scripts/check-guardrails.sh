#!/bin/bash

# Ubertruck MVP Guardrail Enforcement Script
# Version: 1.0.0-FROZEN
# Purpose: Check for guardrail violations in code

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================================"
echo "    UBERTRUCK MVP - GUARDRAIL CHECKER"
echo "================================================"
echo ""

# Check if directory provided
if [ -z "$1" ]; then
    SCAN_DIR="."
    echo -e "${BLUE}Scanning current directory...${NC}"
else
    SCAN_DIR="$1"
    echo -e "${BLUE}Scanning: $SCAN_DIR${NC}"
fi
echo ""

VIOLATIONS=0

# Function to scan for violations
scan_violation() {
    local pattern=$1
    local description=$2
    local file_types=$3

    echo -n "Checking for $description... "

    # Build find command based on file types
    local find_cmd="find $SCAN_DIR -type f"
    for type in $file_types; do
        find_cmd="$find_cmd -name '*.$type' -o"
    done
    find_cmd="${find_cmd% -o}"  # Remove trailing -o

    # Search for pattern
    local results=$(eval "$find_cmd" | xargs grep -l "$pattern" 2>/dev/null || true)

    if [ -n "$results" ]; then
        echo -e "${RED}✗ VIOLATION FOUND${NC}"
        echo -e "${RED}Files with violations:${NC}"
        echo "$results" | while read file; do
            echo -e "  ${YELLOW}→${NC} $file"
            grep -n "$pattern" "$file" | head -3 | sed 's/^/    /'
        done
        ((VIOLATIONS++))
        return 1
    else
        echo -e "${GREEN}✓ Clean${NC}"
        return 0
    fi
}

# 1. Business Rule Violations
echo "1. BUSINESS RULE GUARDRAILS"
echo "----------------------------"

scan_violation "dynamic.*pric\|surge.*pric\|variable.*rate" \
    "Dynamic/Surge Pricing" \
    "js ts jsx tsx"

scan_violation "\(25\|30\|35\|40\)[Tt]" \
    "Invalid Fleet Capacity (>20T)" \
    "js ts jsx tsx json"

scan_violation "4[- ]?digit.*[Oo][Tt][Pp]" \
    "4-digit OTP" \
    "js ts jsx tsx"

scan_violation "[^₹][0-9]\+.*tonne.*km\|[^5]\/tonne\/km" \
    "Incorrect Pricing (not ₹5/tonne/km)" \
    "js ts jsx tsx md"

scan_violation "booking.*[8-9][0-9]\|booking.*[0-9]{2,}.*day" \
    "Booking Window >7 days" \
    "js ts jsx tsx"

echo ""

# 2. Technical Violations
echo "2. TECHNICAL GUARDRAILS"
echo "-----------------------"

scan_violation "real[- ]?time.*gps\|live.*track\|continuous.*location" \
    "Real-time GPS Tracking" \
    "js ts jsx tsx"

scan_violation "payment.*gateway\|razorpay\|stripe\|paypal\|paytm" \
    "Payment Gateway Integration" \
    "js ts jsx tsx json"

scan_violation "automated.*payment\|auto.*settle\|automatic.*transfer" \
    "Automated Payment Settlement" \
    "js ts jsx tsx"

scan_violation "port.*300[7-9]\|port.*30[1-9][0-9]\|port.*3[1-9][0-9]{2}" \
    "Invalid Service Port (not 3001-3006)" \
    "js ts jsx tsx json yaml"

echo ""

# 3. Architecture Violations
echo "3. ARCHITECTURE GUARDRAILS"
echo "--------------------------"

scan_violation "mongodb\|mysql\|mariadb\|oracle\|cassandra" \
    "Non-PostgreSQL Database" \
    "js ts jsx tsx json"

scan_violation "redis.*[0-6]\.\|redis.*8\|memcached\|hazelcast" \
    "Invalid Cache (not Redis 7)" \
    "js ts jsx tsx json yaml"

scan_violation "node.*1[0-8]\.\|node.*19\.\|deno\|bun" \
    "Invalid Runtime (not Node.js 20)" \
    "json yaml dockerfile"

echo ""

# 4. Scope Creep Detection
echo "4. SCOPE CREEP DETECTION"
echo "------------------------"

scan_violation "multi.*corridor\|multiple.*route\|route.*expansion" \
    "Multi-corridor Support" \
    "js ts jsx tsx md"

scan_violation "Hosur.*Bengaluru\|bengaluru\|bangalore" \
    "Old Corridor Reference" \
    "js ts jsx tsx json md"

scan_violation "machine.*learning\|artificial.*intelligence\|ML\|AI.*model" \
    "AI/ML Features (out of scope)" \
    "js ts jsx tsx"

echo ""

# 5. Security Violations
echo "5. SECURITY GUARDRAILS"
echo "----------------------"

scan_violation "eval\s*\(\|Function\s*\(\|new\s+Function" \
    "Dangerous eval() usage" \
    "js ts jsx tsx"

scan_violation "password.*['\"].*['\"]|secret.*['\"].*['\"]" \
    "Hardcoded Credentials" \
    "js ts jsx tsx json"

scan_violation "disable.*ssl\|rejectUnauthorized.*false" \
    "SSL Verification Disabled" \
    "js ts jsx tsx"

echo ""

# 6. Check for Required Patterns
echo "6. REQUIRED PATTERNS CHECK"
echo "---------------------------"

echo -n "Checking for ₹5/tonne/km pricing... "
if find $SCAN_DIR -name "*.js" -o -name "*.ts" 2>/dev/null | xargs grep -q "₹5.*tonne.*km\|5.*per.*tonne.*km" 2>/dev/null; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ Not found (may be OK if not in pricing module)${NC}"
fi

echo -n "Checking for 6-digit OTP... "
if find $SCAN_DIR -name "*.js" -o -name "*.ts" 2>/dev/null | xargs grep -q "6.*digit\|\\{6\\}\|length.*6" 2>/dev/null; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ Not found (may be OK if not in auth module)${NC}"
fi

echo -n "Checking for status stages... "
if find $SCAN_DIR -name "*.js" -o -name "*.ts" 2>/dev/null | xargs grep -q "CREATED\|ASSIGNED\|ENROUTE\|DELIVERED" 2>/dev/null; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ Not found (may be OK if not in tracking module)${NC}"
fi

echo ""

# Summary
echo "================================================"
echo "              GUARDRAIL SUMMARY"
echo "================================================"

if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✓ NO GUARDRAIL VIOLATIONS DETECTED${NC}"
    echo "Code is compliant with frozen requirements."
    exit 0
else
    echo -e "${RED}✗ $VIOLATIONS GUARDRAIL VIOLATION(S) FOUND${NC}"
    echo ""
    echo "CRITICAL: Fix all violations before proceeding!"
    echo "These violations conflict with frozen requirements."
    echo ""
    echo "To fix:"
    echo "1. Review the violated files listed above"
    echo "2. Remove or modify the violating code"
    echo "3. Run this script again to verify"
    exit 1
fi