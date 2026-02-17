# Ubertruck MVP - Session Initialization Guide
## Starting Implementation in a New Development Session
### Version 1.0.0-FROZEN | Maintained Context & Guardrails

---

## 🚀 QUICK START CHECKLIST

### Step 1: Context Restoration (First 5 Minutes)

```bash
# 1. Navigate to project directory
cd /home/koans/projects/ubertruck

# 2. Verify frozen requirements are intact
grep -r "1.0.0-FROZEN" docs/ | wc -l
# Expected: 20+ files with frozen version

# 3. Check for unauthorized changes
git status
# Should show no modifications to frozen docs

# 4. Load context validation script
source scripts/validate-context.sh
```

### Step 2: Frozen Requirements Verification

```yaml
CRITICAL - These MUST NOT change:
  Project: Ubertruck MVP
  Version: 1.0.0-FROZEN
  Corridor: Nalgonda-Miryalguda (87km)

  Business Rules (IMMUTABLE):
    Pricing: ₹5/tonne/km
    GST: 18%
    Fleet: [10T, 15T, 20T] ONLY
    OTP: 6 digits, 5 minutes
    Booking: Max 7 days advance
    POD: Max 2MB
    Status: 9 stages (no GPS)

  Technical Stack (LOCKED):
    Backend: Node.js 20 LTS
    Database: PostgreSQL 15
    Cache: Redis 7
    Services: 6 microservices
    Ports: 3001-3006
```

---

## 📋 IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (Week 1-2)
```markdown
## Database Setup
1. [ ] Create PostgreSQL 15 database
   - Template: /docs/10-critical-remediation/data-dictionary-complete-erd.md
   - Tables: 30+ defined
   - Run: psql -f database/schema.sql

2. [ ] Setup Redis 7 cache
   - Template: /docs/03-system-design/system-design-document.md
   - Config: Section 4.2
   - Run: redis-server redis.conf

3. [ ] Initialize project structure
   - Template: /serverless-prompts/enterprise/00-master-orchestration-prompt.md
   - Create service directories
   - Setup Docker containers
```

### Phase 2: Core Services (Week 3-6)
```markdown
## Service Implementation Order
1. [ ] User Service (Port 3001)
   - Template: /serverless-prompts/enterprise/02-auth-service-prompt-FIXED.md
   - Endpoints: 12 defined
   - Priority: Authentication first

2. [ ] Fleet Service (Port 3002)
   - Template: /docs/02-srs/software-requirements-specification.md
   - Section: 3.2 Fleet Management
   - Trucks: 10T, 15T, 20T only

3. [ ] Booking Service (Port 3003)
   - Template: /serverless-prompts/03-booking-service-prompt.md
   - OTP: 6-digit validation
   - Advance: 7 days max
```

---

## 🔍 TEMPLATE SELECTION MATRIX

### By Task Type

```yaml
Task Type → Template Location:

  New Microservice:
    Primary: /serverless-prompts/enterprise/
    Backup: /docs/03-system-design/
    Example: 01-configuration-service-prompt-FIXED.md

  API Endpoint:
    Primary: /docs/10-critical-remediation/api-reference-openapi.yaml
    Backup: /docs/02-srs/software-requirements-specification.md
    Example: Booking API specification

  Database Operation:
    Primary: /docs/10-critical-remediation/data-dictionary-complete-erd.md
    Backup: /docs/03-system-design/
    Example: bookings table schema

  Business Logic:
    Primary: /docs/02-srs/software-requirements-specification.md
    Backup: /docs/01-vision-requirements/
    Example: Pricing calculation (₹5/tonne/km)

  Error Handling:
    Primary: /docs/10-critical-remediation/error-handling-scenarios.md
    Backup: /docs/03-system-design/
    Example: 25 predefined scenarios

  Testing:
    Primary: /docs/05-test-plan/test-plan.md
    Backup: /docs/10-critical-remediation/
    Example: Test case templates
```

---

## 🛡️ GUARDRAIL ENFORCEMENT

### Automatic Validation Commands

