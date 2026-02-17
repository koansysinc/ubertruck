# Disaster Recovery Plan (DRP)
## Ubertruck MVP - Business Continuity and Disaster Recovery
### Version 1.0 | Date: February 2024

---

## Executive Summary

This Disaster Recovery Plan addresses the critical gap of missing recovery procedures identified in the audit, establishing clear Recovery Time Objectives (RTO), Recovery Point Objectives (RPO), and detailed procedures for system restoration in case of catastrophic failures.

## 1. Recovery Objectives and Service Levels

### 1.1 Business Impact Analysis

| Service Component | Business Impact | Maximum Tolerable Downtime | Priority | Revenue Impact/Hour |
|-------------------|-----------------|---------------------------|----------|-------------------|
| Booking Creation | Critical | 1 hour | P0 | ₹50,000 |
| Payment Processing | Critical | 2 hours | P0 | ₹30,000 |
| Status Updates | High | 4 hours | P1 | ₹10,000 |
| Fleet Management | Medium | 8 hours | P2 | ₹5,000 |
| Invoice Generation | Medium | 12 hours | P2 | ₹3,000 |
| Admin Dashboard | Low | 24 hours | P3 | ₹1,000 |

### 1.2 Recovery Objectives

```yaml
Service Level Objectives:
  RTO (Recovery Time Objective):
    Critical Services (P0): 1 hour
    High Priority (P1): 4 hours
    Medium Priority (P2): 8 hours
    Low Priority (P3): 24 hours

  RPO (Recovery Point Objective):
    Database Transactions: 15 minutes
    File Uploads (POD): 1 hour
    Logs and Metrics: 24 hours
    Archived Data: 7 days

  Availability Targets:
    Overall Platform: 99.5% (43.8 hours downtime/year)
    Booking Service: 99.9% (8.76 hours downtime/year)
    Payment Service: 99.95% (4.38 hours downtime/year)
```

## 2. Disaster Scenarios and Response

### 2.1 Disaster Classification

| Level | Scenario | Examples | Response Time | Escalation |
|-------|----------|----------|---------------|------------|
| **Level 1** | Service Degradation | High latency, partial failures | 15 minutes | Dev on-call |
| **Level 2** | Service Outage | Single service down | 30 minutes | Dev + DevOps |
| **Level 3** | Multi-Service Failure | Database down, multiple services affected | 15 minutes | All hands |
| **Level 4** | Regional Disaster | AWS Mumbai region failure | Immediate | Executive + All teams |
| **Level 5** | Complete System Failure | Total platform outage | Immediate | Crisis team activation |

### 2.2 Specific Disaster Scenarios

#### Scenario 1: AWS Mumbai Region Outage

```yaml
Scenario: Complete AWS ap-south-1 region failure
Probability: Low (0.1% annually)
Impact: Complete platform outage

Recovery Strategy:
  1. Detection (0-5 minutes):
     - CloudWatch alarms trigger
     - PagerDuty alerts sent
     - Status page auto-updated

  2. Assessment (5-15 minutes):
     - Verify region status on AWS Health Dashboard
     - Check backup region readiness
     - Estimate recovery time

  3. Failover Decision (15-20 minutes):
     - If outage > 30 minutes expected: Initiate failover
     - If < 30 minutes: Wait with communication

  4. Failover Execution (20-60 minutes):
     - DNS failover to Mumbai backup zone
     - Restore database from snapshot
     - Start services in backup region
     - Verify data consistency

  5. Validation (60-90 minutes):
     - Test critical user flows
     - Verify payment processing
     - Check data integrity
```

#### Scenario 2: Database Corruption

```yaml
Scenario: PostgreSQL database corruption or ransomware
Probability: Medium (1% annually)
Impact: Data loss, booking failures

Recovery Strategy:
  1. Immediate Actions:
     - Isolate affected database
     - Stop write operations
     - Switch to read-only mode

  2. Assessment:
     - Identify corruption extent
     - Determine last good backup
     - Calculate data loss window

  3. Recovery Options:
     a. Point-in-Time Recovery (preferred):
        - Restore to specific timestamp
        - Replay WAL logs
        - Estimated time: 2-3 hours

     b. Backup Restoration:
        - Restore from daily backup
        - Apply transaction logs
        - Estimated time: 4-6 hours

  4. Data Reconciliation:
     - Compare with payment gateway records
     - Verify booking statuses
     - Reconcile with SMS logs
```

