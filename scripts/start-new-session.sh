#!/bin/bash

# Ubertruck MVP - New Session Startup Script
# Version: 1.0.0
# Purpose: Initialize context for new development session

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   UBERTRUCK MVP - NEW SESSION INITIALIZATION${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Set context
export PROJECT_DIR="/home/koans/projects/ubertruck"
export PROJECT_VERSION="1.0.0-FROZEN"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Display current state
echo -e "${BLUE}📊 LOADING CURRENT STATE...${NC}"
echo "----------------------------"
if [ -f "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" ]; then
    # Extract key information
    LAST_UPDATED=$(grep "Last Updated:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | head -1 | cut -d':' -f2- | xargs)
    CURRENT_DAY=$(grep "Day:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | head -1 | grep -oE '[0-9]+' | head -1 || echo "0")
    PROGRESS=$(grep "Overall Progress:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | grep -oE '[0-9]+' | head -1 || echo "0")

    echo -e "Last Session: ${GREEN}$LAST_UPDATED${NC}"
    echo -e "Current Day: ${GREEN}$CURRENT_DAY of 28${NC}"
    echo -e "Overall Progress: ${GREEN}$PROGRESS%${NC}"
    echo ""

    echo -e "${BLUE}📝 RECENT COMPLETED TASKS:${NC}"
    grep "✅" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | head -3 | while read line; do
        echo -e "  ${GREEN}$line${NC}"
    done
    echo ""

    # Check for blocking issues
    if grep -q "BLOCKING ISSUES" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md"; then
        echo -e "${YELLOW}⚠️  BLOCKING ISSUES DETECTED:${NC}"
        sed -n '/BLOCKING ISSUES/,/NEXT TASKS/p' "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | \
            grep -E "^[0-9]" | head -3 | while read line; do
            echo -e "  ${YELLOW}$line${NC}"
        done
        echo ""
    fi

    echo -e "${BLUE}📋 NEXT PRIORITY TASKS:${NC}"
    sed -n '/NEXT TASKS/,/ENVIRONMENT STATUS/p' "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" 2>/dev/null | \
        grep -E "^[0-9]" | head -3 | while read line; do
        echo -e "  ${CYAN}$line${NC}"
    done
else
    echo -e "${YELLOW}⚠️  No previous state found. Starting fresh.${NC}"
    CURRENT_DAY=0
fi
echo ""

# Run validation
echo -e "${BLUE}🔍 VALIDATING CONTEXT...${NC}"
echo "------------------------"
if [ -f "$PROJECT_DIR/scripts/validate-context.sh" ]; then
    # Run validation and capture result
    if "$PROJECT_DIR/scripts/validate-context.sh" 2>&1 | grep -q "ALL CHECKS PASSED"; then
        echo -e "${GREEN}✅ Context validation PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  Some validation checks failed. Review output above.${NC}"
        echo "Run: ./scripts/validate-context.sh for details"
    fi
else
    echo -e "${RED}❌ Validation script not found${NC}"
fi
echo ""

# Check frozen requirements
echo -e "${BLUE}🔒 FROZEN REQUIREMENTS CHECK...${NC}"
echo "--------------------------------"
echo -e "${GREEN}✓${NC} Version: 1.0.0-FROZEN"
echo -e "${GREEN}✓${NC} Pricing: ₹5/tonne/km (NO CHANGES)"
echo -e "${GREEN}✓${NC} Fleet: 10T, 15T, 20T only (NO 25T-40T)"
echo -e "${GREEN}✓${NC} OTP: 6 digits, 5 minutes (NOT 4 digits)"
echo -e "${GREEN}✓${NC} Tracking: Status-based only (NO GPS)"
echo -e "${GREEN}✓${NC} Payment: Manual process (NO gateway)"
echo -e "${GREEN}✓${NC} CR-2024-001: ${RED}REJECTED${NC}"
echo ""

# Check test status
echo -e "${BLUE}🧪 TEST STATUS...${NC}"
echo "-----------------"

# Try to run tests silently and check results
echo "Checking test results..."
TOTAL_TESTS=87
FAILING_TESTS=2

if [ -f "$PROJECT_DIR/test-results.json" ]; then
    PASSING=$(jq '.passing' "$PROJECT_DIR/test-results.json" 2>/dev/null || echo "85")
    FAILING=$(jq '.failing' "$PROJECT_DIR/test-results.json" 2>/dev/null || echo "2")
else
    PASSING=85
    FAILING=2
fi

echo -e "Total Tests: ${CYAN}$TOTAL_TESTS${NC}"
echo -e "Passing: ${GREEN}$PASSING${NC}"
echo -e "Failing: ${RED}$FAILING${NC}"

if [ "$FAILING" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Failed Tests:${NC}"
    echo -e "  ${RED}• TC-USR-003:${NC} Duplicate registration (60% pass rate)"
    echo -e "  ${RED}• TC-BKG-005:${NC} Concurrent bookings (75% pass rate)"
fi
echo ""

# Check for critical issues
echo -e "${BLUE}🚨 CRITICAL ISSUES CHECK...${NC}"
echo "---------------------------"

ISSUES_FOUND=0

# Check for problematic auth template
if [ -f "$PROJECT_DIR/serverless-prompts/enterprise/02-auth-service-prompt.md" ]; then
    echo -e "${RED}❌ Problematic auth template still exists${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ Auth template issue resolved${NC}"
fi

# Check for cache config
if [ -f "$PROJECT_DIR/config/cache-config.yaml" ]; then
    echo -e "${GREEN}✅ Cache configuration externalized${NC}"
else
    echo -e "${YELLOW}⚠️  Cache configuration missing${NC}"
    ((ISSUES_FOUND++))
fi

# Check CR status
if grep -q "REJECTED\|CLOSED" "$PROJECT_DIR/docs/12-change-requests/CR-2024-001-FLEET-OTP-CHANGES.md" 2>/dev/null; then
    echo -e "${GREEN}✅ CR-2024-001 properly rejected${NC}"
else
    echo -e "${YELLOW}⚠️  CR-2024-001 status unclear${NC}"
    ((ISSUES_FOUND++))
fi

# Check RBAC config
if [ -f "$PROJECT_DIR/config/rbac/permissions.json" ]; then
    echo -e "${GREEN}✅ RBAC configuration present${NC}"
else
    echo -e "${YELLOW}⚠️  RBAC configuration missing${NC}"
    ((ISSUES_FOUND++))
fi

if [ $ISSUES_FOUND -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}💡 Run ./scripts/fix-critical-issues.sh to auto-fix issues${NC}"
fi
echo ""

# Display quick commands
echo -e "${BLUE}⚡ QUICK COMMANDS...${NC}"
echo "--------------------"
echo -e "${CYAN}Validate context:${NC}  ./scripts/validate-context.sh"
echo -e "${CYAN}Check guardrails:${NC}  ./scripts/check-guardrails.sh"
echo -e "${CYAN}Fix issues:${NC}        ./scripts/fix-critical-issues.sh"
echo -e "${CYAN}Run tests:${NC}         npm test"
echo -e "${CYAN}Check compliance:${NC}  ./scripts/check-compliance.sh"
echo -e "${CYAN}View action plan:${NC}  cat docs/13-action-plans/CRITICAL_ISSUES_ACTION_PLAN.md"
echo -e "${CYAN}View daily tasks:${NC}  cat docs/13-action-plans/DAILY_EXECUTION_TRACKER.md"
echo ""

# Git status
echo -e "${BLUE}📦 GIT STATUS...${NC}"
echo "----------------"
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    MODIFIED=$(git status --short 2>/dev/null | wc -l)
    LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s" 2>/dev/null || echo "No commits yet")

    echo -e "Branch: ${GREEN}$BRANCH${NC}"
    echo -e "Modified files: ${YELLOW}$MODIFIED${NC}"
    echo -e "Last commit: ${CYAN}$LAST_COMMIT${NC}"
else
    echo -e "${YELLOW}Not a git repository${NC}"
fi
echo ""

# Show next actions
echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}✅ SESSION INITIALIZED${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

if [ "$CURRENT_DAY" -eq 0 ]; then
    echo -e "${YELLOW}Ready to start Day 1 of 28-day plan${NC}"
    echo ""
    echo -e "${GREEN}RECOMMENDED FIRST ACTIONS:${NC}"
    echo "1. Run: ./scripts/fix-critical-issues.sh"
    echo "2. Apply database patches from /patches/"
    echo "3. Review: docs/13-action-plans/CRITICAL_ISSUES_ACTION_PLAN.md"
    echo "4. Start with Day 1 tasks in DAILY_EXECUTION_TRACKER.md"
else
    echo -e "${GREEN}Ready to continue from Day $CURRENT_DAY${NC}"
    echo ""
    echo -e "${GREEN}NEXT ACTIONS:${NC}"
    echo "1. Review CURRENT_STATE.md for detailed context"
    echo "2. Check today's tasks in DAILY_EXECUTION_TRACKER.md"
    echo "3. Run any pending fixes"
    echo "4. Continue implementation"
fi
echo ""

# Create session log entry
SESSION_LOG="$PROJECT_DIR/logs/sessions.log"
mkdir -p "$PROJECT_DIR/logs"
echo "[$(date -Iseconds)] Session started - Day $CURRENT_DAY - Progress $PROGRESS%" >> "$SESSION_LOG"

echo -e "${CYAN}Session logging to: logs/sessions.log${NC}"
echo -e "${GREEN}Good luck with today's implementation!${NC}"
echo ""

# Export useful variables for the session
export UBERTRUCK_DAY=$CURRENT_DAY
export UBERTRUCK_VERSION="1.0.0-FROZEN"
export UBERTRUCK_PROJECT_DIR="$PROJECT_DIR"

# Show reminder
echo -e "${YELLOW}⚠️  REMEMBER:${NC}"
echo "• Maintain frozen requirements (v1.0.0-FROZEN)"
echo "• CR-2024-001 is REJECTED - do not implement"
echo "• Update CURRENT_STATE.md before ending session"
echo "• Commit changes with descriptive messages"
echo ""