```bash
#!/bin/bash
# run-before-coding.sh - Execute before writing any code

echo "🔒 Ubertruck MVP Context Validation"
echo "===================================="

# 1. Verify frozen requirements
check_frozen() {
  echo "Checking frozen requirements..."

  # Price check
  if ! grep -q "₹5/tonne/km" "$1" 2>/dev/null; then
    echo "❌ ERROR: Invalid pricing - must be ₹5/tonne/km"
    return 1
  fi

  # Fleet check
  if grep -qE "25T|30T|35T|40T" "$1" 2>/dev/null; then
    echo "❌ ERROR: Invalid fleet capacity - only 10T, 15T, 20T allowed"
    return 1
  fi

  # OTP check
  if grep -q "4-digit" "$1" 2>/dev/null; then
    echo "❌ ERROR: Invalid OTP - must be 6-digit"
    return 1
  fi

  echo "✅ Frozen requirements intact"
  return 0
}

# 2. Detect scope drift
detect_drift() {
  echo "Checking for scope drift..."

  local forbidden=(
    "dynamic pricing"
    "surge pricing"
    "real-time GPS"
    "live tracking"
    "payment gateway"
    "automated settlement"
  )

  for term in "${forbidden[@]}"; do
    if grep -rqi "$term" . --include="*.js" --include="*.ts" 2>/dev/null; then
      echo "🚫 SCOPE DRIFT: Found forbidden feature: $term"
      return 1
    fi
  done

  echo "✅ No scope drift detected"
  return 0
}

# 3. Validate service ports
check_ports() {
  echo "Validating service ports..."

  local expected_ports=(3001 3002 3003 3004 3005 3006)
  local valid=true

  for port in "${expected_ports[@]}"; do
    if ! grep -rq "$port" config/ 2>/dev/null; then
      echo "⚠️ Warning: Port $port not configured"
      valid=false
    fi
  done

  if [ "$valid" = true ]; then
    echo "✅ All service ports configured"
  fi
}

# Run all checks
check_frozen "current_work.md" && detect_drift && check_ports

echo "===================================="
echo "Ready to start implementation"
```

---

## 📁 PROJECT STRUCTURE TEMPLATE

### Initialize with This Structure

```bash
ubertruck/
├── docs/                    # All frozen documentation
│   ├── 01-vision-requirements/
│   ├── 02-srs/
│   ├── 03-system-design/
│   ├── 04-project-plan/
│   ├── 05-test-plan/
│   ├── 10-critical-remediation/
│   └── 11-template-management/
│
├── services/               # Microservices implementation
│   ├── user-service/       # Port 3001
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── fleet-service/      # Port 3002
│   ├── booking-service/    # Port 3003
│   ├── tracking-service/   # Port 3004
│   ├── payment-service/    # Port 3005
│   └── admin-service/      # Port 3006
│
├── shared/                 # Shared components
│   ├── database/
│   │   ├── schema.sql      # 30+ tables
│   │   └── migrations/
│   ├── utils/
│   └── constants/
│       └── frozen.js       # Immutable values
│
├── scripts/               # Automation scripts
│   ├── validate-context.sh
│   ├── check-guardrails.sh
│   └── sync-templates.sh
│
└── docker/                # Containerization
    ├── docker-compose.yml
    └── Dockerfile.template
```

---

## 🎯 CRITICAL PATH IMPLEMENTATION

### Week 1-2: Foundation
```yaml
Priority Tasks:
  1. Database schema creation (30+ tables)
  2. Redis cache setup
  3. User authentication (JWT + OTP)
  4. Basic project structure

Templates to Use:
  - data-dictionary-complete-erd.md
  - 02-auth-service-prompt-FIXED.md
  - system-design-document.md
```

### Week 3-4: Core Services
```yaml
Priority Tasks:
  1. Fleet management CRUD
  2. Booking creation flow
  3. OTP validation (6-digit)
  4. Status tracking (9 stages)

Templates to Use:
  - software-requirements-specification.md
  - 03-booking-service-prompt.md
  - api-reference-openapi.yaml
```

### Week 5-6: Business Logic
```yaml
Priority Tasks:
  1. Pricing calculation (₹5/tonne/km)
  2. GST computation (18%)
  3. E-Way Bill integration
  4. Driver assignment algorithm

Templates to Use:
  - eway-bill-integration-workflow.md
  - tracking-scope-clarification.md
  - error-handling-scenarios.md
```

---

## ⚠️ COMMON PITFALLS TO AVOID

### 1. Scope Drift Traps
```markdown
❌ DO NOT ADD:
- Dynamic/surge pricing (even if requested)
- Real-time GPS tracking (status-based only)
- Payment gateway integration (manual only)
- Fleet capacities beyond 10T, 15T, 20T
- OTP changes from 6-digit format
- Booking window beyond 7 days
```

### 2. Technical Deviations
```markdown
❌ AVOID:
- Changing from PostgreSQL 15
- Modifying service port assignments
- Altering microservice boundaries
- Adding new services beyond the 6 defined
- Changing authentication mechanism
```

