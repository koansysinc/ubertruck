# Ubertruck MVP - Critical Issues Resolution Action Plan
## Version 1.0 | Date: February 2024 | Priority: URGENT

---

## 🚨 EXECUTIVE SUMMARY

**Current Status:** NOT PRODUCTION READY
**Target Status:** Production Ready
**Timeline:** 3-4 weeks (21-28 days)
**Total Issues:** 18 (6 Critical, 7 High, 4 Medium, 1 Low)

---

## 📅 WEEK 1: CRITICAL BLOCKERS (Days 1-7)

### Day 1-2: Security & Template Issues

#### Task 1.1: Fix Authentication Template Issues
**Owner:** Backend Lead | **Duration:** 4 hours | **Priority:** P0

```bash
# Step 1: Archive problematic template
cd /home/koans/projects/ubertruck/serverless-prompts/enterprise/
mv 02-auth-service-prompt.md archive/02-auth-service-prompt.DEPRECATED

# Step 2: Update all references to use FIXED version
grep -r "02-auth-service-prompt.md" . --exclude-dir=archive | \
  xargs sed -i 's/02-auth-service-prompt.md/02-auth-service-prompt-FIXED.md/g'

# Step 3: Add pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Check for hardcoded values
if git diff --cached --name-only | xargs grep -E "token.*=.*[0-9]+(minute|hour|day)" 2>/dev/null; then
  echo "ERROR: Hardcoded token expiry detected. Use configuration service."
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

**Verification Checklist:**
- [ ] Original template archived
- [ ] All references updated
- [ ] Pre-commit hook installed
- [ ] CI/CD pipeline updated
- [ ] Team notified

#### Task 1.2: Fix Configuration Service Cache TTLs
**Owner:** Backend Lead | **Duration:** 6 hours | **Priority:** P0

```yaml
# config/cache-settings.yaml
cache:
  lambda:
    ttl_seconds: ${LAMBDA_CACHE_TTL:-300}  # 5 minutes default
  elasticache:
    ttl_seconds: ${ELASTICACHE_TTL:-1800}  # 30 minutes default

compliance:
  retention_years: ${RETENTION_YEARS:-7}  # 7 years default
```

**Implementation Steps:**
1. Create configuration file
2. Update template to reference config
3. Test across environments (dev/staging/prod)
4. Document configuration options

---

### Day 2-3: Change Request Resolution

#### Task 1.3: Resolve CR-2024-001 Status
**Owner:** Product Owner | **Duration:** 2 hours | **Priority:** P0

**Decision Meeting Agenda:**
```markdown
## CR-2024-001 Decision Meeting
Date: [IMMEDIATE]
Attendees: Product Owner, Tech Lead, Security Lead, QA Lead

### Agenda Items:
1. Review fleet expansion request (25T-40T)
   - Impact on timeline
   - Cost implications
   - Technical complexity

2. Review OTP reduction request (6→4 digits)
   - Security risk assessment
   - Mitigation requirements
   - User experience impact

### Required Decisions:
- [ ] APPROVE / REJECT fleet expansion
- [ ] APPROVE / REJECT OTP change
- [ ] Document decision rationale
- [ ] Update frozen requirements
```

**Post-Meeting Actions:**
```bash
# Update CR document with decision
cd /home/koans/projects/ubertruck/docs/12-change-requests/
cp CR-2024-001-FLEET-OTP-CHANGES.md CR-2024-001-FLEET-OTP-CHANGES.DECIDED.md

# Add decision stamp
cat >> CR-2024-001-FLEET-OTP-CHANGES.DECIDED.md << 'EOF'

## FINAL DECISION
Date: February 11, 2024
Decision: ☑️ REJECTED - Maintain frozen requirements

Approvals:
☑️ Product Owner: [Name] - Approved rejection
☑️ Technical Lead: [Name] - Approved rejection
☑️ Security Lead: [Name] - Approved rejection
☑️ QA Lead: [Name] - Approved rejection

Rationale: MVP timeline and security requirements take precedence
EOF
```

---

### Day 3-4: Test Failures Resolution

#### Task 1.4: Fix Duplicate Registration Test (TC-USR-003)
**Owner:** QA Lead | **Duration:** 8 hours | **Priority:** P0

**Root Cause Analysis:**
```javascript
// PROBLEM: Race condition in duplicate check
// Current implementation (BROKEN):
async function registerUser(phoneNumber) {
  const exists = await db.query('SELECT id FROM users WHERE phone = ?', [phoneNumber]);
  if (exists.length > 0) {
    throw new Error('User already exists');
  }
  // RACE CONDITION: Another request can insert here
  await db.query('INSERT INTO users (phone) VALUES (?)', [phoneNumber]);
}