#### Scenario 3: Cyber Attack

```yaml
Scenario: DDoS attack or security breach
Probability: High (5% annually)
Impact: Service unavailability, data breach

Response Plan:
  1. Detection & Containment:
     - Cloudflare DDoS protection activates
     - Rate limiting increases
     - Suspicious IPs blocked

  2. Incident Response:
     - Activate security team
     - Enable enhanced logging
     - Preserve forensic evidence

  3. Communication:
     - Notify affected users within 72 hours (DPDP compliance)
     - Update status page
     - Prepare media statement

  4. Recovery:
     - Reset compromised credentials
     - Patch vulnerabilities
     - Restore from clean backups
```

## 3. Infrastructure and Architecture

### 3.1 Current Architecture (Single Region)

```yaml
Primary Infrastructure (Mumbai):
  Region: ap-south-1
  Availability Zones: ap-south-1a (primary), ap-south-1b (standby)

  Components:
    Application Servers:
      - EC2: t3.medium (2 instances)
      - Auto-scaling: Min 2, Max 10
      - Load Balancer: ALB with health checks

    Database:
      - RDS PostgreSQL 15
      - Instance: db.t3.medium
      - Storage: 100GB SSD
      - Multi-AZ: Enabled

    Cache:
      - ElastiCache Redis
      - Instance: cache.t3.micro
      - Replication: 1 replica

    Storage:
      - S3 Bucket: ubertruck-prod-assets
      - S3 Bucket: ubertruck-prod-backups
      - Lifecycle: 90-day archive to Glacier
```

### 3.2 Disaster Recovery Architecture

```yaml
DR Infrastructure (Singapore):
  Region: ap-southeast-1 (backup region)
  Status: Cold standby

  Components:
    Backup Storage:
      - S3 Cross-region replication
      - Database snapshots (daily)
      - AMI copies (weekly)

    Recovery Resources (pre-configured):
      - CloudFormation templates
      - Terraform configurations
      - Docker images in ECR
      - Launch templates

  Activation Time: 45-60 minutes
  Cost: ₹5,000/month (standby) + ₹50,000/day (active)
```

### 3.3 Backup Strategy

```yaml
Backup Schedule:
  Database:
    Full Backup: Daily at 2:00 AM IST
    Incremental: Every 4 hours
    Transaction Logs: Continuous (5-minute intervals)
    Retention: 30 days local, 90 days in S3

  Application Data:
    POD Images: Real-time S3 sync
    User Uploads: Hourly S3 sync
    Configuration: Git repository (versioned)

  System Backups:
    AMI Snapshots: Weekly
    EBS Snapshots: Daily
    Docker Images: On every deployment

Backup Validation:
  Automated Tests: Daily restoration test to staging
  Manual Tests: Monthly full recovery drill
  Audit: Quarterly backup integrity check
```

## 4. Recovery Procedures

### 4.1 Database Recovery Procedures

