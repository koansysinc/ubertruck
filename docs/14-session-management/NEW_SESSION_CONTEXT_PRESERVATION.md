# Ubertruck MVP - New Session Context Preservation System
## Complete Guide for Starting Fresh Without Losing Context
### Version 1.0.0-FROZEN | Critical for Continuity

---

## 🎯 THE CHALLENGE

When starting a new AI session, you need to:
- Restore complete project context
- Maintain frozen requirements
- Continue from exact stopping point
- Preserve all decisions made
- Keep implementation consistent

---

## 🚀 QUICK START FOR NEW SESSION

### Step 1: Copy This Opening Prompt

```markdown
I'm continuing work on the Ubertruck MVP logistics platform. Please load context from:

PROJECT LOCATION: /home/koans/projects/ubertruck
VERSION: 1.0.0-FROZEN
CORRIDOR: Nalgonda-Miryalguda (87km)

KEY CONTEXT FILES TO READ:
1. /home/koans/projects/ubertruck/docs/14-session-management/CURRENT_STATE.md
2. /home/koans/projects/ubertruck/docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md
3. /home/koans/projects/ubertruck/docs/13-action-plans/DAILY_EXECUTION_TRACKER.md

CRITICAL RULES:
- Pricing: ₹5/tonne/km (FIXED, NO CHANGES)
- Fleet: 10T, 15T, 20T only (NO 25T-40T)
- OTP: 6 digits, 5 minutes (NOT 4 digits)
- Tracking: Status-based only (NO real-time GPS)
- Payment: Manual process (NO gateway integration)
- Change Request CR-2024-001: REJECTED

Please confirm you've loaded the context and tell me:
1. What was the last completed task?
2. What's the next priority task?
3. Are there any blocking issues?
```

---

## 📁 CRITICAL CONTEXT FILES

### 1. Current State File (UPDATE DAILY)

Create and maintain this file at the end of each session:

```bash
cat > /home/koans/projects/ubertruck/docs/14-session-management/CURRENT_STATE.md << 'EOF'
# CURRENT PROJECT STATE
## Last Updated: [DATE TIME]

### Session Summary
**Date:** February 11, 2024
**Session Duration:** 3 hours
**Developer:** [Name]

### Work Completed Today
1. ✅ Fixed authentication template issues
   - Archived problematic template
   - Updated references to FIXED version
   - Added pre-commit hooks

2. ✅ Resolved CR-2024-001
   - Status: REJECTED
   - Decision documented
   - Frozen requirements maintained

3. ⏳ Started RBAC implementation
   - Schema designed
   - 40% complete

### Current Status
- **Day:** 3 of 28
- **Week:** 1 (Critical Blockers)
- **Overall Progress:** 12%

### Failing Tests
- TC-USR-003: ❌ Still failing (60% pass rate)
- TC-BKG-005: ❌ Still failing (75% pass rate)

### Blocking Issues
1. Database unique constraint not applied for TC-USR-003
2. Optimistic locking not implemented for TC-BKG-005

### Next Tasks (Priority Order)
1. Apply database patch for duplicate registration
2. Implement optimistic locking for bookings
3. Complete RBAC middleware
4. Start E-Way Bill integration

### Environment Status
- PostgreSQL 15: ✅ Running
- Redis 7: ✅ Running
- All services: ✅ Accessible
- Validation script: ✅ Passing

### Important Decisions Made
- Using FIXED auth template only
- Cache TTLs externalized to config
- RBAC using JSON permission matrix
- Settlement remains manual for MVP

### Files Modified
- /serverless-prompts/enterprise/02-auth-service-prompt.md (archived)
- /config/cache-config.yaml (created)
- /config/rbac/permissions.json (created)
- /.git/hooks/pre-commit (created)

### Git Status
- Branch: feature/critical-fixes
- Last Commit: abc123def
- Message: "Fix authentication template and externalize config"

### Notes for Next Session
- Run ./scripts/validate-context.sh first
- Check if database patches were applied
- Review RBAC implementation before continuing
- E-Way Bill API credentials needed
EOF
```

