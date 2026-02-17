# Regulatory Compliance Specifications
## E-Way Bill, Vahan API, and DPDP Act Integration
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document addresses critical regulatory compliance gaps identified in the audit, specifically E-Way Bill integration, Vahan/Sarathi API verification, and DPDP Act compliance for the Ubertruck MVP.

## 1. E-Way Bill Integration Specifications

### 1.1 Functional Requirements

```yaml
FR-019: E-Way Bill Generation
  Description: System shall generate E-Way Bills for consignments >₹50,000
  Priority: P1 (Mandatory)
  Compliance: GST Act, Section 68

  Sub-requirements:
    FR-019.1: Collect HSN codes during booking
    FR-019.2: Validate transporter GSTIN
    FR-019.3: Auto-generate E-Way Bill via API
    FR-019.4: Store E-Way Bill number
    FR-019.5: Handle Part-B updates for vehicle changes
    FR-019.6: Support bulk E-Way Bill generation
```

### 1.2 E-Way Bill Data Collection

```typescript
// Enhanced Booking Model with E-Way Bill Fields
interface EnhancedBookingRequest {
  // Existing fields
  pickupLocation: Location;
  deliveryLocation: Location;
  weight: number;
  cargoType: string;

  // New E-Way Bill fields
  hsnCode: string;           // 4-8 digit HSN code
  invoiceNumber: string;      // Shipper's invoice
  invoiceDate: Date;
  invoiceValue: number;       // For E-Way Bill threshold check
  transporterId?: string;     // Transporter GSTIN (optional)
  vehicleNumber?: string;     // For Part-B generation
  transportMode: 'ROAD';      // Fixed for trucking
  vehicleType: 'REGULAR' | 'ODC';  // Over Dimensional Cargo
}
```

### 1.3 E-Way Bill API Integration

```yaml
API Endpoints:
  POST /api/v1/eway-bill/generate
    Request:
      - bookingId: UUID
      - hsnCode: string
      - invoiceDetails: object
    Response:
      - ewayBillNumber: string (12 digits)
      - validFrom: datetime
      - validUpto: datetime

  PUT /api/v1/eway-bill/{ewbNumber}/vehicle
    Request:
      - vehicleNumber: string
      - fromPlace: string
      - reasonCode: number
    Response:
      - updated: boolean
      - newValidUpto: datetime

  GET /api/v1/eway-bill/{ewbNumber}/status
    Response:
      - status: ACTIVE | CANCELLED | EXPIRED
      - remainingDistance: number
      - extendable: boolean
```

### 1.4 E-Way Bill Validation Rules

```javascript
// Business Rules for E-Way Bill
const EWAY_BILL_RULES = {
  // Threshold for mandatory E-Way Bill
  VALUE_THRESHOLD: 50000,

  // Validity calculation (1 day per 100km)
  VALIDITY_FORMULA: (distance) => {
    if (distance <= 100) return 1;
    return Math.ceil(distance / 100);
  },

  // HSN Code validation
  HSN_PATTERN: /^[0-9]{4,8}$/,

  // Part-B update reasons
  UPDATE_REASONS: {
    BREAKDOWN: 1,
    TRANSHIPMENT: 2,
    OTHERS: 4
  },

  // Maximum extension days
  MAX_EXTENSION: 8
};
```

## 2. Vahan and Sarathi API Integration

### 2.1 Vehicle Verification (Vahan API)

```yaml
FR-020: Vehicle Registration Verification
  Description: System shall verify vehicle RC details via Vahan API
  Priority: P1 (Security Critical)
  Compliance: Motor Vehicles Act

  Sub-requirements:
    FR-020.1: Validate registration number format
    FR-020.2: Fetch vehicle details (make, model, capacity)
    FR-020.3: Verify fitness certificate validity
    FR-020.4: Check permit validity for goods carriage
    FR-020.5: Store verification status and timestamp
```

### 2.2 Driver License Verification (Sarathi API)

```yaml
FR-021: Driver License Verification
  Description: System shall verify driver licenses via Sarathi API
  Priority: P1 (Security Critical)
  Compliance: Motor Vehicles Act

  Sub-requirements:
    FR-021.1: Validate license number format
    FR-021.2: Verify license validity and type
    FR-021.3: Check for transport endorsement
    FR-021.4: Verify hazmat certification (if applicable)
    FR-021.5: Flag suspended/blacklisted licenses
```

### 2.3 Verification API Implementation