```bash
#!/bin/bash
# PostgreSQL Point-in-Time Recovery

# Step 1: Stop application services
kubectl scale deployment booking-service --replicas=0
kubectl scale deployment payment-service --replicas=0

# Step 2: Create recovery point
RECOVERY_TIME="2024-02-15 14:30:00 IST"
BACKUP_ID=$(aws rds describe-db-snapshots \
  --db-instance-identifier ubertruck-prod \
  --query "DBSnapshots[?SnapshotCreateTime<='${RECOVERY_TIME}'][0].DBSnapshotIdentifier" \
  --output text)

# Step 3: Restore database
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ubertruck-prod \
  --target-db-instance-identifier ubertruck-recovery \
  --restore-time "${RECOVERY_TIME}" \
  --publicly-accessible false \
  --db-subnet-group-name prod-subnet-group

# Step 4: Wait for restoration
aws rds wait db-instance-available \
  --db-instance-identifier ubertruck-recovery

# Step 5: Verify data integrity
psql -h ubertruck-recovery.cluster.amazonaws.com -U admin -d ubertruck -c "
  SELECT COUNT(*) as bookings FROM booking.bookings WHERE created_at >= '${RECOVERY_TIME}';
  SELECT COUNT(*) as invoices FROM payment.invoices WHERE created_at >= '${RECOVERY_TIME}';
"

# Step 6: Switch application to recovered database
kubectl set env deployment/booking-service DATABASE_URL="postgresql://..."
kubectl scale deployment booking-service --replicas=2

# Step 7: Validate recovery
./run-smoke-tests.sh
```

### 4.2 Application Recovery Procedures

```yaml
Service Recovery Order:
  1. Core Services:
     - User Service (Authentication)
     - Database connections
     - Redis cache

  2. Business Services:
     - Fleet Service
     - Booking Service
     - Payment Service

  3. Support Services:
     - Tracking Service
     - Admin Service
     - Notification Service

Recovery Checklist:
  Database:
    [ ] Verify PostgreSQL is accessible
    [ ] Check replication lag < 5 seconds
    [ ] Validate connection pools
    [ ] Run database health checks

  Application:
    [ ] Deploy latest stable version
    [ ] Verify environment variables
    [ ] Check service dependencies
    [ ] Validate API endpoints

  Integration:
    [ ] Test SMS gateway (2Factor)
    [ ] Verify payment gateway
    [ ] Check E-Way Bill API
    [ ] Validate Vahan/Sarathi APIs

  Monitoring:
    [ ] CloudWatch metrics active
    [ ] Application logs flowing
    [ ] Alerts configured
    [ ] Status page updated
```

### 4.3 Data Validation Procedures

```sql
-- Post-recovery data validation queries

-- 1. Check booking consistency
WITH booking_validation AS (
  SELECT
    b.id,
    b.status,
    COUNT(su.id) as status_updates,
    MAX(i.id) IS NOT NULL as has_invoice,
    MAX(p.id) IS NOT NULL as has_pod
  FROM booking.bookings b
  LEFT JOIN tracking.status_updates su ON su.booking_id = b.id
  LEFT JOIN payment.invoices i ON i.booking_id = b.id
  LEFT JOIN tracking.pod_uploads p ON p.booking_id = b.id
  WHERE b.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY b.id, b.status
)
SELECT
  status,
  COUNT(*) as total_bookings,
  SUM(CASE WHEN status = 'COMPLETED' AND NOT has_invoice THEN 1 ELSE 0 END) as missing_invoices,
  SUM(CASE WHEN status = 'DELIVERED' AND NOT has_pod THEN 1 ELSE 0 END) as missing_pods
FROM booking_validation
GROUP BY status;

-- 2. Verify payment reconciliation
SELECT
  DATE(invoice_date) as date,
  COUNT(*) as total_invoices,
  SUM(total_amount) as total_amount,
  COUNT(*) FILTER (WHERE payment_status = 'PENDING') as pending_payments
FROM payment.invoices
WHERE invoice_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(invoice_date)
ORDER BY date DESC;

-- 3. Check data integrity
SELECT
  'Users' as entity,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM core.users
UNION ALL
SELECT 'Vehicles', COUNT(*), MAX(created_at)
FROM fleet.vehicles
UNION ALL
SELECT 'Bookings', COUNT(*), MAX(created_at)
FROM booking.bookings
UNION ALL
SELECT 'Invoices', COUNT(*), MAX(created_at)
FROM payment.invoices;
```

## 5. Communication and Escalation

### 5.1 Incident Communication Matrix

