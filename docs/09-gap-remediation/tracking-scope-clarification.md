# Tracking Scope Clarification Document
## Resolution of GPS Tracking Contradiction
### Version 1.0 | Date: February 2024

---

## Executive Decision

After audit findings, the following scope clarification is hereby documented:

### FINAL DECISION: Status-Based Tracking Only (No Real-Time GPS in MVP)

## 1. Scope Clarification

### 1.1 What IS Included (MVP Scope)

**Status-Based Tracking System:**
- 7-stage status updates via mobile web interface
- Manual status updates by drivers at key milestones
- Timestamp recording for each status change
- SMS notifications to shippers on status changes
- Basic route distance calculation using start/end coordinates

### 1.2 What IS NOT Included (Excluded from MVP)

**Real-Time GPS Features:**
- Live vehicle tracking on map
- Continuous location updates
- Geofencing alerts
- Route deviation monitoring
- Real-time ETA calculations
- Driver behavior monitoring

## 2. Implementation Specifications

### 2.1 Status Update Mechanism

```yaml
Status Stages:
  CREATED:
    Trigger: Booking created
    Actor: System
    Notification: SMS to carrier

  ASSIGNED:
    Trigger: Truck assignment
    Actor: System
    Notification: SMS to driver and shipper

  ACCEPTED:
    Trigger: Driver accepts booking
    Actor: Driver (via web app)
    Notification: SMS to shipper

  PICKUP_STARTED:
    Trigger: Driver arrives at pickup
    Actor: Driver (manual update)
    Notification: SMS to shipper
    Location: Capture single GPS point

  IN_TRANSIT:
    Trigger: Loading complete, departure
    Actor: Driver (manual update)
    Notification: SMS to shipper

  DELIVERED:
    Trigger: Arrival at destination
    Actor: Driver (manual update)
    Notification: SMS to shipper
    Requirements: POD photo upload

  COMPLETED:
    Trigger: POD verified
    Actor: System/Admin
    Notification: Invoice generation
```

### 2.2 Offline-First Status Updates

```typescript
// Status Update Service Specification
interface StatusUpdateRequest {
  bookingId: string;
  status: BookingStatus;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  podPhoto?: string; // Base64 encoded
  notes?: string;
  networkStatus: 'online' | 'offline';
}

// Offline Queue Mechanism
interface OfflineQueue {
  pendingUpdates: StatusUpdateRequest[];
  maxRetries: 3;
  retryInterval: 30000; // 30 seconds
  syncOnConnect: boolean;
}
```

### 2.3 Database Schema Updates

```sql
-- Remove real-time tracking tables
DROP TABLE IF EXISTS tracking.real_time_locations;
DROP TABLE IF EXISTS tracking.geofences;

-- Simplify to status-based tracking
CREATE TABLE tracking.status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES booking.bookings(id),
  status VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  updated_by UUID REFERENCES core.users(id),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  network_status VARCHAR(10),
  synced_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN (
    'CREATED', 'ASSIGNED', 'ACCEPTED',
    'PICKUP_STARTED', 'IN_TRANSIT',
    'DELIVERED', 'COMPLETED'
  ))
);

CREATE INDEX idx_status_updates_booking ON tracking.status_updates(booking_id);
CREATE INDEX idx_status_updates_synced ON tracking.status_updates(synced_at)
  WHERE synced_at IS NULL;
```

## 3. Service Architecture Simplification

### 3.1 Route & Tracking Service (Port 3004)

```yaml
Simplified Responsibilities:
  - Status update management
  - POD photo storage
  - Basic distance calculation
  - Status notification triggers

Removed Responsibilities:
  - Real-time location streaming
  - Geofence management
  - Route optimization
  - Live ETA calculations
```

### 3.2 API Endpoint Changes

```yaml
Retained Endpoints:
  PUT /api/v1/tracking/{bookingId}/status
  POST /api/v1/tracking/{bookingId}/pod
  GET /api/v1/tracking/{bookingId}/history

Removed Endpoints:
  GET /api/v1/tracking/{bookingId}/live
  POST /api/v1/tracking/geofences
  GET /api/v1/tracking/{bookingId}/route
  WS /api/v1/tracking/stream
```

## 4. UI/UX Simplification

### 4.1 Driver Interface

```markdown
## Driver Mobile Web Interface

### Status Update Screen
- Large buttons for each status transition
- Offline indicator with queue count
- Simple POD photo capture
- Basic notes field
- No map view required
```

### 4.2 Shipper Interface

```markdown
## Shipper Dashboard

### Booking Tracking View
- Timeline view of status updates
- Timestamp for each status
- POD image viewer
- Estimated vs actual timeline
- No live map tracking
```

## 5. Cost-Benefit Analysis

### 5.1 Cost Savings

| Component | With GPS | Without GPS | Savings |
|-----------|----------|-------------|---------|
| Google Maps API | ₹15,000/month | ₹2,000/month | ₹13,000 |
| Server Resources | t3.medium | t3.small | ₹5,000/month |
| Development Time | 3 weeks | 1 week | 2 weeks |
| Data Storage | 50GB | 10GB | ₹2,000/month |

### 5.2 Future Migration Path

```yaml
Phase 2 (Month 7-9):
  - Add optional GPS hardware integration
  - Implement live tracking for premium tier
  - Geofencing for high-value cargo

Phase 3 (Month 10-12):
  - Full GPS tracking for all shipments
  - Predictive ETA using ML
  - Route optimization algorithms
```

## 6. Updated Development Timeline

### Sprint 2 Impact (Week 3)

**Before:** Route Service with GPS (5 days)
**After:** Status Service only (2 days)
**Saved Time:** 3 days

This saved time will be allocated to:
- E-Way Bill integration (2 days)
- Enhanced error handling (1 day)

## 7. Stakeholder Communication

### 7.1 Message to Shippers
"Track your shipments with real-time status updates at every key milestone, ensuring complete visibility from pickup to delivery."

### 7.2 Message to Carriers
"Simple one-tap status updates that work even in poor network areas, ensuring you get credited for every milestone."

## 8. Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | [Required] | ✓ | Feb 2024 |
| Technical Lead | [Required] | ✓ | Feb 2024 |
| Customer Rep | [Required] | ✓ | Feb 2024 |

---

*This document supersedes any conflicting specifications in the SRS and SDD regarding GPS tracking.*