```typescript
// Vahan API Service
interface VahanVerificationService {
  async verifyVehicle(registrationNumber: string): Promise<VehicleDetails>;
  async checkFitness(registrationNumber: string): Promise<FitnessStatus>;
  async getPermitDetails(registrationNumber: string): Promise<PermitInfo>;
}

interface VehicleDetails {
  registrationNumber: string;
  ownerName: string;
  makerModel: string;
  vehicleClass: string;
  fuelType: string;
  engineNumber: string;
  chassisNumber: string;
  fitnessValidUpto: Date;
  insuranceValidUpto: Date;
  pucValidUpto: Date;
  permitValidUpto?: Date;
  grossVehicleWeight: number;
  unladenWeight: number;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'PENDING';
  verifiedAt: Date;
}

// Sarathi API Service
interface SarathiVerificationService {
  async verifyLicense(licenseNumber: string): Promise<LicenseDetails>;
  async checkEndorsements(licenseNumber: string): Promise<Endorsement[]>;
}

interface LicenseDetails {
  licenseNumber: string;
  holderName: string;
  dateOfBirth: Date;
  bloodGroup: string;
  issueDate: Date;
  validityNonTransport: Date;
  validityTransport: Date;
  vehicleClasses: string[];
  hazmatEndorsement: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  verificationStatus: 'VERIFIED' | 'FAILED';
  verifiedAt: Date;
}
```

### 2.4 Verification Workflow

```yaml
Vehicle Onboarding Flow:
  1. Carrier enters vehicle registration number
  2. System validates format (state code + number)
  3. Call Vahan API for verification
  4. If verified:
     - Store vehicle details
     - Check fitness validity
     - Check permit for goods carriage
  5. If failed:
     - Mark as "Manual Verification Required"
     - Admin reviews uploaded documents
  6. Set verification expiry (30 days)

Driver Onboarding Flow:
  1. Driver enters license number
  2. System validates format
  3. Call Sarathi API for verification
  4. If verified:
     - Check transport validity
     - Store license details
  5. If failed:
     - Request manual document upload
     - Admin verification queue
  6. Set re-verification date (90 days)
```

## 3. DPDP Act Compliance

### 3.1 Consent Management

```yaml
FR-022: Data Privacy Consent Management
  Description: System shall implement DPDP Act compliant consent mechanisms
  Priority: P1 (Legal Mandatory)
  Compliance: Digital Personal Data Protection Act 2023

  Sub-requirements:
    FR-022.1: Capture explicit consent before data collection
    FR-022.2: Provide granular consent options
    FR-022.3: Allow consent withdrawal
    FR-022.4: Maintain consent audit trail
    FR-022.5: Implement data retention policies
    FR-022.6: Support data portability requests
    FR-022.7: Enable data deletion (right to be forgotten)
```

### 3.2 Consent Implementation

```typescript
// Consent Management Model
interface ConsentRecord {
  userId: string;
  consentId: string;
  purpose: ConsentPurpose;
  dataCategories: DataCategory[];
  grantedAt: Date;
  expiresAt?: Date;
  withdrawnAt?: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

enum ConsentPurpose {
  ACCOUNT_CREATION = 'account_creation',
  KYC_VERIFICATION = 'kyc_verification',
  TRANSACTION_PROCESSING = 'transaction_processing',
  MARKETING_COMMUNICATION = 'marketing_communication',
  ANALYTICS = 'analytics'
}

enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers',
  CONTACT_INFORMATION = 'contact_information',
  FINANCIAL_INFORMATION = 'financial_information',
  LOCATION_DATA = 'location_data',
  VEHICLE_INFORMATION = 'vehicle_information',
  BIOMETRIC_DATA = 'biometric_data'
}
```

### 3.3 Data Retention Policy

```yaml
Data Retention Schedule:
  User Profile Data:
    Active Users: Retained indefinitely
    Inactive Users: 3 years after last activity
    Deletion: Anonymized after retention period

  Transaction Data:
    Completed Bookings: 7 years (tax compliance)
    Cancelled Bookings: 1 year
    POD Images: 90 days

  Verification Data:
    KYC Documents: 7 years after relationship ends
    Vehicle Documents: Until relationship ends + 1 year
    Driver Licenses: Until relationship ends + 1 year

  Communication Data:
    SMS Logs: 6 months
    Email Logs: 1 year
    Support Tickets: 3 years

  Location Data:
    Status Update Locations: 30 days
    Route History: 90 days
```

### 3.4 Privacy Controls Implementation

```typescript
// Privacy API Endpoints
interface PrivacyAPI {
  // Data Subject Rights
  GET /api/v1/privacy/my-data
    Response: Complete data export in JSON/PDF

  POST /api/v1/privacy/consent
    Request: ConsentRecord
    Response: ConsentId

  DELETE /api/v1/privacy/consent/{consentId}
    Response: Withdrawal confirmation

  DELETE /api/v1/privacy/my-account
    Request: Deletion reason
    Response: Deletion schedule (30-day cooling period)

  GET /api/v1/privacy/data-usage
    Response: List of all data processing activities
}
```