| Audience | Channel | Timing | Message Template | Owner |
|----------|---------|--------|------------------|-------|
| On-call Team | PagerDuty | Immediate | Auto-alert | System |
| Management | SMS + Email | 5 minutes | Incident detected | DevOps Lead |
| All Hands | Slack #incident | 15 minutes | Status update | Incident Commander |
| Customers | Status Page | 15 minutes | Service disruption notice | Support Lead |
| Carriers/Shippers | SMS | 30 minutes | Booking impact notice | Operations |
| Media/Public | Twitter | 1 hour | Public statement | PR Team |

### 5.2 Communication Templates

#### Customer Communication (SMS)
```
[URGENT] Ubertruck service disruption detected. Your bookings are safe.
Current status: [INVESTIGATING/RESOLVED]
Estimated resolution: [TIME]
Updates: status.ubertruck.in
```

#### Status Page Update
```markdown
## Investigating Service Disruption
**Posted:** [TIMESTAMP]
**Severity:** [Critical/Major/Minor]

We are currently experiencing [DESCRIPTION OF ISSUE].

**Impact:**
- [List affected services]
- [Estimated number of users affected]

**Current Status:**
We have identified the issue and are working on resolution.

**Next Update:** In 30 minutes or when resolved

**Workaround:** [If available]
```

### 5.3 Escalation Path

```yaml
Escalation Levels:
  L1 - Initial Response (0-15 min):
    - On-call Developer
    - Can restart services
    - Can rollback deployments

  L2 - Technical Escalation (15-30 min):
    - DevOps Lead
    - Tech Lead
    - Can modify infrastructure
    - Can initiate failover

  L3 - Management Escalation (30-60 min):
    - CTO
    - VP Engineering
    - Can approve DR activation
    - Can authorize emergency spending

  L4 - Executive Escalation (60+ min):
    - CEO
    - Board notification
    - Media response
    - Legal team activation
```

## 6. Recovery Testing and Drills

### 6.1 Testing Schedule

| Test Type | Frequency | Duration | Scope | Participants |
|-----------|-----------|----------|-------|--------------|
| Backup Verification | Daily | 30 min | Automated backup restoration | Automated |
| Service Failover | Weekly | 1 hour | Individual service restart | DevOps |
| Database Recovery | Monthly | 2 hours | Point-in-time recovery test | DBA + DevOps |
| Partial DR Test | Quarterly | 4 hours | Critical services failover | Tech team |
| Full DR Drill | Bi-annually | 8 hours | Complete platform recovery | All teams |
| Tabletop Exercise | Annually | 2 hours | Scenario planning | Management |

### 6.2 Test Scenarios

```yaml
Quarterly DR Test Runbook:
  Preparation:
    - Schedule maintenance window (Saturday 2 AM - 6 AM)
    - Notify customers 48 hours in advance
    - Prepare test environment
    - Review previous test results

  Execution:
    1. Simulate Failure (30 min):
       - Disable primary database
       - Stop application services
       - Trigger monitoring alerts

    2. Execute Recovery (90 min):
       - Follow recovery procedures
       - Restore from backups
       - Validate data integrity

    3. Service Validation (60 min):
       - Run automated tests
       - Perform manual checks
       - Verify integrations

    4. Documentation (60 min):
       - Record recovery times
       - Document issues found
       - Update procedures

  Success Criteria:
    - RTO achieved: < 2 hours
    - RPO verified: < 30 minutes
    - All services functional
    - No data loss
    - Procedures followed correctly
```

### 6.3 Test Metrics and Reporting

```yaml
DR Test Metrics:
  Recovery Performance:
    - Actual RTO vs Target RTO
    - Actual RPO vs Target RPO
    - Time to detect failure
    - Time to make recovery decision
    - Time to complete recovery

  Quality Metrics:
    - Number of issues discovered
    - Procedures requiring update
    - Team readiness score
    - Communication effectiveness

  Business Impact:
    - Services affected
    - Data consistency issues
    - Customer impact (if any)
    - Cost of test execution

Monthly Report Format:
  - Executive Summary
  - Test Results
  - Issues and Resolutions
  - Action Items
  - Next Test Schedule
```

## 7. Preventive Measures