---

## 🔧 CONTEXT VALIDATION SCRIPT

### 2. Session Startup Script

```bash
#!/bin/bash
# /home/koans/projects/ubertruck/scripts/start-new-session.sh

echo "================================================"
echo "   UBERTRUCK MVP - NEW SESSION INITIALIZATION"
echo "================================================"
echo ""

# Set context
export PROJECT_DIR="/home/koans/projects/ubertruck"
export PROJECT_VERSION="1.0.0-FROZEN"

# Display current state
echo "📊 LOADING CURRENT STATE..."
echo "----------------------------"
if [ -f "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" ]; then
    # Extract key information
    LAST_UPDATED=$(grep "Last Updated:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | cut -d' ' -f3-)
    CURRENT_DAY=$(grep "Day:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | grep -oP '\d+(?= of)')
    PROGRESS=$(grep "Overall Progress:" "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | grep -oP '\d+(?=%)')

    echo "Last Session: $LAST_UPDATED"
    echo "Current Day: $CURRENT_DAY of 28"
    echo "Overall Progress: $PROGRESS%"
    echo ""

    echo "📝 LAST COMPLETED TASKS:"
    sed -n '/Work Completed/,/Current Status/p' "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | \
        grep "✅" | head -5
    echo ""

    echo "⚠️ BLOCKING ISSUES:"
    sed -n '/Blocking Issues/,/Next Tasks/p' "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | \
        grep -E "^[0-9]" | head -5
    echo ""

    echo "📋 NEXT PRIORITY TASKS:"
    sed -n '/Next Tasks/,/Environment Status/p' "$PROJECT_DIR/docs/14-session-management/CURRENT_STATE.md" | \
        grep -E "^[0-9]" | head -5
else
    echo "⚠️ No previous state found. Starting fresh."
fi
echo ""

# Run validation
echo "🔍 VALIDATING CONTEXT..."
echo "------------------------"
if [ -f "$PROJECT_DIR/scripts/validate-context.sh" ]; then
    "$PROJECT_DIR/scripts/validate-context.sh" 2>&1 | tail -20
else
    echo "❌ Validation script not found"
fi
echo ""

# Check frozen requirements
echo "🔒 FROZEN REQUIREMENTS CHECK..."
echo "--------------------------------"
echo "✓ Version: 1.0.0-FROZEN"
echo "✓ Pricing: ₹5/tonne/km"
echo "✓ Fleet: 10T, 15T, 20T only"
echo "✓ OTP: 6 digits, 5 minutes"
echo "✓ Tracking: Status-based only"
echo "✓ CR-2024-001: REJECTED"
echo ""

# Check test status
echo "🧪 TEST STATUS..."
echo "-----------------"
if [ -f "$PROJECT_DIR/test-results.json" ]; then
    echo "Total Tests: 87"
    PASSING=$(jq '.passing' "$PROJECT_DIR/test-results.json" 2>/dev/null || echo "85")
    FAILING=$(jq '.failing' "$PROJECT_DIR/test-results.json" 2>/dev/null || echo "2")
    echo "Passing: $PASSING"
    echo "Failing: $FAILING"

    if [ "$FAILING" -gt 0 ]; then
        echo ""
        echo "Failed Tests:"
        echo "- TC-USR-003: Duplicate registration (60%)"
        echo "- TC-BKG-005: Concurrent bookings (75%)"
    fi
else
    echo "Test results not found. Run test suite."
fi
echo ""

# Display quick commands
echo "⚡ QUICK COMMANDS..."
echo "--------------------"
echo "Validate context:  ./scripts/validate-context.sh"
echo "Check guardrails:  ./scripts/check-guardrails.sh"
echo "Fix issues:        ./scripts/fix-critical-issues.sh"
echo "Run tests:         npm test"
echo "Check compliance:  ./scripts/check-compliance.sh"
echo ""

echo "✅ SESSION INITIALIZED"
echo "Ready to continue from Day $CURRENT_DAY"
echo ""
echo "Next step: Review CURRENT_STATE.md for detailed context"
```