// FIXED implementation:
async function registerUser(phoneNumber) {
  try {
    // Use database constraint for atomicity
    await db.query('INSERT INTO users (phone) VALUES (?)', [phoneNumber]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('User already exists');
    }
    throw error;
  }
}

// Database fix:
ALTER TABLE users ADD UNIQUE INDEX idx_phone (phone);
```

**Test Update:**
```javascript
describe('TC-USR-003: Duplicate Registration Prevention', () => {
  it('should prevent duplicate phone registration', async () => {
    const phone = '+919876543210';

    // First registration
    await registerUser(phone);

    // Parallel duplicate attempts
    const attempts = Array(10).fill(null).map(() =>
      registerUser(phone).catch(e => e.message)
    );

    const results = await Promise.all(attempts);

    // All should fail with same error
    expect(results.every(r => r === 'User already exists')).toBe(true);
  });
});
```

#### Task 1.5: Fix Concurrent Booking Test (TC-BKG-005)
**Owner:** Backend Lead | **Duration:** 8 hours | **Priority:** P0

**Solution: Implement Optimistic Locking**
```javascript
// Add version column to bookings table
ALTER TABLE bookings ADD COLUMN version INT DEFAULT 1;

// Implement optimistic locking
async function createBooking(truckId, userId, date) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Lock the truck row for update
    const [truck] = await connection.query(
      'SELECT * FROM trucks WHERE id = ? FOR UPDATE',
      [truckId]
    );

    if (!truck.available) {
      throw new Error('Truck not available');
    }

    // Check for existing bookings
    const [existing] = await connection.query(
      'SELECT id FROM bookings WHERE truck_id = ? AND date = ? AND status != "CANCELLED"',
      [truckId, date]
    );

    if (existing.length > 0) {
      throw new Error('Truck already booked for this date');
    }

    // Create booking
    await connection.query(
      'INSERT INTO bookings (truck_id, user_id, date, version) VALUES (?, ?, ?, 1)',
      [truckId, userId, date]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

### Day 5-7: RBAC Implementation

#### Task 1.6: Complete RBAC System
**Owner:** Security Lead | **Duration:** 3 days | **Priority:** P0

**Implementation Plan:**
```yaml
RBAC Structure:
  Roles:
    - SUPER_ADMIN: All permissions
    - ADMIN: Manage bookings, users, reports
    - FLEET_OWNER: Manage own trucks, view bookings
    - DRIVER: Update status, upload POD
    - CUSTOMER: Create bookings, track shipments
    - SUPPORT: View all, modify limited
    - FINANCE: View payments, generate invoices
    - COMPLIANCE: View reports, audit logs
    - API_USER: Programmatic access
    - GUEST: View only public info

  Permissions Matrix:
    bookings:
      create: [CUSTOMER, ADMIN, SUPER_ADMIN]
      read: [ALL_AUTHENTICATED]
      update: [ADMIN, SUPER_ADMIN, OWNER]
      delete: [SUPER_ADMIN]

    trucks:
      create: [FLEET_OWNER, ADMIN, SUPER_ADMIN]
      read: [ALL]
      update: [FLEET_OWNER, ADMIN, SUPER_ADMIN, OWNER]
      delete: [SUPER_ADMIN]

    payments:
      create: [SYSTEM]
      read: [FINANCE, ADMIN, SUPER_ADMIN, OWNER]
      update: [FINANCE, SUPER_ADMIN]
      delete: [NONE]
```

**Code Implementation:**
```javascript
// middleware/rbac.js
const permissions = require('./permissions.json');

function authorize(resource, action) {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const allowed = permissions[resource]?.[action]?.includes(userRole);

    if (!allowed) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Role ${userRole} cannot ${action} ${resource}`
      });
    }

    // Check row-level security if owner
    if (action === 'update' || action === 'delete') {
      const resourceId = req.params.id;
      const isOwner = await checkOwnership(req.user.id, resource, resourceId);

      if (!isOwner && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'You do not own this resource'
        });
      }
    }

    next();
  };
}

// Usage in routes
router.post('/bookings',
  authenticate,
  authorize('bookings', 'create'),
  createBooking
);

router.put('/bookings/:id',
  authenticate,
  authorize('bookings', 'update'),
  updateBooking
);
```

---

## 📅 WEEK 2: HIGH PRIORITY FIXES (Days 8-14)

### Day 8-10: Compliance Service Completion

#### Task 2.1: E-Way Bill Integration
**Owner:** Backend Lead | **Duration:** 2 days | **Priority:** P1

**Integration Steps:**
```javascript
// services/eway-bill.service.js
class EWayBillService {
  constructor() {
    this.apiUrl = process.env.EWAY_BILL_API_URL;
    this.gstin = process.env.COMPANY_GSTIN;
  }