### 3. Process Violations
```markdown
❌ NEVER:
- Modify frozen documentation
- Skip validation checks
- Ignore guardrail warnings
- Implement without template reference
- Change core business rules
```

---

## 📊 PROGRESS TRACKING

### Daily Checklist
```markdown
## Start of Day
- [ ] Run validation script
- [ ] Check frozen requirements
- [ ] Review today's templates
- [ ] Verify no drift occurred

## During Development
- [ ] Reference templates for each task
- [ ] Validate against frozen specs
- [ ] Test with defined scenarios
- [ ] Document any issues

## End of Day
- [ ] Run guardrail checks
- [ ] Update progress tracker
- [ ] Commit only validated code
- [ ] Note any blockers
```

### Weekly Milestones
```yaml
Week 1-2: Foundation Complete
  - Database operational
  - Auth working with OTP
  - Project structure ready

Week 3-4: Core Services Live
  - Fleet CRUD operational
  - Booking flow complete
  - Status tracking working

Week 5-6: Business Logic Done
  - Pricing calculations accurate
  - E-Way Bill integrated
  - Error handling complete
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Context Lost?
```bash
# Restore context quickly
cat /home/koans/projects/ubertruck/docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md
```

### Template Confusion?
```bash
# Find right template
grep -r "your_feature" /home/koans/projects/ubertruck/docs/ --include="*.md"
```

### Validation Failed?
```bash
# Check specific requirement
./scripts/check-specific-rule.sh pricing
./scripts/check-specific-rule.sh fleet
./scripts/check-specific-rule.sh otp
```

---

## 💡 QUICK REFERENCE

### Immutable Constants
```javascript
// frozen-constants.js
module.exports = {
  PRICING_PER_TONNE_KM: 5,
  GST_RATE: 0.18,
  FLEET_CAPACITIES: [10, 15, 20],
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  MAX_BOOKING_DAYS: 7,
  POD_MAX_SIZE_MB: 2,
  STATUS_STAGES: 9,
  CORRIDOR: 'Nalgonda-Miryalguda',
  DISTANCE_KM: 87
};
```

### Service Endpoints
```yaml
User Service (3001):
  POST /api/v1/register
  POST /api/v1/login
  POST /api/v1/verify-otp

Fleet Service (3002):
  GET /api/v1/trucks
  POST /api/v1/trucks
  GET /api/v1/trucks/available

Booking Service (3003):
  POST /api/v1/bookings
  GET /api/v1/bookings/:id
  PUT /api/v1/bookings/:id/status
```

---

## ✅ READY TO START CHECKLIST

Before writing any code, ensure:

```markdown
## Prerequisites Verified
- [ ] All frozen docs accessible
- [ ] Validation scripts executable
- [ ] Template locations known
- [ ] Guardrails understood
- [ ] Change request CR-2024-001 reviewed (and rejected)

## Environment Ready
- [ ] PostgreSQL 15 installed
- [ ] Redis 7 configured
- [ ] Node.js 20 LTS setup
- [ ] Docker available
- [ ] Ports 3001-3006 free

## Context Loaded
- [ ] Version: 1.0.0-FROZEN confirmed
- [ ] Corridor: Nalgonda-Miryalguda
- [ ] Pricing: ₹5/tonne/km
- [ ] Fleet: 10T, 15T, 20T only
- [ ] Timeline: 18 weeks understood

## First Task Selected
- [ ] Template identified
- [ ] Requirements clear
- [ ] Validation ready
- [ ] Tests planned
```

---

## 🎬 STARTING YOUR SESSION

### Execute This Sequence:

```bash
# 1. Set context
cd /home/koans/projects/ubertruck
export PROJECT_VERSION="1.0.0-FROZEN"

# 2. Validate environment
./scripts/validate-context.sh

# 3. Load frozen requirements
cat docs/11-template-management/FROZEN_REQUIREMENTS_SUMMARY.md

# 4. Check for changes
git status

# 5. Select today's task
echo "Today's implementation task: [SELECT FROM PHASE PLAN]"

# 6. Load appropriate template
cat [SELECTED_TEMPLATE_PATH]

# 7. Begin implementation
echo "Starting implementation with frozen requirements..."
```

---

**END OF SESSION INITIALIZATION GUIDE**

**This guide ensures:**
- ✅ Quick context restoration in any new session
- ✅ Frozen requirements remain unchanged
- ✅ Guardrails prevent scope drift
- ✅ Templates guide every implementation
- ✅ 18-week timeline stays on track