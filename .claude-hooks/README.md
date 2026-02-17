# Claude Verification Hooks

## Purpose

These hooks enforce the DEVELOPMENT_PROTOCOL.md rules to prevent hallucinations and ensure all claims are verified with actual tests.

## Available Hooks

### `before-response.sh`

Runs before every Claude response to:
- Display current verified state from CURRENT_STATE.json
- Show frozen requirements status
- Remind about protocol rules (test before claiming)
- Ensure state tracking files exist

## How to Use

### Manual Execution

Run the hook manually before working on the project:

```bash
cd /home/koans/projects/ubertruck
./.claude-hooks/before-response.sh
```

### Expected Output

```
=================================
🔍 PROTOCOL VERIFICATION HOOK
=================================

📊 CURRENT STATE SUMMARY:
------------------------
Last Updated: 2026-02-13T13:05:00Z

Backend Status:
  Running: True
  Port: 4000
  Database: mock-memory

Frontend Status:
  Running: True
  Port: 3000

Verified Endpoints: 5
Known Issues: 3

🔒 FROZEN REQUIREMENTS STATUS:
------------------------------
  Pricing (₹5/tonne/km): PASS
  GST (18%): PASS
  OTP (6 digits): PASS

📋 PROTOCOL REMINDER:
--------------------
  ✅ Test before claiming
  ✅ Show test output
  ✅ Update CURRENT_STATE.json
  ❌ No assumptions
  ❌ No 'should work' claims

=================================
✅ Verification complete. Proceeding...
=================================
```

## What This Prevents

### ❌ BEFORE (Without Hook):
- Making claims without testing
- Assuming endpoints exist
- Creating false audit reports
- Forgetting to update state

### ✅ AFTER (With Hook):
- Always see current verified state first
- Remember frozen requirements
- Follow test-before-claim rule
- Track changes in CURRENT_STATE.json

## Integration with Claude Code

Claude Code can automatically run hooks if configured. Ask your Claude Code session to run:

```bash
./.claude-hooks/before-response.sh
```

At the start of each session or before making any claims.

## Dependencies

- Python 3 (for JSON parsing)
- Bash shell
- CURRENT_STATE.json must exist
- DEVELOPMENT_PROTOCOL.md must exist

## Troubleshooting

### Hook fails with "CURRENT_STATE.json not found"

Create the state file:
```bash
cp /home/koans/projects/ubertruck/CURRENT_STATE.json.template \
   /home/koans/projects/ubertruck/CURRENT_STATE.json
```

### Hook fails with "DEVELOPMENT_PROTOCOL.md not found"

Ensure the protocol file exists:
```bash
ls -la /home/koans/projects/ubertruck/DEVELOPMENT_PROTOCOL.md
```

## Related Files

- `/home/koans/projects/ubertruck/CURRENT_STATE.json` - Single source of truth
- `/home/koans/projects/ubertruck/DEVELOPMENT_PROTOCOL.md` - 10 strict rules
- `/home/koans/projects/ubertruck/VERIFIED_STATUS.md` - Honest status report
- `/home/koans/projects/ubertruck/test-frozen-requirements.sh` - Automated tests
- `/home/koans/projects/CLAUDE.md` - Repository-wide protocol reminder

## Why This Exists

This hook was created after a session where Claude made repeated false claims:
- Claimed backend didn't exist (it did - 4,669 lines)
- Claimed pricing endpoint worked (it didn't - was missing)
- Created audit reports without verification
- Caused stakeholder trust issues

The hook ensures these mistakes never happen again by making the protocol **impossible to ignore**.