  async generateEWayBill(booking) {
    const payload = {
      supplyType: 'O',  // Outward
      subSupplyType: '1', // Supply
      docType: 'INV',    // Invoice
      docNo: booking.invoiceNumber,
      docDate: formatDate(booking.createdAt),

      fromGstin: this.gstin,
      fromTrdName: 'Ubertruck Logistics',
      fromAddr1: 'Nalgonda',
      fromPlace: 'Nalgonda',
      fromPincode: 508001,
      fromStateCode: 36, // Telangana

      toGstin: booking.customer.gstin || 'URP', // Unregistered person
      toTrdName: booking.customer.name,
      toAddr1: booking.delivery.address,
      toPlace: 'Miryalguda',
      toPincode: 508207,
      toStateCode: 36,

      totalValue: booking.amount,
      cgstValue: booking.cgst,
      sgstValue: booking.sgst,
      igstValue: 0,
      cessValue: 0,

      transporterId: booking.truck.transporterGstin,
      transporterName: booking.truck.transporterName,
      transMode: '1', // Road
      vehicleType: 'R',  // Regular
      vehicleNo: booking.truck.registrationNumber,

      itemList: [{
        productName: 'Freight Services',
        productDesc: 'Transportation Services',
        hsnCode: 996511,  // GTA services
        quantity: booking.weight,
        qtyUnit: 'TON',
        taxableAmount: booking.taxableAmount
      }]
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        ewayBillNo: response.data.ewayBillNo,
        ewayBillDate: response.data.ewayBillDate,
        validUpto: response.data.validUpto
      };
    } catch (error) {
      logger.error('E-Way Bill generation failed:', error);
      throw new Error('E-Way Bill generation failed');
    }
  }

  async updatePartB(ewayBillNo, vehicleNo) {
    const payload = {
      ewayBillNo,
      vehicleNo,
      fromPlace: 'Nalgonda',
      fromState: 36,
      reasonCode: '1',
      reasonRemark: 'Vehicle assigned',
      transMode: '1',
      vehicleType: 'R'
    };

    const response = await axios.post(
      `${this.apiUrl}/update-partb`,
      payload,
      { headers: this.getHeaders() }
    );

    return response.data;
  }
}
```

#### Task 2.2: Vahan API Integration
**Owner:** Backend Lead | **Duration:** 1 day | **Priority:** P1

```javascript
// services/vahan.service.js
class VahanService {
  async verifyVehicle(registrationNumber) {
    const response = await axios.get(
      `${VAHAN_API_URL}/vehicle/${registrationNumber}`,
      { headers: this.getHeaders() }
    );

    return {
      valid: response.data.status === 'ACTIVE',
      ownerName: response.data.ownerName,
      fitnessValid: new Date(response.data.fitnessUpto) > new Date(),
      insuranceValid: new Date(response.data.insuranceUpto) > new Date(),
      permitValid: new Date(response.data.permitUpto) > new Date(),
      capacity: response.data.gvw, // Gross Vehicle Weight
      vehicleClass: response.data.vehicleClass
    };
  }
}
```

#### Task 2.3: Sarathi API Integration
**Owner:** Backend Lead | **Duration:** 1 day | **Priority:** P1

```javascript
// services/sarathi.service.js
class SarathiService {
  async verifyDriver(licenseNumber) {
    const response = await axios.get(
      `${SARATHI_API_URL}/license/${licenseNumber}`,
      { headers: this.getHeaders() }
    );

    return {
      valid: response.data.status === 'ACTIVE',
      name: response.data.holderName,
      validUpto: response.data.validityUpto,
      vehicleClass: response.data.cov, // Class of vehicles
      canDriveHeavy: response.data.cov.includes('HMV'), // Heavy Motor Vehicle
      hasHazmat: response.data.hazmat || false
    };
  }
}
```

---

### Day 11-12: Admin Service Completion

#### Task 2.4: Implement Reporting Dashboard
**Owner:** Frontend Lead | **Duration:** 2 days | **Priority:** P1

```javascript
// admin/reports.controller.js
class ReportsController {
  async getDashboard(req, res) {
    const { startDate, endDate } = req.query;

    const metrics = await Promise.all([
      this.getBookingMetrics(startDate, endDate),
      this.getRevenueMetrics(startDate, endDate),
      this.getFleetUtilization(startDate, endDate),
      this.getCustomerMetrics(startDate, endDate),
      this.getOperationalMetrics(startDate, endDate)
    ]);

    res.json({
      period: { startDate, endDate },
      bookings: metrics[0],
      revenue: metrics[1],
      fleet: metrics[2],
      customers: metrics[3],
      operations: metrics[4]
    });
  }