### 7.1 High Availability Design

```yaml
Architecture Improvements:
  Database:
    - Multi-AZ RDS deployment
    - Read replicas for load distribution
    - Automated failover configuration
    - Connection pooling with PgBouncer

  Application:
    - Stateless service design
    - Circuit breakers (Hystrix pattern)
    - Retry with exponential backoff
    - Graceful degradation

  Infrastructure:
    - Auto-scaling based on metrics
    - Health checks every 30 seconds
    - Redundant load balancers
    - Cross-AZ deployment

  Monitoring:
    - Synthetic monitoring (every 5 min)
    - Real user monitoring
    - Custom CloudWatch metrics
    - Predictive alerting
```

### 7.2 Risk Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy | Investment |
|------|------------|--------|-------------------|------------|
| AWS Region Failure | Low | Critical | Multi-region standby | ₹10,000/month |
| Database Corruption | Medium | High | Continuous backups + WAL | ₹5,000/month |
| DDoS Attack | High | Medium | Cloudflare + Rate limiting | ₹3,000/month |
| Data Center Fire | Very Low | Critical | Off-site backups | ₹2,000/month |
| Ransomware | Medium | Critical | Immutable backups + MFA | ₹1,000/month |
| Key Person Loss | Medium | Medium | Documentation + Training | ₹5,000 one-time |

### 7.3 Continuous Improvement

```yaml
Review Cycle:
  Monthly:
    - Review incidents and near-misses
    - Update contact information
    - Verify backup integrity
    - Test alert mechanisms

  Quarterly:
    - Update risk assessment
    - Review and test procedures
    - Conduct DR drill
    - Training for new team members

  Annually:
    - Complete DR plan review
    - Infrastructure assessment
    - Vendor capability review
    - Budget allocation review

Improvement Tracking:
  - Incident post-mortems
  - Test result analysis
  - Industry best practices
  - Regulatory requirements
  - Technology updates
```

## 8. Roles and Responsibilities

### 8.1 DR Team Structure

| Role | Primary Responsibility | Backup | Contact |
|------|------------------------|---------|---------|
| Incident Commander | Overall coordination | CTO | Primary: +91-XXX, Backup: +91-YYY |
| Technical Lead | Recovery execution | Senior Dev | Primary: +91-XXX, Backup: +91-YYY |
| Database Admin | Database recovery | DevOps Lead | Primary: +91-XXX, Backup: +91-YYY |
| Network Admin | Infrastructure recovery | Cloud Architect | Primary: +91-XXX, Backup: +91-YYY |
| Communications Lead | Stakeholder updates | Product Manager | Primary: +91-XXX, Backup: +91-YYY |
| QA Lead | Validation testing | Senior QA | Primary: +91-XXX, Backup: +91-YYY |

### 8.2 RACI Matrix

| Activity | Incident Cmd | Tech Lead | DBA | DevOps | QA | Support |
|----------|--------------|-----------|-----|--------|-----|---------|
| Declare Incident | A/R | C | I | C | I | I |
| Assess Impact | R | A | C | C | I | C |
| Initiate Recovery | A | R | R | R | I | I |
| Database Recovery | I | C | R/A | C | I | I |
| Service Recovery | C | R/A | C | R | C | I |
| Testing | I | C | C | C | R/A | C |
| Communication | R/A | I | I | I | I | R |
| Sign-off | R/A | C | C | C | R | I |

*R=Responsible, A=Accountable, C=Consulted, I=Informed*

## 9. Compliance and Regulatory

### 9.1 Regulatory Requirements

```yaml
DPDP Act 2023:
  - Breach notification: Within 72 hours
  - Data restoration: Best effort
  - Audit trail: Maintained for incidents
  - User communication: Mandatory

GST Compliance:
  - Invoice continuity: Must maintain sequence
  - E-Way Bill validity: Consider for recovery timing
  - Data retention: 8 years for tax records

IT Act:
  - Reasonable security practices
  - Sensitive data protection
  - Incident reporting to CERT-In

Business Continuity:
  - ISO 22301 alignment (future)
  - SOC 2 Type II readiness
  - Annual DR audit
```

