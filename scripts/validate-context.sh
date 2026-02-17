#!/bin/bash

# Ubertruck MVP Context Validation Script
# Version: 1.0.0-FROZEN
# Purpose: Validate frozen requirements before any implementation

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  UBERTRUCK MVP - CONTEXT VALIDATION v1.0.0"
echo "================================================"
echo ""

# Configuration
PROJECT_DIR="/home/koans/projects/ubertruck"
FROZEN_VERSION="1.0.0-FROZEN"
ERRORS=0
WARNINGS=0

# Function to check requirement
check_requirement() {
    local name=$1
    local pattern=$2
    local file=$3

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name: Valid"
        return 0
    else
        echo -e "${RED}✗${NC} $name: INVALID - Missing required pattern"
        ((ERRORS++))
        return 1
    fi
}

# Function to check forbidden patterns
check_forbidden() {
    local name=$1
    local pattern=$2
    local directory=$3

    if grep -rqi "$pattern" "$directory" --include="*.js" --include="*.ts" --include="*.md" 2>/dev/null; then
        echo -e "${RED}✗${NC} $name: VIOLATION DETECTED"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $name: Clean"
        return 0
    fi
}

# 1. Version Check
echo "1. VERSION VALIDATION"
echo "---------------------"
if [ -f "$PROJECT_DIR/docs/01-vision-requirements/vision-requirements.md" ]; then
    if grep -q "$FROZEN_VERSION" "$PROJECT_DIR/docs/01-vision-requirements/vision-requirements.md"; then
        echo -e "${GREEN}✓${NC} Frozen Version: Valid"
    else
        echo -e "${RED}✗${NC} Frozen Version: INVALID - Missing required pattern"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Vision requirements file not found"
    ((ERRORS++))
fi
echo ""

# 2. Business Rules Validation
echo "2. BUSINESS RULES VALIDATION"
echo "----------------------------"
check_requirement "Pricing (₹5/tonne/km)" "₹5.*tonne.*km" "$PROJECT_DIR/docs/02-srs/software-requirements-specification.md"
check_requirement "GST Rate (18%)" "18%" "$PROJECT_DIR/docs/02-srs/software-requirements-specification.md"
check_requirement "Fleet Capacities" "10-20 tonne\|10.*15.*20" "$PROJECT_DIR/docs/01-vision-requirements/vision-requirements.md"
check_requirement "OTP Format" "6.*digit" "$PROJECT_DIR/docs/02-srs/software-requirements-specification.md"
check_requirement "Booking Window" "7.*day" "$PROJECT_DIR/docs/02-srs/software-requirements-specification.md"
check_requirement "Status Stages" "CREATED.*ASSIGNED.*DELIVERED\|status.*transition" "$PROJECT_DIR/docs/02-srs/software-requirements-specification.md"
echo ""

# 3. Technical Stack Validation
echo "3. TECHNICAL STACK VALIDATION"
echo "-----------------------------"
check_requirement "PostgreSQL 15" "PostgreSQL.*15" "$PROJECT_DIR/docs/03-system-design/system-design-document.md"
check_requirement "Redis 7" "Redis.*7" "$PROJECT_DIR/docs/03-system-design/system-design-document.md"
check_requirement "Node.js 20" "Node\.js.*20" "$PROJECT_DIR/docs/03-system-design/system-design-document.md"
check_requirement "Service Ports" "300[1-6]" "$PROJECT_DIR/docs/03-system-design/system-design-document.md"
echo ""

# 4. Scope Drift Detection
echo "4. SCOPE DRIFT DETECTION"
echo "------------------------"
# Check for dynamic pricing (but ignore "no dynamic pricing" statements)
if grep -rqi "implement.*dynamic.*pricing\|add.*surge.*pricing\|enable.*variable.*rate" "$PROJECT_DIR" --include="*.js" --include="*.ts" 2>/dev/null; then
    echo -e "${RED}✗${NC} Dynamic Pricing: VIOLATION DETECTED"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Dynamic Pricing: Clean"
fi
# Check for real-time GPS (ignore negations)
if grep -rqi "implement.*real.*time.*gps\|enable.*live.*tracking" "$PROJECT_DIR" --include="*.js" --include="*.ts" 2>/dev/null; then
    echo -e "${RED}✗${NC} Real-time GPS: VIOLATION DETECTED"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Real-time GPS: Clean"
fi

# Check for payment gateway
if grep -rqi "integrate.*payment.*gateway\|razorpay\|stripe.*integration" "$PROJECT_DIR" --include="*.js" --include="*.ts" 2>/dev/null; then
    echo -e "${RED}✗${NC} Payment Gateway: VIOLATION DETECTED"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Payment Gateway: Clean"
fi

# Check for invalid fleet capacities (only in actual code, not docs)
if find "$PROJECT_DIR" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" 2>/dev/null | xargs grep -q "25T\|30T\|35T\|40T" 2>/dev/null; then
    echo -e "${RED}✗${NC} Invalid Fleet: VIOLATION DETECTED"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Invalid Fleet: Clean"
fi

# Check for 4-digit OTP (only in code)
if find "$PROJECT_DIR" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" 2>/dev/null | xargs grep -qi "otp.*4.*digit\|4.*digit.*otp" 2>/dev/null; then
    echo -e "${RED}✗${NC} 4-digit OTP: VIOLATION DETECTED"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} 4-digit OTP: Clean"
fi
echo ""

# 5. Corridor Validation
echo "5. CORRIDOR VALIDATION"
echo "----------------------"
check_requirement "Nalgonda-Miryalguda" "Nalgonda.*Miryalguda" "$PROJECT_DIR/docs/01-vision-requirements/vision-requirements.md"

# Check for old corridor references
if grep -rq "Hosur.*Bengaluru" "$PROJECT_DIR/docs" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Warning: Found references to old corridor (Hosur-Bengaluru)"
    ((WARNINGS++))
fi
echo ""

# 6. File Structure Validation
echo "6. FILE STRUCTURE VALIDATION"
echo "----------------------------"
REQUIRED_DIRS=(
    "docs/01-vision-requirements"
    "docs/02-srs"
    "docs/03-system-design"
    "docs/10-critical-remediation"
    "docs/11-template-management"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$PROJECT_DIR/$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${YELLOW}⚠${NC} $dir missing"
        ((WARNINGS++))
    fi
done
echo ""

# 7. Change Request Status
echo "7. CHANGE REQUEST STATUS"
echo "------------------------"
if [ -f "$PROJECT_DIR/docs/12-change-requests/CR-2024-001-FLEET-OTP-CHANGES.md" ]; then
    if grep -q "REJECTED\|DEFERRED" "$PROJECT_DIR/docs/12-change-requests/CR-2024-001-FLEET-OTP-CHANGES.md"; then
        echo -e "${GREEN}✓${NC} CR-2024-001: Properly rejected/deferred"
    else
        echo -e "${YELLOW}⚠${NC} CR-2024-001: Status unclear"
        ((WARNINGS++))
    fi
else
    echo -e "${GREEN}✓${NC} No pending change requests"
fi
echo ""

# Final Summary
echo "================================================"
echo "              VALIDATION SUMMARY"
echo "================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo "Context is valid and frozen requirements are intact."
    echo "You may proceed with implementation."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ VALIDATION PASSED WITH WARNINGS${NC}"
    echo "Errors: 0 | Warnings: $WARNINGS"
    echo "Review warnings but can proceed with caution."
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo "Errors: $ERRORS | Warnings: $WARNINGS"
    echo ""
    echo "CRITICAL: Fix all errors before proceeding!"
    echo "Frozen requirements have been violated."
    exit 1
fi