  async getBookingMetrics(startDate, endDate) {
    const sql = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status IN ('CREATED','ASSIGNED','IN_TRANSIT') THEN 1 END) as active,
        AVG(TIMESTAMPDIFF(HOUR, created_at, delivered_at)) as avg_delivery_hours,
        AVG(total_amount) as avg_booking_value
      FROM bookings
      WHERE created_at BETWEEN ? AND ?
    `;

    const [results] = await db.query(sql, [startDate, endDate]);
    return results[0];
  }

  async generatePDFReport(req, res) {
    const data = await this.getDashboard(req, res);
    const pdf = await generatePDF('monthly-report', data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.send(pdf);
  }
}
```

#### Task 2.5: Implement Bulk Operations
**Owner:** Backend Lead | **Duration:** 1 day | **Priority:** P1

```javascript
// admin/bulk-operations.js
class BulkOperations {
  async bulkUpdateBookingStatus(bookingIds, newStatus, reason) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Validate status transition for each booking
      const bookings = await connection.query(
        'SELECT id, status FROM bookings WHERE id IN (?)',
        [bookingIds]
      );

      const invalidTransitions = bookings.filter(b =>
        !this.isValidTransition(b.status, newStatus)
      );

      if (invalidTransitions.length > 0) {
        throw new Error(`Invalid transitions: ${JSON.stringify(invalidTransitions)}`);
      }

      // Update all bookings
      await connection.query(
        `UPDATE bookings
         SET status = ?,
             updated_at = NOW(),
             update_reason = ?
         WHERE id IN (?)`,
        [newStatus, reason, bookingIds]
      );

      // Create audit log
      await connection.query(
        `INSERT INTO audit_logs (entity_type, entity_ids, action, reason, user_id)
         VALUES ('booking', ?, 'bulk_status_update', ?, ?)`,
        [JSON.stringify(bookingIds), reason, req.user.id]
      );

      await connection.commit();
      return { success: true, updated: bookingIds.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async bulkAssignDriver(bookingIds, driverId) {
    // Similar implementation
  }

  async bulkGenerateInvoices(bookingIds) {
    // Generate invoices for multiple bookings
  }
}
```

---

### Day 13-14: Disaster Recovery Testing

#### Task 2.6: Execute DR Drill
**Owner:** DevOps Lead | **Duration:** 2 days | **Priority:** P1

**DR Test Plan:**
```yaml
Test ID: TC-DR-001
Objective: Validate 1-hour RTO and data integrity

Pre-Test Setup:
  1. Create test data:
     - 100 bookings in various states
     - 50 active users
     - 25 trucks with assignments

  2. Document current state:
     - Database row counts
     - Redis cache keys
     - Application versions

Disaster Simulation:
  Step 1: Backup current production
    - pg_dump ubertruck_prod > backup_$(date +%s).sql
    - redis-cli BGSAVE

  Step 2: Simulate failure (3:00 PM)
    - Stop all services
    - Corrupt primary database

Recovery Process:
  Step 3: Initiate recovery (3:05 PM)
    - Provision new infrastructure
    - Restore from backup
    - Reconfigure services

  Step 4: Validate recovery (3:45 PM)
    - Check data integrity
    - Verify all services online
    - Test critical flows

  Step 5: Measure RTO (4:00 PM)
    - Target: < 1 hour
    - Actual: [RECORD]

Post-Test Validation:
  - Compare row counts
  - Verify no data loss
  - Check transaction consistency
  - Confirm user sessions
```

**Automated DR Script:**
```bash
#!/bin/bash
# dr-test.sh

echo "=== Starting DR Test ==="
START_TIME=$(date +%s)

# Step 1: Backup current state
echo "Creating backups..."
pg_dump ubertruck_prod > /backups/dr_test_$(date +%Y%m%d_%H%M%S).sql
redis-cli BGSAVE

# Step 2: Simulate failure
echo "Simulating disaster..."
docker-compose stop
mv /var/lib/postgresql/data /var/lib/postgresql/data.corrupted

# Step 3: Recovery
echo "Starting recovery..."
./scripts/provision-infrastructure.sh
./scripts/restore-from-backup.sh
./scripts/start-services.sh

# Step 4: Validation
echo "Validating recovery..."
./scripts/validate-dr-recovery.sh

# Step 5: Calculate RTO
END_TIME=$(date +%s)
RTO=$((END_TIME - START_TIME))
echo "Recovery Time: $((RTO / 60)) minutes"

if [ $RTO -lt 3600 ]; then
  echo "✅ DR Test PASSED - RTO under 1 hour"
else
  echo "❌ DR Test FAILED - RTO exceeded 1 hour"
fi
```

---

## 📅 WEEK 3: COMPLETION & OPTIMIZATION (Days 15-21)

### Day 15-16: Payment Service Completion

#### Task 3.1: GST Returns Export
**Owner:** Backend Lead | **Duration:** 1 day | **Priority:** P2

```javascript
// services/gst-returns.service.js
class GSTReturnsService {
  async generateGSTR1(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await db.query(`
      SELECT
        i.invoice_number,
        i.invoice_date,
        c.gstin,
        c.name as customer_name,
        i.taxable_amount,
        i.cgst_amount,
        i.sgst_amount,
        i.total_amount,
        i.hsn_code
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.invoice_date BETWEEN ? AND ?
      AND i.status = 'PAID'
    `, [startDate, endDate]);

    // Format for GSTR-1
    const gstr1Data = {
      gstin: process.env.COMPANY_GSTIN,
      fp: `${month.toString().padStart(2, '0')}${year}`,
      b2b: invoices.filter(i => i.gstin).map(i => ({
        ctin: i.gstin,
        inv: [{
          inum: i.invoice_number,
          idt: formatDate(i.invoice_date),
          val: i.total_amount,
          pos: '36', // Telangana
          rchrg: 'N',
          inv_typ: 'R',
          itms: [{
            num: 1,
            itm_det: {
              txval: i.taxable_amount,
              rt: 18,
              camt: i.cgst_amount,
              samt: i.sgst_amount
            }
          }]
        }]
      })),
      b2c: invoices.filter(i => !i.gstin).map(i => ({
        // B2C format
      }))
    };

    return gstr1Data;
  }

  async exportToExcel(month, year) {
    const data = await this.generateGSTR1(month, year);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GSTR-1');

    // Add headers and data
    worksheet.columns = [
      { header: 'Invoice No', key: 'invoice_number' },
      { header: 'Date', key: 'invoice_date' },
      { header: 'GSTIN', key: 'gstin' },
      { header: 'Customer', key: 'customer_name' },
      { header: 'Taxable', key: 'taxable_amount' },
      { header: 'CGST', key: 'cgst_amount' },
      { header: 'SGST', key: 'sgst_amount' },
      { header: 'Total', key: 'total_amount' }
    ];

    worksheet.addRows(data.b2b);

    return workbook.xlsx.writeBuffer();
  }
}
```

#### Task 3.2: Settlement Automation
**Owner:** Backend Lead | **Duration:** 2 days | **Priority:** P2

```javascript
// services/settlement.service.js
class SettlementService {
  async processSettlements() {
    const pendingSettlements = await this.getPendingSettlements();

    for (const settlement of pendingSettlements) {
      try {
        // Step 1: Verify bank account
        const isValid = await this.verifyBankAccount(settlement.bankAccount);
        if (!isValid) {
          await this.markSettlementFailed(settlement.id, 'Invalid bank account');
          continue;
        }

        // Step 2: Calculate settlement amount
        const amount = await this.calculateSettlement(settlement);

        // Step 3: Initiate transfer (manual for MVP)
        const transferRequest = await this.createTransferRequest({
          settlementId: settlement.id,
          amount: amount.net,
          bankAccount: settlement.bankAccount,
          utr: null, // Will be updated manually
          status: 'PENDING_TRANSFER'
        });

        // Step 4: Send notification for manual processing
        await this.notifyFinanceTeam(transferRequest);

        // Step 5: Schedule reconciliation check
        await this.scheduleReconciliation(transferRequest.id, 24); // Check after 24 hours

      } catch (error) {
        logger.error(`Settlement ${settlement.id} failed:`, error);
        await this.markSettlementFailed(settlement.id, error.message);
      }
    }
  }

  async reconcileTransfers() {
    const pendingTransfers = await this.getPendingTransfers();

    for (const transfer of pendingTransfers) {
      // Check if UTR has been updated manually
      if (transfer.utr) {
        // Verify with bank statement (manual upload)
        const verified = await this.verifyUTR(transfer.utr);

        if (verified) {
          await this.markTransferComplete(transfer.id);
          await this.updateSettlement(transfer.settlementId, 'COMPLETED');
        }
      }
    }
  }

  async verifyBankAccount(account) {
    // Implement penny drop verification
    try {
      const response = await axios.post(`${BANK_VERIFICATION_API}/verify`, {
        accountNumber: account.number,
        ifsc: account.ifsc,
        name: account.holderName
      });

      return response.data.valid && response.data.nameMatch > 0.8;
    } catch (error) {
      logger.error('Bank verification failed:', error);
      return false;
    }
  }
}
```

---

### Day 17-18: DPDP Compliance

#### Task 3.3: Complete DPDP Implementation
**Owner:** Security Lead | **Duration:** 2 days | **Priority:** P2

```javascript
// services/dpdp-compliance.service.js
class DPDPComplianceService {
  // FR-022.1: Consent Management
  async recordConsent(userId, purpose, details) {
    const consent = await db.query(
      `INSERT INTO user_consents
       (user_id, purpose, details, granted_at, expires_at, ip_address)
       VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), ?)`,
      [userId, purpose, JSON.stringify(details), req.ip]
    );

    return consent.insertId;
  }

  async withdrawConsent(userId, consentId) {
    await db.query(
      `UPDATE user_consents
       SET withdrawn_at = NOW(), active = FALSE
       WHERE id = ? AND user_id = ?`,
      [consentId, userId]
    );

    // Trigger data deletion if required
    await this.processDataDeletion(userId, consentId);
  }

  // FR-022.2: Data Retention
  async enforceRetentionPolicy() {
    // Delete data older than retention period
    const retentionDays = 2555; // 7 years for financial data

    await db.query(`
      DELETE FROM user_activity_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND type NOT IN ('financial', 'compliance')
    `, [retentionDays]);

    // Archive old financial records
    await this.archiveOldRecords(retentionDays);
  }

  // FR-022.3: Right to Deletion
  async processDeleteRequest(userId) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user has active bookings
      const [activeBookings] = await connection.query(
        `SELECT COUNT(*) as count FROM bookings
         WHERE user_id = ? AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [userId]
      );

      if (activeBookings[0].count > 0) {
        throw new Error('Cannot delete: Active bookings exist');
      }

      // Anonymize personal data
      await connection.query(
        `UPDATE users
         SET name = 'DELETED_USER',
             phone = CONCAT('DELETED_', id),
             email = CONCAT('deleted_', id, '@deleted.com'),
             address = 'DELETED',
             deleted_at = NOW()
         WHERE id = ?`,
        [userId]
      );

      // Delete non-essential data
      await connection.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM user_devices WHERE user_id = ?', [userId]);

      // Keep financial records (anonymized) for legal compliance
      await connection.query(
        `UPDATE bookings SET user_name = 'DELETED_USER' WHERE user_id = ?`,
        [userId]
      );

      await connection.commit();

      // Send confirmation
      await this.sendDeletionConfirmation(userId);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Generate DPDP compliance report
  async generateComplianceReport() {
    const report = {
      generated_at: new Date(),
      consent_records: await this.getConsentStats(),
      deletion_requests: await this.getDeletionStats(),
      retention_compliance: await this.getRetentionStats(),
      data_breaches: await this.getBreachStats(),
      cross_border_transfers: 0, // Not applicable for MVP
      third_party_sharing: await this.getThirdPartyStats()
    };

    return report;
  }
}
```

---

### Day 19-20: Performance Optimization

#### Task 3.4: Improve NFR Metrics
**Owner:** DevOps Lead | **Duration:** 2 days | **Priority:** P2

**Uptime Improvement (99.2% → 99.5%):**
```yaml
# kubernetes/ha-config.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubertruck-api
spec:
  replicas: 3  # Increase from 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime deployment
  template:
    spec:
      containers:
      - name: api
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Backup RPO Improvement (30 min → 15 min):**
```bash
# cron configuration for 15-minute backups
*/15 * * * * /usr/local/bin/backup-database.sh

# backup-database.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"

# Use pg_basebackup for faster backups
pg_basebackup -D $BACKUP_DIR/backup_$TIMESTAMP -Ft -z -P -U postgres

# Upload to S3 (async)
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.tar.gz \
  s3://ubertruck-backups/postgres/$TIMESTAMP.tar.gz \
  --storage-class GLACIER_IR &

# Clean old local backups (keep last 24 hours)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +1 -delete
```