### 9.2 Documentation Requirements

```yaml
Required Documentation:
  During Incident:
    - Incident log (timestamp all actions)
    - Decision record
    - Communication log
    - Technical changes made

  Post-Incident:
    - Incident report (within 24 hours)
    - Root cause analysis (within 72 hours)
    - Lessons learned (within 1 week)
    - Process improvements (within 2 weeks)

  Retention:
    - Incident reports: 3 years
    - Test results: 1 year
    - Communication logs: 6 months
    - Technical logs: 90 days
```

## 10. Budget and Resources

### 10.1 DR Budget Allocation

| Category | Monthly Cost | Annual Cost | Justification |
|----------|--------------|-------------|---------------|
| Backup Storage (S3) | ₹2,000 | ₹24,000 | 1TB with lifecycle |
| Cross-region Replication | ₹3,000 | ₹36,000 | Critical data sync |
| DR Infrastructure (Standby) | ₹5,000 | ₹60,000 | Cold standby resources |
| Monitoring Tools | ₹1,500 | ₹18,000 | CloudWatch, Datadog |
| DR Testing | ₹2,000 | ₹24,000 | Test environment costs |
| Training & Drills | ₹500 | ₹6,000 | Team preparedness |
| **Total** | **₹14,000** | **₹168,000** | ~1.4% of revenue |

### 10.2 Resource Requirements

```yaml
Human Resources:
  Dedicated:
    - DR Coordinator: 20% allocation
    - Backup Administrator: 40% allocation

  On-call Rotation:
    - Primary: 24x7 coverage
    - Secondary: Business hours
    - Escalation: Executive availability

  External Support:
    - AWS Premium Support: ₹10,000/month
    - Security Consultant: On-demand
    - DR Specialist: Quarterly review

Technical Resources:
  Minimum Requirements:
    - Backup storage: 2x production data
    - Network bandwidth: 100 Mbps minimum
    - Standby compute: 50% of production
    - Monitoring: Real-time with 1-minute granularity
```

## 11. Appendices

### Appendix A: Contact Directory

```yaml
Internal Contacts:
  On-call Hotline: 1800-XXX-XXXX
  WhatsApp Group: "Ubertruck DR Team"
  Slack Channel: #incident-response
  Email List: dr-team@ubertruck.in

External Contacts:
  AWS Support: +1-XXX-XXX-XXXX (Premium)
  Cloudflare: +1-XXX-XXX-XXXX
  2Factor SMS: +91-XXX-XXX-XXXX
  Bank (Reconciliation): +91-XXX-XXX-XXXX
  Legal Team: legal@ubertruck.in
```

### Appendix B: Critical Systems Inventory

```yaml
Critical Systems:
  Production:
    - Database: ubertruck-prod.cluster-xxx.ap-south-1.rds.amazonaws.com
    - Redis: ubertruck-redis.xxx.cache.amazonaws.com
    - Load Balancer: ubertruck-alb-xxx.ap-south-1.elb.amazonaws.com
    - S3 Buckets: ubertruck-prod-assets, ubertruck-prod-backups

  DNS Records:
    - api.ubertruck.in → ALB
    - app.ubertruck.in → CloudFront
    - status.ubertruck.in → StatusPage

  API Keys (Stored in AWS Secrets Manager):
    - SMS Gateway API
    - Payment Gateway Keys
    - E-Way Bill Credentials
    - Vahan/Sarathi API Keys
```

### Appendix C: Recovery Scripts Location

```yaml
Script Repository:
  GitHub: github.com/ubertruck/dr-scripts

  Key Scripts:
    - /database/restore-point-in-time.sh
    - /application/failover-services.sh
    - /monitoring/validate-recovery.sh
    - /communication/send-notifications.sh
    - /testing/run-dr-drill.sh
```

---

*This Disaster Recovery Plan must be reviewed quarterly and updated after each incident or major infrastructure change. Last tested: [Date] | Next test scheduled: [Date]*