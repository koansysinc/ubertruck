# DEVELOPMENT PROTOCOL
## Systematic Approach with Zero Hallucinations

---

## RULE 1: TEST BEFORE CLAIMING

**NEVER claim anything works without running a test.**

### Before saying "X is working":
1. Write a test command
2. Run it
3. Show the output
4. Only then state the result

### Example:
❌ WRONG: "The login endpoint is working"
✅ RIGHT:
```bash
$ curl -X POST http://localhost:4000/api/v1/users/login -d '{"phoneNumber":"9876543210"}'
{"success":true,"otp":"123456"}
# VERIFIED: Login endpoint returns OTP
```

---

## RULE 2: CONTEXT TRACKING

### Track State in a Single File

**File**: `/home/koans/projects/ubertruck/CURRENT_STATE.json`

```json
{
  "lastUpdated": "2026-02-13T12:00:00Z",
  "backend": {
    "running": true,
    "port": 4000,
    "database": "mock",
    "redis": "mock"
  },
  "frontend": {
    "running": true,
    "port": 3000,
    "apiConnected": true
  },
  "verifiedEndpoints": [
    {
      "method": "POST",
      "path": "/api/v1/payments/calculate",
      "tested": "2026-02-13T12:45:00Z",
      "status": "working",
      "testCommand": "curl -X POST http://localhost:4000/api/v1/payments/calculate -d '{\"distance\":100,\"weight\":10}'"
    }
  ],
  "frozenRequirements": {
    "pricing_rate": {"required": "5", "verified": "5", "status": "pass"},
    "gst_rate": {"required": "18%", "verified": "18%", "status": "pass"}
  },
  "knownIssues": [
    {
      "issue": "Account activation needed for bookings",
      "severity": "medium",
      "workaround": "None yet"
    }
  ]
}
```

---

## RULE 3: FROZEN REQUIREMENTS CHECKLIST

### Every requirement must have:
1. ✅ Test command
2. ✅ Expected output
3. ✅ Actual output
4. ✅ Pass/Fail status
5. ✅ Date verified

### Frozen Requirements Tracker

**File**: `/home/koans/projects/ubertruck/frozen-requirements-status.json`

```json
{
  "requirements": [
    {
      "id": "FR-001",
      "requirement": "Pricing: ₹5/tonne/km",
      "status": "VERIFIED",
      "testCommand": "curl -X POST http://localhost:4000/api/v1/payments/calculate -H 'Content-Type: application/json' -d '{\"distance\":100,\"weight\":10,\"pickupPincode\":\"508001\",\"deliveryPincode\":\"508207\"}'",
      "expectedValue": 5000,
      "actualValue": 5000,
      "testedAt": "2026-02-13T12:45:00Z",
      "verifiedBy": "automated-test"
    },
    {
      "id": "FR-002",
      "requirement": "GST: 18%",
      "status": "VERIFIED",
      "testCommand": "curl -X POST http://localhost:4000/api/v1/payments/calculate -H 'Content-Type: application/json' -d '{\"distance\":100,\"weight\":10,\"pickupPincode\":\"508001\",\"deliveryPincode\":\"508207\"}'",
      "expectedValue": "18%",
      "actualValue": {"cgst": 9, "sgst": 9, "total": 18},
      "testedAt": "2026-02-13T12:45:00Z",
      "verifiedBy": "automated-test"
    },
    {
      "id": "FR-003",
      "requirement": "Fleet types: 10T, 15T, 20T only",
      "status": "NOT_TESTED",
      "testCommand": "TBD",
      "expectedValue": ["10T", "15T", "20T"],
      "actualValue": null,
      "testedAt": null,
      "verifiedBy": null
    },
    {
      "id": "FR-004",
      "requirement": "OTP: 6 digits, 5 min expiry",
      "status": "PARTIALLY_VERIFIED",
      "testCommand": "curl -X POST http://localhost:4000/api/v1/users/login -H 'Content-Type: application/json' -d '{\"phoneNumber\":\"9876543210\"}'",
      "expectedValue": {"length": 6, "expiry": 300},
      "actualValue": {"length": 6, "expiry": "not_verified"},
      "testedAt": "2026-02-13T12:30:00Z",
      "verifiedBy": "automated-test"
    }
  ]
}
```

---

## RULE 4: DEVELOPMENT WORKFLOW

### Phase-Based Development with Verification Gates

#### Phase 1: Backend API (Current)
- [ ] All frozen requirements tested
- [ ] All API endpoints have test commands
- [ ] Integration tests pass
- [ ] Documentation updated with test results

**Gate**: Cannot proceed to Phase 2 until all checked

#### Phase 2: Database Deployment
- [ ] PostgreSQL installed
- [ ] Schema deployed
- [ ] Seed data loaded
- [ ] Connection tested
- [ ] All API tests re-run with real DB

**Gate**: Cannot proceed to Phase 3 until all checked