**Mobile Responsiveness (95% → 100%):**
```css
/* Fix remaining mobile issues */
@media (max-width: 768px) {
  /* Fix table overflow */
  .data-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  /* Fix button spacing */
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .button-group button {
    width: 100%;
  }

  /* Fix form layout */
  .form-row {
    flex-direction: column;
  }

  .form-control {
    width: 100%;
    margin-bottom: 15px;
  }

  /* Fix navigation */
  .navbar-collapse {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background: white;
    z-index: 1000;
  }
}

/* Viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

---

### Day 21: Final Validation

#### Task 3.5: Complete Test Suite & Final Checks
**Owner:** QA Lead | **Duration:** 1 day | **Priority:** P1

**Final Validation Checklist:**
```markdown
## Production Readiness Checklist

### Critical Components
- [ ] Auth Service: 100% complete, all tests passing
- [ ] Fleet Service: 100% complete, all tests passing
- [ ] Booking Service: 100% complete, all tests passing
- [ ] Route Service: 100% complete, all tests passing
- [ ] Payment Service: 100% complete, all tests passing
- [ ] Admin Service: 100% complete, all tests passing
- [ ] Compliance Service: 100% complete, all tests passing

### Test Coverage
- [ ] Unit Tests: >80% coverage
- [ ] Integration Tests: >70% coverage
- [ ] E2E Tests: All critical paths covered
- [ ] TC-USR-003: ✅ PASS (100%)
- [ ] TC-BKG-005: ✅ PASS (100%)
- [ ] TC-DR-001: ✅ PASS (RTO < 1 hour)

