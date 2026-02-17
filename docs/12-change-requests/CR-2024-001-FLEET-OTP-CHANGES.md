# Change Request CR-2024-001
## Fleet Capacity Expansion & OTP Modification
### Date: February 2024 | Status: PENDING APPROVAL

---

## 1. CHANGE SUMMARY

**CR Number**: CR-2024-001
**Category**: P1 - Major
**Requester**: [To be filled]
**Date Submitted**: February 2024
**Target Sprint**: TBD

---

## 2. CHANGE DESCRIPTION

### Current State (FROZEN v1.0.0)
```yaml
Fleet Capacities: [10T, 15T, 20T] ONLY
OTP Format: 6-digit with 5-minute expiry
```

### Proposed State
```yaml
Fleet Capacities: [10T, 15T, 20T, 25T, 30T, 35T, 40T]
OTP Format: 4-digit with 5-minute expiry
```

### Justification
- **Fleet Expansion**: [Justification needed - larger cargo requirements?]
- **OTP Reduction**: [Justification needed - user convenience?]

---

## 3. IMPACT ANALYSIS

### 3.1 Technical Impact

#### Database Changes Required
```sql
-- Current constraint
ALTER TABLE trucks DROP CONSTRAINT chk_capacity;
ALTER TABLE trucks ADD CONSTRAINT chk_capacity
  CHECK (capacity IN (10, 15, 20, 25, 30, 35, 40));

-- New validation arrays needed
UPDATE pricing_rules SET valid_capacities = ARRAY[10,15,20,25,30,35,40];
```

#### Code Changes Required
```typescript
// Before
const VALID_CAPACITIES = [10, 15, 20];

// After
const VALID_CAPACITIES = [10, 15, 20, 25, 30, 35, 40];

// OTP Generation
// Before: 100000 + Math.random() * 900000 (6 digits)
// After: 1000 + Math.random() * 9000 (4 digits)
```

#### API Changes
- Booking API: Accept new capacity values
- Fleet API: Validate against expanded list
- Validation rules: Update all capacity checks

### 3.2 Business Impact

| Aspect | Impact | Risk Level |
|--------|--------|------------|
| **Fleet Operations** | Need to onboard trucks >20T | Medium |
| **Pricing** | Maintain ₹5/tonne/km for all sizes | Low |
| **Driver Training** | New vehicle categories | Medium |
| **Insurance** | Higher capacity = higher premiums | High |
| **Permits** | Different permits for >20T vehicles | High |
| **Road Restrictions** | Some routes may not allow >20T | High |

### 3.3 Security Impact

#### OTP Security Degradation
```yaml
6-digit OTP:
  Combinations: 1,000,000
  Brute Force Time: ~2.7 hours (at 100 attempts/sec)
  Security Level: HIGH

4-digit OTP:
  Combinations: 10,000
  Brute Force Time: ~1.6 minutes (at 100 attempts/sec)
  Security Level: MEDIUM

Risk: 100x easier to compromise
Mitigation Required: Stronger rate limiting
```

### 3.4 Testing Impact

- **New Test Cases**: 4 × 7 = 28 new capacity test scenarios
- **Regression Testing**: All booking flows
- **Load Testing**: Higher tonnage impact
- **Security Testing**: OTP brute force prevention

---

## 4. IMPLEMENTATION ESTIMATE

| Component | Current Effort | Additional Effort | Total |
|-----------|---------------|-------------------|-------|
| Database Schema | Complete | 2 hours | 2 hours |
| Backend APIs | Complete | 8 hours | 8 hours |
| Frontend UI | Complete | 4 hours | 4 hours |
| Validation Rules | Complete | 4 hours | 4 hours |
| Testing | Complete | 16 hours | 16 hours |
| Documentation | Complete | 4 hours | 4 hours |
| **TOTAL** | - | **38 hours** | **38 hours** |

**Timeline Impact**: +1 week to current schedule
**Budget Impact**: ₹30,000 (developer time)

---

## 5. RISK ASSESSMENT

### High Risks
1. **Regulatory Compliance**: Vehicles >20T have different regulations
2. **Route Limitations**: Not all routes allow heavy vehicles
3. **Security Weakness**: 4-digit OTP significantly less secure
4. **Scope Creep**: Adding capacities may lead to more changes

### Medium Risks
1. **Testing Coverage**: More combinations to test
2. **Performance**: Larger datasets to process
3. **User Training**: More options = more complexity

### Mitigation Strategy
1. Implement incrementally (add 25T first, test, then proceed)
2. Enhance rate limiting for 4-digit OTP
3. Verify route compatibility before allowing >20T bookings
4. Update compliance documentation

---

## 6. ALTERNATIVES CONSIDERED

### Alternative 1: Partial Implementation
- Add only 25T and 30T initially
- Keep 6-digit OTP unchanged
- **Pro**: Lower risk, faster implementation
- **Con**: May need another change later

### Alternative 2: Separate Heavy Fleet Service
- Keep current system for ≤20T
- Create new service for >20T
- **Pro**: No impact on current system
- **Con**: Duplicate effort, maintenance overhead

### Alternative 3: Reject Changes
- Maintain frozen requirements
- Focus on current scope
- **Pro**: No risk, no delay
- **Con**: May limit business growth

---

## 7. RECOMMENDATION

⚠️ **RECOMMENDATION: PARTIAL APPROVAL**

1. **REJECT** OTP change (keep 6-digit for security)
2. **DEFER** fleet expansion to Phase 2 (post-MVP)
3. **MAINTAIN** current frozen requirements for MVP

**Rationale**:
- MVP success depends on stability
- Security should not be compromised
- Fleet expansion can be added post-launch
- Maintains 18-week timeline and ₹10L budget

---

## 8. APPROVAL SECTION

### Required Approvals

| Role | Name | Decision | Date | Comments |
|------|------|----------|------|----------|
| Product Owner | | ⬜ Approve ⬜ Reject | | |
| Technical Lead | | ⬜ Approve ⬜ Reject | | |
| Security Lead | | ⬜ Approve ⬜ Reject | | |
| QA Lead | | ⬜ Approve ⬜ Reject | | |

### Decision
⬜ APPROVED - Proceed with changes
⬜ PARTIAL - Implement selected changes
⬜ DEFERRED - Postpone to Phase 2
⬜ REJECTED - Maintain frozen requirements

---

## 9. IMPLEMENTATION PLAN (If Approved)

### Phase 1: Preparation (Day 1-2)
- [ ] Update requirements documentation
- [ ] Create migration scripts
- [ ] Update test plans

### Phase 2: Implementation (Day 3-4)
- [ ] Database schema changes
- [ ] API modifications
- [ ] Frontend updates

### Phase 3: Testing (Day 5-6)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Security testing

### Phase 4: Deployment (Day 7)
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring

---

## 10. ROLLBACK PLAN

If issues detected post-deployment:

1. **Immediate**: Revert capacity validation to [10,15,20]
2. **Database**: No rollback needed (backward compatible)
3. **OTP**: Revert to 6-digit if changed
4. **Timeline**: <30 minutes rollback

---

**END OF CHANGE REQUEST**

**Status**: ⏳ AWAITING APPROVAL

**Note**: This change request must be approved by all stakeholders before any implementation. The frozen requirements (v1.0.0-FROZEN) remain in effect until formal approval.