### 3.5 DPDP Compliance Checklist

```yaml
Technical Controls:
  ✓ Encryption at rest (AES-256)
  ✓ Encryption in transit (TLS 1.3)
  ✓ Access logging and monitoring
  ✓ Data minimization in API responses
  ✓ Automated data purging jobs
  ✓ Consent version tracking

Administrative Controls:
  ✓ Privacy policy (vernacular versions)
  ✓ Data Protection Officer appointment
  ✓ Breach notification process (72 hours)
  ✓ Third-party processor agreements
  ✓ Cross-border transfer restrictions
  ✓ Employee training program

Legal Documentation:
  ✓ Privacy policy
  ✓ Terms of service
  ✓ Cookie policy
  ✓ Data processing agreements
  ✓ Consent forms
```

## 4. Database Schema Updates for Compliance

```sql
-- E-Way Bill Tables
CREATE TABLE compliance.eway_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES booking.bookings(id),
  eway_bill_number VARCHAR(12) UNIQUE,
  hsn_code VARCHAR(8) NOT NULL,
  invoice_number VARCHAR(50),
  invoice_date DATE,
  invoice_value DECIMAL(12,2),
  valid_from TIMESTAMP,
  valid_upto TIMESTAMP,
  status VARCHAR(20),
  part_b_updated_at TIMESTAMP,
  vehicle_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_hsn CHECK (hsn_code ~ '^[0-9]{4,8}$')
);

-- Vehicle Verification Table
CREATE TABLE compliance.vehicle_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES fleet.vehicles(id),
  registration_number VARCHAR(20),
  verification_method VARCHAR(20), -- 'VAHAN_API' | 'MANUAL'
  verification_status VARCHAR(20), -- 'VERIFIED' | 'FAILED' | 'PENDING'
  vahan_response JSONB,
  fitness_valid_upto DATE,
  permit_valid_upto DATE,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES core.users(id),
  next_verification_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver Verification Table
CREATE TABLE compliance.driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES fleet.drivers(id),
  license_number VARCHAR(20),
  verification_method VARCHAR(20),
  verification_status VARCHAR(20),
  sarathi_response JSONB,
  transport_valid_upto DATE,
  verified_at TIMESTAMP,
  next_verification_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Management Table
CREATE TABLE compliance.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES core.users(id),
  purpose VARCHAR(50),
  data_categories TEXT[],
  consent_text TEXT,
  version VARCHAR(10),
  granted_at TIMESTAMP,
  expires_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT valid_purpose CHECK (purpose IN (
    'account_creation', 'kyc_verification',
    'transaction_processing', 'marketing_communication'
  ))
);

-- Audit Trail for DPDP Compliance
CREATE TABLE compliance.privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES core.users(id),
  action VARCHAR(50), -- 'DATA_ACCESS' | 'DATA_EXPORT' | 'DATA_DELETION'
  resource_type VARCHAR(50),
  resource_id UUID,
  performed_by UUID REFERENCES core.users(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Integration Timeline

### 5.1 Sprint-wise Implementation

```yaml
Sprint 1 (Week 2):
  - Vahan/Sarathi API credentials procurement
  - Database schema updates
  - Consent management UI

Sprint 2 (Week 3):
  - E-Way Bill API integration
  - Vehicle verification implementation
  - Driver verification implementation

Sprint 3 (Week 4):
  - DPDP consent workflows
  - Privacy API endpoints
  - Data retention jobs

Sprint 4 (Week 5):
  - Compliance testing
  - Documentation updates
  - Admin training
```

### 5.2 Compliance Readiness Checklist

```yaml
Week 6 Deliverables:
  ✓ E-Way Bill generation functional
  ✓ Vehicle verification operational
  ✓ Driver verification operational
  ✓ Consent capture implemented
  ✓ Privacy controls active
  ✓ Audit trails logging
  ✓ Retention policies enforced
  ✓ Legal documents updated
```

## 6. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API downtime | Cannot verify vehicles | Manual verification fallback |
| E-Way Bill failures | Shipment delays | Bulk generation, retry logic |
| False rejections | Carrier frustration | Manual override by admin |
| Consent fatigue | Low adoption | Progressive disclosure |
| Data breach | Legal liability | Encryption, access controls |

---

*This specification addresses all regulatory compliance gaps identified in the audit and must be implemented before production launch.*