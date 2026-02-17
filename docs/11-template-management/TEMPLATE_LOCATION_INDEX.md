# Ubertruck MVP - Template Location Index & Management System
## Version 1.0 | Date: February 2024

---

## 📍 TEMPLATE LOCATION MAP

### Master Implementation Templates
```yaml
Primary Location: /home/koans/projects/ubertruck/docs/

Core SDLC Documentation:
  Path: /docs/01-vision-requirements/
  - vision-requirements.md (599 lines)

  Path: /docs/02-srs/
  - software-requirements-specification.md (1,725 lines)

  Path: /docs/03-system-design/
  - system-design-document.md (1,228 lines)

  Path: /docs/04-project-plan/
  - project-plan.md

  Path: /docs/05-test-plan/
  - test-plan.md

  Path: /docs/06-deployment/
  - deployment-guide.md

  Path: /docs/07-maintenance/
  - maintenance-support-guide.md

Critical Remediation Templates:
  Path: /docs/10-critical-remediation/
  - api-reference-openapi.yaml (Complete API specs)
  - data-dictionary-complete-erd.md (30+ tables)
  - disaster-recovery-plan.md (RTO/RPO defined)
  - rbac-authorization-matrix.md (10 roles)
  - eway-bill-integration-workflow.md (GST compliance)
  - requirements-traceability-matrix-v2.md (92% coverage)
  - detailed-sprint-decomposition-plan.md (60-day breakdown)

Service Implementation Prompts:
  Path: /serverless-prompts/
  - 03-booking-service-prompt.md
  - 04-tracking-service-prompt.md
  - 05-payment-service-prompt.md
  - 06-notification-service-prompt.md

Enterprise Templates:
  Path: /serverless-prompts/enterprise/
  - 00-master-orchestration-prompt.md
  - 01-configuration-service-prompt-FIXED.md
  - 02-auth-service-prompt-FIXED.md
  - 03-booking-service-prompt.md
  - 04-api-gateway-prompt.md
  - 05-rest-api-standards-prompt.md
```

---

## 🔒 FROZEN REQUIREMENTS REFERENCE

### Core Business Rules (IMMUTABLE)
```yaml
Version: 1.0.0-FROZEN
Last Updated: February 2024
Change Control: NO MODIFICATIONS WITHOUT FORMAL APPROVAL

Business Constants:
  Pricing: ₹5/tonne/km (FIXED)
  GST: 18% (FIXED)
  Fleet: 10T, 15T, 20T ONLY
  Corridor: Nalgonda-Miryalguda (87km)
  Booking: Max 7 days advance
  OTP: 6 digits, 5 minutes validity
  POD: Max 2MB, JPEG/PNG only
  Status: 9 stages (CREATED → COMPLETED)

Technical Constants:
  Services: 6 microservices
  Ports: 3001-3006
  Database: PostgreSQL 15
  Cache: Redis 7
  Response: P95 <500ms
  Uptime: 99.5%
  Users: 100+ concurrent
```

---

## ✅ CONTEXT TRACKING RULES

### 1. Template Usage Protocol

```yaml
Before Using Any Template:
  1. Verify Version:
     - Check template version matches frozen requirements
     - Confirm no unauthorized modifications
     - Validate against master checklist

  2. Context Validation:
     - Restate project scope
     - Confirm frozen requirements
     - Check dependency versions

  3. Guardrail Check:
     - Verify all immutable rules
     - Confirm no scope drift
     - Check budget/timeline constraints
```

### 2. Template Compliance Checklist