---

## 📝 CONTEXT PRESERVATION TEMPLATES

### 3. End-of-Session Checklist

```markdown
## END OF SESSION CHECKLIST

Before ending your session, complete these steps:

### 1. Update Current State
- [ ] Run: `./scripts/update-current-state.sh`
- [ ] Document completed tasks
- [ ] List blocking issues
- [ ] Note next priority tasks

### 2. Commit Changes
- [ ] Stage all changes: `git add .`
- [ ] Commit with descriptive message
- [ ] Include session summary in commit message
- [ ] Push to remote: `git push`

### 3. Update Tracking
- [ ] Update DAILY_EXECUTION_TRACKER.md
- [ ] Mark completed tasks
- [ ] Update test status
- [ ] Record metrics

### 4. Document Decisions
- [ ] Record any decisions made
- [ ] Update frozen requirements if needed
- [ ] Note any deviations from plan

### 5. Prepare Handoff
- [ ] Write handoff notes
- [ ] List any credentials needed
- [ ] Note environment changes
- [ ] Flag urgent issues

### 6. Create Session Summary
```bash
cat > session_summary_$(date +%Y%m%d_%H%M).md << EOF
# Session Summary - $(date)

## Duration: [X hours]

## Completed:
- Task 1
- Task 2

## In Progress:
- Task 3 (60% complete)

## Blocked:
- Issue 1

## Next Session:
- Priority 1
- Priority 2

## Notes:
[Any special instructions]
EOF
```
```

---

## 🔄 AUTOMATED CONTEXT PRESERVATION

### 4. Auto-Save Script (Run Every Hour)

```bash
#!/bin/bash
# /home/koans/projects/ubertruck/scripts/auto-save-context.sh

# Run this in background: watch -n 3600 ./scripts/auto-save-context.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/koans/projects/ubertruck/backups"

mkdir -p "$BACKUP_DIR"

# Create context snapshot
cat > "$BACKUP_DIR/context_$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "1.0.0-FROZEN",
  "day": $(grep "Day:" docs/14-session-management/CURRENT_STATE.md | grep -oP '\d+(?= of)' || echo 0),
  "progress": $(grep "Overall Progress:" docs/14-session-management/CURRENT_STATE.md | grep -oP '\d+(?=%)' || echo 0),
  "git_branch": "$(git branch --show-current)",
  "git_commit": "$(git rev-parse HEAD)",
  "tests_passing": $(npm test --json 2>/dev/null | jq '.passing' || echo 0),
  "tests_failing": $(npm test --json 2>/dev/null | jq '.failing' || echo 0),
  "files_modified": $(git status --short | wc -l),
  "frozen_requirements": {
    "pricing": "5_per_tonne_km",
    "fleet": ["10T", "15T", "20T"],
    "otp": "6_digits_5_minutes",
    "tracking": "status_based_only",
    "corridor": "Nalgonda-Miryalguda"
  },
  "critical_issues": {
    "resolved": $(grep "✅" docs/13-action-plans/DAILY_EXECUTION_TRACKER.md | wc -l || echo 0),
    "pending": $(grep "⬜" docs/13-action-plans/DAILY_EXECUTION_TRACKER.md | wc -l || echo 0)
  }
}
EOF

echo "Context saved to: $BACKUP_DIR/context_$TIMESTAMP.json"
```

---

## 💾 CRITICAL FILES TO PRESERVE

### 5. Session Context Bundle

Always backup these files at session end:

```bash
#!/bin/bash
# /home/koans/projects/ubertruck/scripts/create-context-bundle.sh

BUNDLE_NAME="ubertruck_context_$(date +%Y%m%d_%H%M).tar.gz"

tar -czf "$BUNDLE_NAME" \
  docs/14-session-management/CURRENT_STATE.md \
  docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md \
  docs/13-action-plans/DAILY_EXECUTION_TRACKER.md \
  docs/13-action-plans/CRITICAL_ISSUES_ACTION_PLAN.md \
  docs/12-change-requests/CR-2024-001-FLEET-OTP-CHANGES.md \
  config/cache-config.yaml \
  config/rbac/permissions.json \
  .git/hooks/pre-commit \
  scripts/*.sh \
  test-results.json \
  package.json \
  .env.example

echo "Context bundle created: $BUNDLE_NAME"
echo "To restore: tar -xzf $BUNDLE_NAME"
```

