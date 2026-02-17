# UBERTRUCK MVP - FROZEN REQUIREMENTS QUICK REFERENCE
## Version 1.0.0-FROZEN | NO MODIFICATIONS ALLOWED

---

## 🔒 IMMUTABLE BUSINESS RULES

```yaml
PRICING:
  Base Rate: ₹5/tonne/km (FIXED)
  GST: 18% (FIXED)
  Formula: (Weight × Distance × 5) × 1.18
  No Dynamic Pricing
  No Surge Pricing

FLEET:
  Capacities: [10T, 15T, 20T] ONLY
  No 25T, 30T, 35T, 40T (CR-2024-001 REJECTED)
  Manual Driver Assignment
  No Automated Allocation

BOOKING:
  Advance: Maximum 7 days
  Minimum: 1 hour before
  OTP: 6 digits, 5 minutes (NOT 4 digits)
  Cancellation: 2 hours before pickup

TRACKING:
  Status-Based Only (9 stages)
  NO Real-Time GPS
  NO Live Location
  Manual Status Updates by Driver

PAYMENT:
  Manual Process Only
  NO Payment Gateway
  NO Automated Settlement
  Invoice Generation Only
```

---

## 🔒 IMMUTABLE TECHNICAL SPECS

```yaml
ARCHITECTURE:
  Services: 6 Microservices
  Ports: 3001-3006
  No Additional Services

SERVICES:
  1. User Service (3001)
  2. Fleet Service (3002)
  3. Booking Service (3003)
  4. Route & Tracking Service (3004)
  5. Payment Service (3005)
  6. Admin Service (3006)

DATABASE:
  Primary: PostgreSQL 15
  Cache: Redis 7
  No Other Databases

TECHNOLOGY:
  Backend: Node.js 20 LTS
  Framework: Express + TypeScript
  Frontend: React 18
  No Technology Changes

PERFORMANCE:
  Response: <500ms P95
  Uptime: 99.5%
  Concurrent Users: 100+
```

---

## 🔒 PROJECT CONSTRAINTS

```yaml
SCOPE:
  Corridor: Nalgonda-Miryalguda (87km) ONLY
  No Other Routes
  No Multi-Corridor Support

TIMELINE:
  Total: 18 weeks (FIXED)
  No Extensions

BUDGET:
  Total: ₹10 lakhs (FIXED)
  No Additional Funding

COMPLIANCE:
  E-Way Bill: Required
  GST: Required
  DPDP Act: Required
  Vahan/Sarathi: Required
```

---

## ⚠️ FORBIDDEN FEATURES

**NEVER IMPLEMENT:**
- Dynamic/Surge Pricing
- Real-Time GPS Tracking
- Live Location Sharing
- Payment Gateway Integration
- Automated Payment Settlement
- Fleet Capacity > 20T
- 4-Digit OTP
- Booking > 7 Days Advance
- Multi-Corridor Support
- Additional Microservices

---

## ✅ REQUIRED FEATURES

**MUST IMPLEMENT:**
- Fixed Pricing (₹5/tonne/km)
- 6-Digit OTP Verification
- 9-Stage Status Tracking
- E-Way Bill Integration
- Manual Payment Process
- Driver Mobile App
- Customer Web Portal
- Admin Dashboard
- POD Upload (Max 2MB)
- SMS Notifications

---

## 📍 TEMPLATE LOCATIONS

```bash
/home/koans/projects/ubertruck/docs/
├── 01-vision-requirements/        # Business requirements
├── 02-srs/                       # Functional specifications
├── 03-system-design/              # Technical architecture
├── 10-critical-remediation/       # Gap fixes & clarifications
├── 11-template-management/        # Implementation guides
└── 12-change-requests/           # CR-2024-001 (REJECTED)
```

---

## 🚀 QUICK VALIDATION

```bash
# Before ANY code change, run:
grep -q "₹5/tonne/km" file.js && echo "✅" || echo "❌ PRICING VIOLATION"
grep -q "25T\|30T\|35T\|40T" file.js && echo "❌ FLEET VIOLATION" || echo "✅"
grep -q "4.*digit.*OTP" file.js && echo "❌ OTP VIOLATION" || echo "✅"
grep -qi "real.*time.*gps" file.js && echo "❌ GPS VIOLATION" || echo "✅"
```

---

**REMEMBER: These requirements are FROZEN. Any changes require formal change request and approval process.**

**Version: 1.0.0-FROZEN | Date: February 2024 | Status: IMMUTABLE**