```markdown
## Pre-Implementation Verification

### Business Rules Compliance
- [ ] Pricing formula: ₹5/tonne/km (no changes)
- [ ] GST calculation: 18% (no changes)
- [ ] Fleet types: Only 10T, 15T, 20T
- [ ] Booking window: Maximum 7 days
- [ ] OTP: 6 digits with 5-minute expiry
- [ ] Status flow: 9 stages in sequence

### Technical Compliance
- [ ] Service ports: 3001-3006
- [ ] Response time: <500ms (P95)
- [ ] Database: PostgreSQL 15 only
- [ ] Authentication: JWT with 1-hour expiry
- [ ] File limits: POD max 2MB
- [ ] API versioning: /v1 prefix

### Documentation Compliance
- [ ] Version number present
- [ ] Change history tracked
- [ ] Dependencies listed
- [ ] Test coverage defined
- [ ] Rollback plan included
```

---

## 🚨 GUARDRAIL ENFORCEMENT

### 1. Automated Validation Scripts

```bash
#!/bin/bash
# validate-template.sh - Ensures template compliance

# Function to check frozen requirements
check_frozen_requirements() {
  local template_file=$1

  # Check for version marker
  if ! grep -q "Version: 1.0.0-FROZEN" "$template_file"; then
    echo "ERROR: Missing frozen version marker"
    exit 1
  fi

  # Check for immutable rules
  local required_patterns=(
    "₹5/tonne/km"
    "18% GST"
    "10T, 15T, 20T"
    "6-digit.*5.*minute"
    "9.*stage"
  )

  for pattern in "${required_patterns[@]}"; do
    if ! grep -qE "$pattern" "$template_file"; then
      echo "ERROR: Missing required pattern: $pattern"
      exit 1
    fi
  done

  echo "✓ Template validation passed"
}

# Function to check for drift
check_scope_drift() {
  local template_file=$1

  # Forbidden patterns that indicate scope drift
  local forbidden_patterns=(
    "dynamic pricing"
    "surge pricing"
    "real-time GPS"
    "payment gateway"
    "automated settlement"
  )

  for pattern in "${forbidden_patterns[@]}"; do
    if grep -qi "$pattern" "$template_file"; then
      echo "ERROR: Scope drift detected: $pattern"
      exit 1
    fi
  done

  echo "✓ No scope drift detected"
}
```

### 2. Context Tracking Automation

```yaml
# context-tracker.yaml - Maintains context consistency

context_validation:
  triggers:
    - pre_commit
    - pre_merge
    - daily_audit

  checks:
    version_consistency:
      - All templates use same frozen version
      - No conflicting requirements
      - Dependencies aligned

    scope_alignment:
      - No features outside MVP scope
      - No technology changes
      - No architectural modifications

    requirement_traceability:
      - Every feature traces to requirement
      - Every API matches specification
      - Every test covers requirement
```

---

## 📊 TEMPLATE EFFICIENCY METRICS

### 1. Template Usage Analytics

```yaml
Efficiency Metrics:
  Reusability Score:
    - Code duplication: <10%
    - Template coverage: >90%
    - Component reuse: >80%

  Consistency Score:
    - Naming conventions: 100%
    - API patterns: 100%
    - Error handling: 100%

  Compliance Score:
    - Frozen requirements: 100%
    - Guardrail violations: 0
    - Scope drift incidents: 0
```

### 2. Template Performance Tracking

```yaml
Performance Indicators:
  Development Velocity:
    - Time to implement feature: -30% with templates
    - Bug rate: -40% with templates
    - Rework required: -50% with templates

  Quality Metrics:
    - Test coverage: >80%
    - Code review pass rate: >95%
    - Production incidents: <1%
```

---

## 🔄 CONTINUOUS VALIDATION LOOP

### 1. Daily Validation Routine

```yaml
Morning Check (9:00 AM):
  - Verify all templates unchanged
  - Check for unauthorized modifications
  - Validate against frozen requirements

Code Review Check (Per PR):
  - Template compliance verification
  - Context consistency check
  - Guardrail enforcement

Weekly Audit (Friday):
  - Full template inventory
  - Efficiency metrics review
  - Drift detection scan
```

### 2. Feedback Loop Implementation