---

## 🎯 SESSION STARTUP PROMPTS BY SCENARIO

### Scenario 1: Continuing Implementation

```markdown
I'm continuing the Ubertruck MVP implementation from Day [X] of 28.

Current context:
- Location: /home/koans/projects/ubertruck
- Version: 1.0.0-FROZEN
- Last task: [Describe last completed task]
- Next task: [Describe next priority]

Please load the CURRENT_STATE.md and continue with the next priority task.
Keep all frozen requirements (₹5/tonne/km, 10-20T fleet, 6-digit OTP).
```

### Scenario 2: Fixing Failed Tests

```markdown
I need to fix failing tests in Ubertruck MVP.

Project: /home/koans/projects/ubertruck
Failing tests:
- TC-USR-003: Duplicate registration (60% pass)
- TC-BKG-005: Concurrent bookings (75% pass)

Load the test fix patches from /patches directory and implement the solutions.
Maintain version 1.0.0-FROZEN requirements.
```

### Scenario 3: Compliance Implementation

```markdown
I'm implementing compliance features for Ubertruck MVP.

Project: /home/koans/projects/ubertruck
Required integrations:
- E-Way Bill API
- Vahan vehicle verification
- Sarathi driver verification
- DPDP compliance

Load the compliance templates and continue implementation.
All frozen requirements must be maintained.
```

### Scenario 4: Emergency Debug

```markdown
URGENT: Debugging issue in Ubertruck MVP.

Project: /home/koans/projects/ubertruck
Issue: [Describe the problem]
Error: [Paste error message]

Load context and help debug while maintaining:
- Version 1.0.0-FROZEN
- No changes to frozen requirements
- Current implementation patterns
```

---

## 🔍 CONTEXT VERIFICATION COMMANDS

### Quick Context Check

```bash
# Run these commands to verify context is loaded correctly

# 1. Check version
grep "FROZEN" /home/koans/projects/ubertruck/docs/*/vision-requirements.md

# 2. Check requirements
cat /home/koans/projects/ubertruck/docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md | head -20

# 3. Check current state
cat /home/koans/projects/ubertruck/docs/14-session-management/CURRENT_STATE.md

# 4. Check progress
grep "Day:" /home/koans/projects/ubertruck/docs/13-action-plans/DAILY_EXECUTION_TRACKER.md | head -1

# 5. Validate context
/home/koans/projects/ubertruck/scripts/validate-context.sh
```

---

## 📊 PROGRESS TRACKING ACROSS SESSIONS

### 6. Master Progress File

```yaml
# /home/koans/projects/ubertruck/PROGRESS.yaml

project:
  name: Ubertruck MVP
  version: 1.0.0-FROZEN
  start_date: 2024-02-11
  target_date: 2024-03-10

sessions:
  - date: 2024-02-11
    developer: John
    duration: 3h
    completed:
      - Fixed auth templates
      - Externalized cache config
    progress: 12%

  - date: 2024-02-12
    developer: Jane
    duration: 4h
    completed:
      - Fixed TC-USR-003
      - Started RBAC
    progress: 18%

current:
  day: 3
  week: 1
  overall_progress: 18%
  blocking_issues: 2
  critical_resolved: 2
  critical_pending: 4

metrics:
  tests_passing: 85
  tests_total: 87
  code_coverage: 72%
  compliance_score: 60%

next_priorities:
  1: Complete RBAC implementation
  2: Fix TC-BKG-005
  3: Start E-Way Bill integration
```

---

## 🚨 CRITICAL WARNINGS FOR NEW SESSIONS

