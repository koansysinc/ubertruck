# 🚀 UBERTRUCK MVP - NEW SESSION QUICK START

## COPY THIS TO START ANY NEW SESSION:

```markdown
I'm continuing work on the Ubertruck MVP logistics platform.

PROJECT: /home/koans/projects/ubertruck
VERSION: 1.0.0-FROZEN
STATUS: Day [CHECK CURRENT_STATE.md] of 28

Please:
1. Read /home/koans/projects/ubertruck/docs/14-session-management/CURRENT_STATE.md
2. Check /home/koans/projects/ubertruck/docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md
3. Review /home/koans/projects/ubertruck/docs/13-action-plans/DAILY_EXECUTION_TRACKER.md

Key frozen requirements:
- Pricing: ₹5/tonne/km (NO CHANGES)
- Fleet: 10T, 15T, 20T only (NO 25T-40T)
- OTP: 6 digits (NOT 4 digits)
- Tracking: Status-based (NO real-time GPS)
- CR-2024-001: REJECTED

Tell me the current status and next priority task.
```

## OR RUN THIS COMMAND FIRST:

```bash
cd /home/koans/projects/ubertruck && ./scripts/start-new-session.sh
```

## CRITICAL FILES TO CHECK:

1. **Current Status:** `/docs/14-session-management/CURRENT_STATE.md`
2. **Today's Tasks:** `/docs/13-action-plans/DAILY_EXECUTION_TRACKER.md`
3. **Frozen Rules:** `/docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md`
4. **Action Plan:** `/docs/13-action-plans/CRITICAL_ISSUES_ACTION_PLAN.md`

## VALIDATION COMMANDS:

```bash
# Check context is valid
./scripts/validate-context.sh

# Fix critical issues
./scripts/fix-critical-issues.sh

# Check for violations
./scripts/check-guardrails.sh
```

## ⚠️ NEVER FORGET:

- **Version:** 1.0.0-FROZEN (immutable)
- **Pricing:** ₹5/tonne/km (never change)
- **Fleet:** 10T, 15T, 20T only
- **OTP:** 6 digits, 5 minutes
- **GPS:** NO real-time tracking
- **Payment:** NO gateway integration
- **CR-2024-001:** REJECTED

## 📊 CURRENT STATE (as of Feb 11, 2024):

- **Progress:** Day 0 of 28 (5% complete)
- **Phase:** Planning complete, ready to implement
- **Failing Tests:** 2 (TC-USR-003, TC-BKG-005)
- **Critical Issues:** 6 identified, 0 resolved
- **Next:** Run fix-critical-issues.sh

## 🎯 BEFORE ENDING SESSION:

```bash
# Update state file
vim docs/14-session-management/CURRENT_STATE.md

# Commit changes
git add . && git commit -m "Session $(date +%Y%m%d): [Summary]"

# Create backup
tar -czf ubertruck_context_$(date +%Y%m%d_%H%M).tar.gz docs/ scripts/ config/
```

---
**READY TO START!**