### NFR Compliance
- [ ] Uptime: 99.5% achieved
- [ ] Response Time: P95 < 500ms
- [ ] Backup RPO: 15 minutes
- [ ] Mobile Responsive: 100%
- [ ] DPDP Compliance: 100%

### Security
- [ ] RBAC: Fully implemented
- [ ] Authentication: No hardcoded values
- [ ] Encryption: All sensitive data encrypted
- [ ] Audit Logs: Comprehensive logging
- [ ] Penetration Test: Passed

### Documentation
- [ ] API Documentation: Complete
- [ ] Deployment Guide: Updated
- [ ] Runbook: Created
- [ ] Disaster Recovery: Documented
- [ ] Change Log: Current
```

**Automated Validation Script:**
```bash
#!/bin/bash
# production-readiness.sh

echo "=== Production Readiness Validation ==="

# Run all tests
npm test -- --coverage

# Check test results
if [ $? -ne 0 ]; then
  echo "❌ Tests failed - NOT READY"
  exit 1
fi

# Check coverage
COVERAGE=$(npm test -- --coverage --json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ Coverage below 80% - NOT READY"
  exit 1
fi

# Check NFRs
./scripts/check-nfr-compliance.sh

# Security scan
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ Security vulnerabilities found - NOT READY"
  exit 1
fi

# Check for hardcoded values
grep -r "token.*=.*[0-9]" src/ && echo "❌ Hardcoded values found" && exit 1

# Validate RBAC
./scripts/test-rbac.sh

# Check documentation
[ ! -f "docs/api/openapi.yaml" ] && echo "❌ API docs missing" && exit 1
[ ! -f "docs/deployment/guide.md" ] && echo "❌ Deployment guide missing" && exit 1
[ ! -f "docs/dr/plan.md" ] && echo "❌ DR plan missing" && exit 1

echo "✅ ALL VALIDATIONS PASSED - READY FOR PRODUCTION"
```

---

## 📊 WEEK 4: FINAL WEEK BUFFER (Days 22-28)

### Day 22-24: Integration Testing

#### Task 4.1: End-to-End Test Execution
**Owner:** QA Team | **Duration:** 3 days | **Priority:** P1

**E2E Test Scenarios:**
```javascript
// e2e/complete-flow.test.js
describe('Complete Booking Flow E2E', () => {
  test('Customer books truck and completes delivery', async () => {
    // 1. Customer registration
    const customer = await registerCustomer({
      name: 'Test Customer',
      phone: '+919876543210',
      gstin: '36AAACR5055K1Z5'
    });

    // 2. OTP verification
    const otp = await getOTPFromTestDB(customer.phone);
    await verifyOTP(customer.phone, otp);

    // 3. Search available trucks
    const trucks = await searchTrucks({
      date: '2024-02-15',
      capacity: 15,
      route: 'Nalgonda-Miryalguda'
    });

    expect(trucks.length).toBeGreaterThan(0);

    // 4. Create booking
    const booking = await createBooking({
      customerId: customer.id,
      truckId: trucks[0].id,
      pickupDate: '2024-02-15',
      weight: 12,
      commodity: 'Industrial Goods'
    });

    expect(booking.status).toBe('CREATED');
    expect(booking.amount).toBe(5220); // 12T * 87km * 5 = 5220
    expect(booking.totalWithGST).toBe(6159.60); // 5220 * 1.18

    // 5. Admin assigns driver
    const driver = await assignDriver(booking.id, 'DRIVER_001');
    expect(booking.status).toBe('ASSIGNED');

    // 6. Driver accepts
    await driverAccept(booking.id, driver.id);
    expect(booking.status).toBe('CONFIRMED');

    // 7. Generate E-Way Bill
    const ewayBill = await generateEWayBill(booking.id);
    expect(ewayBill.ewayBillNo).toMatch(/^[0-9]{12}$/);

    // 8. Driver updates status through journey
    await updateBookingStatus(booking.id, 'EN_ROUTE');
    await updateBookingStatus(booking.id, 'LOADING');
    await updateBookingStatus(booking.id, 'IN_TRANSIT');
    await updateBookingStatus(booking.id, 'UNLOADING');

    // 9. Upload POD
    const pod = await uploadPOD(booking.id, 'pod.jpg');
    expect(pod.size).toBeLessThan(2097152); // 2MB

    // 10. Complete delivery
    await completeDelivery(booking.id);
    expect(booking.status).toBe('DELIVERED');

    // 11. Generate invoice
    const invoice = await generateInvoice(booking.id);
    expect(invoice).toHaveProperty('invoiceNumber');
    expect(invoice).toHaveProperty('gst');

    // 12. Process payment (manual)
    await markPaymentReceived(booking.id, {
      utr: 'TEST123456',
      amount: 6159.60,
      date: '2024-02-16'
    });

    expect(booking.status).toBe('COMPLETED');
  });
});
```

---

### Day 25-26: Performance Testing

#### Task 4.2: Load Testing & Optimization
**Owner:** DevOps Lead | **Duration:** 2 days | **Priority:** P2

**Load Test Configuration:**
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 }, // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 200 }, // Spike to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
  },
};

export default function() {
  // Test booking creation
  let bookingPayload = {
    pickupDate: '2024-02-20',
    weight: Math.floor(Math.random() * 20) + 1,
    truckType: [10, 15, 20][Math.floor(Math.random() * 3)],
  };

  let response = http.post(
    'https://api.ubertruck.com/v1/bookings',
    JSON.stringify(bookingPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

### Day 27-28: Production Deployment Preparation

#### Task 4.3: Final Deployment Checklist
**Owner:** Tech Lead | **Duration:** 2 days | **Priority:** P1

**Production Deployment Plan:**
```yaml
Deployment Checklist:
  Pre-Deployment:
    - [ ] All tests passing (100%)
    - [ ] Security scan clean
    - [ ] Database migrations ready
    - [ ] Backup taken
    - [ ] Rollback plan documented
    - [ ] Team notified

  Environment Setup:
    - [ ] SSL certificates installed
    - [ ] Domain configured
    - [ ] CDN setup
    - [ ] Monitoring configured
    - [ ] Alerts configured
    - [ ] Log aggregation working

  Configuration:
    - [ ] Environment variables set
    - [ ] Secrets in vault
    - [ ] Rate limits configured
    - [ ] CORS settings verified
    - [ ] Database connections pooled

  Deployment:
    - [ ] Blue-green deployment ready
    - [ ] Health checks passing
    - [ ] Smoke tests automated
    - [ ] Traffic gradually shifted
    - [ ] Metrics monitored

  Post-Deployment:
    - [ ] Smoke tests passed
    - [ ] Performance validated
    - [ ] No error spike
    - [ ] Users notified
    - [ ] Documentation updated
```

---

## 📈 SUCCESS METRICS & MONITORING

### KPI Dashboard Configuration

```yaml
Key Metrics to Monitor:
  System Health:
    - Uptime: Target 99.5%, Alert < 99.3%
    - Response Time: Target < 500ms P95, Alert > 600ms
    - Error Rate: Target < 1%, Alert > 2%
    - Database Connections: Target < 80%, Alert > 90%

  Business Metrics:
    - Daily Bookings: Track trend
    - Completion Rate: Target > 95%
    - Customer Registrations: Track growth
    - Revenue: Track daily/weekly/monthly

  Operational Metrics:
    - Failed Payments: Alert > 5%
    - POD Upload Rate: Target 100%
    - E-Way Bill Success: Target > 99%
    - Settlement Delays: Alert > 24 hours

  Security Metrics:
    - Failed Logins: Alert > 10/minute
    - API Rate Limit Hits: Monitor trends
    - Unauthorized Access: Alert immediately
    - Data Export Requests: Audit all
```

---

## ✅ FINAL SIGN-OFF CHECKLIST

### Technical Sign-off

```markdown
## Technical Readiness Certification

I, [Tech Lead Name], certify that:

- [ ] All critical issues resolved
- [ ] Test coverage exceeds 80%
- [ ] No P0/P1 bugs remaining
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Documentation complete

Signature: _________________ Date: _________________
```

### Business Sign-off

```markdown
## Business Readiness Certification

I, [Product Owner Name], certify that:

- [ ] All requirements implemented
- [ ] User acceptance testing passed
- [ ] Training materials ready
- [ ] Support team briefed
- [ ] Launch plan approved
- [ ] Stakeholders informed

Signature: _________________ Date: _________________
```

### Operations Sign-off

```markdown
## Operations Readiness Certification

I, [DevOps Lead Name], certify that:

- [ ] Infrastructure provisioned
- [ ] Monitoring configured
- [ ] Backup strategy tested
- [ ] DR plan validated
- [ ] Runbook created
- [ ] On-call schedule set

Signature: _________________ Date: _________________
```

---

## 🎯 CONCLUSION

**Total Duration:** 28 days
**Resources Required:**
- 2 Backend Developers
- 1 Frontend Developer
- 1 DevOps Engineer
- 1 QA Engineer
- 1 Security Lead
- 1 Product Owner

**Expected Outcome:** Production-ready Ubertruck MVP meeting all frozen requirements with 100% compliance.

---

**Document Status:** READY FOR EXECUTION
**Next Step:** Begin Day 1 tasks immediately
**Point of Contact:** [Tech Lead]
**Escalation:** [Product Owner]