#### Phase 3: Frontend Integration
- [ ] Frontend connects to backend
- [ ] All forms submit successfully
- [ ] All flows tested end-to-end
- [ ] E2E tests passing

**Gate**: Cannot proceed to Phase 4 until all checked

#### Phase 4: Production Readiness
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Monitoring configured
- [ ] Deployment scripts tested

---

## RULE 5: EVIDENCE-BASED REPORTING

### Every Status Report Must Include:

1. **What Changed**
   - Specific files modified
   - Specific functions added
   - Line count changes

2. **Verification Commands**
   - Exact curl commands
   - Expected vs actual output
   - Screenshots if needed

3. **Known Issues**
   - What doesn't work
   - Why it doesn't work
   - Workaround if any

4. **Next Steps**
   - Specific tasks (not vague)
   - Estimated time
   - Dependencies

### Report Template:

```markdown
## Status Report - [Date]

### Completed (VERIFIED):
- [Task]: [Test command] → [Result]

### In Progress:
- [Task]: [Current blocker]

### Not Started:
- [Task]: [Dependencies]

### Blockers:
- [Issue]: [Details]
```

---

## RULE 6: NO ASSUMPTIONS ALLOWED

### Banned Phrases:
- ❌ "This should work"
- ❌ "Probably working"
- ❌ "I think it's done"
- ❌ "Most likely complete"

### Required Phrases:
- ✅ "VERIFIED: Test passed"
- ✅ "NOT TESTED: Cannot confirm"
- ✅ "FAILED: Error shown below"
- ✅ "BLOCKED: Waiting for X"

---

## RULE 7: FILE CHANGE TRACKING

### Before Modifying ANY File:

1. Read current content
2. Show diff of changes
3. Test the change
4. Document the change

### Change Log Format:

```
File: src/controllers/paymentController.js
Date: 2026-02-13T13:00:00Z
Change: Added calculatePrice function (lines 603-672)
Reason: Missing endpoint for frozen requirement FR-001
Tested: curl -X POST http://localhost:4000/api/v1/payments/calculate
Result: PASS - Returns correct ₹5/tonne/km calculation
```

---

## RULE 8: DAILY VERIFICATION

### End of Day Checklist:

Run these commands and save output:

```bash
# 1. Backend health
curl http://localhost:4000/health > health-$(date +%Y%m%d).json

# 2. Frozen requirements test
./test-frozen-requirements.sh > frozen-test-$(date +%Y%m%d).log

# 3. Complete flow test
./test-complete-flow.sh > flow-test-$(date +%Y%m%d).log

# 4. Save state
echo "$(date): All tests run" >> verification-log.txt
```

---

## RULE 9: STAKEHOLDER COMMUNICATION

### Only Share Verified Facts

**Template for Stakeholder Update:**

```
Subject: UberTruck MVP Status - [Date]

VERIFIED WORKING:
1. [Feature]: [Test proof]
2. [Feature]: [Test proof]

NOT WORKING:
1. [Feature]: [Reason]

FROZEN REQUIREMENTS STATUS:
- [Requirement]: VERIFIED ✅
- [Requirement]: NOT TESTED ⚠️
- [Requirement]: FAILED ❌

DEMO AVAILABLE:
[List of curl commands they can run]

NEXT MILESTONE:
[Specific deliverable with date]
```

---

## RULE 10: CONTINUOUS VERIFICATION

### Automated Test Suite

Create: `/home/koans/projects/ubertruck/run-all-tests.sh`

```bash
#!/bin/bash
# Run all verification tests

echo "=== STARTING VERIFICATION ==="
date

echo ""
echo "1. Backend Health Check"
./test-backend-health.sh || exit 1

echo ""
echo "2. Frozen Requirements"
./test-frozen-requirements.sh || exit 1

echo ""
echo "3. Complete User Flow"
./test-complete-flow.sh || exit 1

echo ""
echo "4. Frontend Tests"
cd ubertruck-ui && npm test || exit 1

echo ""
echo "=== ALL TESTS PASSED ==="
date
```

Run this:
- Before every commit
- Before every demo
- Before every status update

---

## IMPLEMENTATION CHECKLIST

### To Implement This Protocol:

- [ ] Create CURRENT_STATE.json
- [ ] Create frozen-requirements-status.json
- [ ] Create run-all-tests.sh
- [ ] Update test scripts with proper output
- [ ] Set up daily verification cron job
- [ ] Create change log file
- [ ] Document all current verified endpoints
- [ ] Document all known issues
- [ ] Create stakeholder update template

---

## SUCCESS CRITERIA

### This Protocol Succeeds When:

1. ✅ Every claim has a test command
2. ✅ Every test can be run by stakeholders
3. ✅ State is tracked in version control
4. ✅ No hallucinations in reports
5. ✅ All frozen requirements have pass/fail status
6. ✅ Issues are documented honestly
7. ✅ Progress is measurable and verifiable

---

**This protocol eliminates hallucinations by requiring evidence for every claim.**

**Adopt this immediately for production-ready development.**