```yaml
Issue Detection:
  Monitoring Points:
    - Git commit hooks
    - PR review checklist
    - Daily standup review
    - Weekly audit report

Issue Resolution:
  Priority Levels:
    P0: Frozen requirement violation
    P1: Template inconsistency
    P2: Efficiency degradation
    P3: Documentation gap

  Resolution Process:
    1. Detect violation
    2. Stop development
    3. Assess impact
    4. Correct template
    5. Update all instances
    6. Verify compliance
    7. Resume development
```

---

## 📝 TEMPLATE MAINTENANCE PROTOCOL

### 1. Version Control

```yaml
Version Management:
  Current: 1.0.0-FROZEN
  Changes: Not permitted without approval

  If Change Required:
    1. Document justification
    2. Impact analysis
    3. Stakeholder approval
    4. Version increment
    5. Update all templates
    6. Communicate change
    7. Retrain team
```

### 2. Template Synchronization

```bash
#!/bin/bash
# sync-templates.sh - Ensures all templates are synchronized

MASTER_VERSION="1.0.0-FROZEN"
TEMPLATE_DIRS=(
  "/docs/01-vision-requirements"
  "/docs/02-srs"
  "/docs/10-critical-remediation"
  "/serverless-prompts"
)

for dir in "${TEMPLATE_DIRS[@]}"; do
  for file in $(find "$dir" -name "*.md"); do
    # Check version consistency
    if ! grep -q "$MASTER_VERSION" "$file"; then
      echo "WARNING: $file has inconsistent version"
      # Auto-update version
      sed -i "s/Version: .*/Version: $MASTER_VERSION/g" "$file"
    fi
  done
done

echo "✓ All templates synchronized to $MASTER_VERSION"
```

---

## ⚡ EFFICIENCY OPTIMIZATION

### 1. Template Selection Guide

```yaml
Quick Reference:
  New Service: Use /serverless-prompts/enterprise/
  API Implementation: Use /docs/10-critical-remediation/api-reference-openapi.yaml
  Database Changes: Use /docs/10-critical-remediation/data-dictionary-complete-erd.md
  Testing: Use /docs/05-test-plan/
  Deployment: Use /docs/06-deployment/

Decision Tree:
  Is it a new microservice?
    Yes → enterprise/XX-service-prompt.md
    No → Continue

  Is it an API endpoint?
    Yes → api-reference-openapi.yaml
    No → Continue

  Is it a database operation?
    Yes → data-dictionary-complete-erd.md
    No → Continue

  Is it a business flow?
    Yes → software-requirements-specification.md
    No → Use system-design-document.md
```

### 2. Template Efficiency Checklist

```markdown
## Efficiency Verification

### Speed Optimizations
- [ ] No redundant validations
- [ ] Reusable components identified
- [ ] Common patterns extracted
- [ ] Boilerplate minimized
- [ ] Clear examples provided

### Quality Assurance
- [ ] Error handling standardized
- [ ] Testing patterns included
- [ ] Documentation automated
- [ ] Code review simplified
- [ ] Deployment streamlined

### Compliance Built-in
- [ ] Frozen requirements embedded
- [ ] Guardrails enforced
- [ ] Context tracked automatically
- [ ] Drift prevention active
- [ ] Audit trail maintained
```

---

## 🎯 IMPLEMENTATION GUARANTEE

### Success Criteria
```yaml
Template Adherence: 100%
Requirement Compliance: 100%
Scope Drift: 0%
Guardrail Violations: 0
Context Consistency: 100%

Delivery Targets:
  Timeline: 18 weeks (guaranteed)
  Budget: ₹10 lakhs (guaranteed)
  Quality: 95%+ success rate
  Uptime: 99.5% availability
  Scale: 100+ trucks ready
```

---

**END OF TEMPLATE LOCATION INDEX**

**This document ensures:**
- ✅ All templates are properly located and indexed
- ✅ Context tracking rules are enforced
- ✅ Guardrails prevent scope drift
- ✅ Efficiency is measured and optimized
- ✅ Frozen requirements are never violated