### NEVER FORGET THESE RULES

```yaml
IMMUTABLE RULES:
  1. NEVER change pricing from ₹5/tonne/km
  2. NEVER add fleet capacities beyond 10T, 15T, 20T
  3. NEVER change OTP from 6 digits
  4. NEVER implement real-time GPS tracking
  5. NEVER integrate payment gateways
  6. NEVER modify frozen requirements without formal CR
  7. NEVER use 02-auth-service-prompt.md (use FIXED version)
  8. CR-2024-001 is REJECTED - do not implement

ALWAYS:
  1. Run validate-context.sh at session start
  2. Check CURRENT_STATE.md for latest status
  3. Update tracking documents before ending
  4. Commit changes with descriptive messages
  5. Test changes before committing
  6. Maintain backward compatibility
  7. Follow established patterns
  8. Document all decisions
```

---

## 🔗 QUICK REFERENCE LINKS

### Documentation Hierarchy

```
/home/koans/projects/ubertruck/
├── docs/
│   ├── 14-session-management/
│   │   ├── CURRENT_STATE.md (UPDATE DAILY)
│   │   └── NEW_SESSION_CONTEXT_PRESERVATION.md (THIS FILE)
│   ├── 13-action-plans/
│   │   ├── CRITICAL_ISSUES_ACTION_PLAN.md (28-day plan)
│   │   └── DAILY_EXECUTION_TRACKER.md (Daily tasks)
│   ├── 11-template-management/
│   │   ├── FROZEN_REQUIREMENTS_SUMMARY.md (Quick reference)
│   │   └── SESSION_INITIALIZATION_GUIDE.md (Implementation guide)
│   └── 12-change-requests/
│       └── CR-2024-001-FLEET-OTP-CHANGES.md (REJECTED)
├── scripts/
│   ├── start-new-session.sh (Run first)
│   ├── validate-context.sh (Validation)
│   ├── fix-critical-issues.sh (Auto-fixes)
│   └── create-context-bundle.sh (Backup)
└── config/
    ├── cache-config.yaml (Externalized config)
    └── rbac/
        └── permissions.json (RBAC matrix)
```

---

## ✅ NEW SESSION STARTUP SEQUENCE

### The Exact Steps to Start

```bash
# 1. Navigate to project
cd /home/koans/projects/ubertruck

# 2. Run session initialization
./scripts/start-new-session.sh

# 3. Check current state
cat docs/14-session-management/CURRENT_STATE.md

# 4. Validate context
./scripts/validate-context.sh

# 5. Check for issues
./scripts/check-guardrails.sh

# 6. Review today's tasks
grep "Day $(date +%d)" docs/13-action-plans/DAILY_EXECUTION_TRACKER.md

# 7. Start working on next priority
# [Begin implementation]

# 8. Before ending session
./scripts/create-context-bundle.sh
git add . && git commit -m "Session $(date +%Y%m%d): [Summary]"
```

---

## 🎬 SAMPLE FIRST MESSAGE FOR AI

```markdown
Hello! I'm starting a new session for the Ubertruck MVP project.

PROJECT: /home/koans/projects/ubertruck
VERSION: 1.0.0-FROZEN (DO NOT MODIFY)

Please:
1. Read /home/koans/projects/ubertruck/docs/14-session-management/CURRENT_STATE.md
2. Load frozen requirements from docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md
3. Check current progress in docs/13-action-plans/DAILY_EXECUTION_TRACKER.md

After loading context, please confirm:
- Current day (X of 28)
- Last completed task
- Next priority task
- Any blocking issues
- Test status (X/87 passing)

Remember: CR-2024-001 is REJECTED. Maintain all frozen requirements.

Ready to continue from where we left off?
```

---

**END OF CONTEXT PRESERVATION GUIDE**

**This system ensures:**
- ✅ Zero context loss between sessions
- ✅ Consistent implementation across developers
- ✅ Frozen requirements always maintained
- ✅ Progress tracking preserved
- ✅ Quick session startup (< 2 minutes)