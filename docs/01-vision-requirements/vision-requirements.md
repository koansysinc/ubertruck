# Vision & Requirements Document
## Ubertruck MVP - Simplified Launch Strategy
### Version 1.0.0-FROZEN | Date: February 2024

> **⚠️ IMPORTANT: This document contains FROZEN requirements. No modifications allowed without formal change request and approval process.**

---

## Executive Summary

Ubertruck MVP is a simplified digital freight platform designed to connect shippers with truck owners on the Nalgonda-Miryalguda corridor. By focusing on a single corridor, fixed-rate pricing model, and English-only interface, we aim to achieve 95%+ operational success within 90 days.

**Core Principle**: Do ONE thing exceptionally well before expanding.

---

## 1. Problem Statement

### 1.1 Market Problem
The Nalgonda-Miryalguda industrial corridor processes 500+ daily truck movements with critical inefficiencies:

- **70% phone-based bookings** causing 30-minute average booking times
- **30% empty return trips** resulting in ₹2,000 loss per trip
- **15-day payment delays** affecting truck owner cash flow
- **Zero digital tracking** causing customer anxiety
- **40% price variation** (₹4,000-₹7,000 per trip) creating disputes

### 1.2 Impact Quantification
- Annual inefficiency cost: ₹18 crores
- Time wasted: 250 hours/month on coordination
- Revenue loss: ₹6 crores from empty returns
- Trust deficit due to lack of transparency

### 1.3 Root Causes
1. Fragmented market with no central platform
2. Lack of technology adoption among truck owners
3. Complex pricing negotiations
4. Manual documentation and tracking
5. Cash-based transactions causing delays

---

## 2. Target Users

### 2.1 Primary Users

#### Shippers (Demand Side)
```yaml
Profile:
  Business Type: Stone crushers, quarries, manufacturers
  Location: Nalgonda industrial area
  Count: ~50 establishments
  Target: 15 active users (30% penetration)
  Volume: 3-10 trucks/day each

Demographics:
  Decision Maker: Owner/Logistics Manager
  Age: 35-55 years
  Tech Comfort: Basic (WhatsApp users)
  Language: English, Telugu

Pain Points:
  - Uncertain truck availability
  - Inconsistent pricing
  - No visibility after dispatch
  - Manual documentation burden
  - Payment reconciliation issues
```

#### Carriers (Supply Side)
```yaml
Profile:
  Ownership: 90% individual truck owners
  Vehicle Type: 10-20 tonne trucks
  Count: ~2,000 trucks on route
  Target: 100 active trucks (5% penetration)
  Trips: 20-25 per month average

Demographics:
  Age: 30-50 years
  Education: 10th-12th standard
  Tech Usage: Smartphone users (basic Android)
  Language: Local languages + Basic English

Pain Points:
  - Irregular bookings (40% idle time)
  - Payment delays (15-30 days average)
  - Empty return trips (30%)
  - Manual documentation
  - No guaranteed daily revenue
```

### 2.2 Secondary Users
- **Drivers**: Execute trips, update status
- **Admin Team**: Monitor operations, handle exceptions
- **Finance Team**: Process payments, reconciliation

---

## 3. Business Goals

### 3.1 Short-term Goals (90 Days)

| Timeframe | Goals | Metrics |
|-----------|-------|---------|
| **30 Days** | Platform Launch | • 5 shippers onboarded<br>• 50 trucks registered<br>• 100 bookings completed<br>• ₹7 lakhs GMV |
| **60 Days** | Growth Phase | • 10 shippers active<br>• 75 trucks active<br>• 300 bookings completed<br>• ₹21 lakhs GMV |
| **90 Days** | Stability | • 15 shippers active<br>• 100 trucks active<br>• 500 bookings completed<br>• ₹35 lakhs GMV |

### 3.2 Long-term Vision (12 Months)
- Expand to 5 corridors
- 1,000+ active trucks
- ₹5 crores monthly GMV
- Break-even achieved
- Ready for Series A funding

---

## 4. Success Metrics

### 4.1 Operational KPIs
```yaml
Efficiency Metrics:
  Booking Time: <3 minutes (vs 30 minutes current)
  Truck Utilization: 80% (vs 60% current)
  Empty Returns: <10% (vs 30% current)
  On-time Delivery: >95%
  POD Collection: 100%

Quality Metrics:
  Booking Success Rate: >95%
  Dispute Rate: <2%
  User Satisfaction: >4.0/5.0
  Driver Retention: >90%
```

### 4.2 Financial KPIs
```yaml
Revenue Metrics:
  GMV Growth: 50% MoM
  Take Rate: 2% commission (after free period)
  Unit Economics: Positive by Month 6
  CAC Recovery: <3 months

Cost Metrics:
  Infrastructure Cost: <₹15,000/month
  Cost per Booking: <₹50
  Customer Support Cost: <5% of revenue
```

### 4.3 Technical KPIs
```yaml
Performance:
  Page Load Time: <3 seconds
  API Response: <500ms (P95)
  Concurrent Users: 100+

Reliability:
  Uptime: >99.5%
  Data Loss: Zero
  Security Incidents: Zero
```

---

## 5. Functional Requirements

### 5.1 Core Features

#### User Management
```yaml
Registration:
  - Mobile OTP-based signup
  - GST verification for shippers
  - Bank account verification for carriers
  - Profile management

Authentication:
  - OTP-based login
  - Session management
  - Role-based access control
```

#### Booking Management
```yaml
Booking Creation:
  - Fixed-rate pricing (₹5/tonne/km)
  - Simple form (6 fields only)
  - Instant price calculation
  - Auto-assignment of trucks

Booking Tracking:
  - Status updates (7 stages)
  - SMS notifications
  - Basic timeline view
  - POD upload
```

#### Fleet Management
```yaml
Truck Registration:
  - Vehicle details capture
  - Driver assignment
  - Availability management
  - Performance tracking

Assignment Logic:
  - Rule-based matching
  - Priority to regular partners
  - Automatic notification
  - Reassignment on rejection
```

#### Payment & Settlement
```yaml
Invoice Generation:
  - Automated post-delivery
  - GST compliant
  - PDF download

Settlement:
  - Manual bank transfer (MVP)
  - 7-day payment cycle
  - Payment confirmation tracking
```

### 5.2 Excluded from MVP
- Bidding system
- Real-time GPS tracking
- Multiple languages
- Mobile apps
- Payment gateway integration
- AI/ML features
- Multi-corridor support

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements
```yaml
Response Times:
  Page Load: <3 seconds on 3G
  API Response: <500ms (P95)
  Database Query: <100ms average

Capacity:
  Concurrent Users: 100
  Bookings/Day: 100
  Data Storage: 50GB (3 months)
```

### 6.2 Scalability Requirements
```yaml
Vertical Scaling:
  Current: 4GB RAM, 2 vCPU
  Scalable to: 16GB RAM, 8 vCPU
  Trigger: >70% resource utilization

Horizontal Scaling:
  Phase 2 consideration
  Database read replicas
  Load balancer ready
```

### 6.3 Reliability Requirements
```yaml
Availability:
  Target: 99.5% uptime
  Planned Downtime: <4 hours/month
  Unplanned Downtime: <30 minutes/month

Recovery:
  RTO: 2 hours
  RPO: 1 hour
  Backup: Daily automated
```

### 6.4 Security Requirements
```yaml
Authentication:
  - OTP-based (no passwords in MVP)
  - Session timeout: 30 minutes
  - Rate limiting: 100 requests/minute

Data Protection:
  - HTTPS everywhere
  - Database encryption at rest
  - PII data masking
  - GDPR basic compliance
```

### 6.5 Usability Requirements
```yaml
Accessibility:
  - Mobile responsive
  - Works on 2G/3G networks
  - Simple UI (minimal training)
  - Clear error messages

Browser Support:
  - Chrome (latest 2 versions)
  - Firefox (latest 2 versions)
  - Mobile browsers
```

---

## 7. Constraints

### 7.1 Business Constraints
```yaml
Budget:
  Development: ₹10 lakhs
  Monthly Operations: ₹50,000
  Infrastructure: ₹15,000/month

Timeline:
  MVP Launch: 6 weeks
  Stabilization: 6 weeks
  Scale Preparation: 6 weeks

Scope:
  Single Corridor: Nalgonda-Miryalguda only
  Single Language: English only
  Single Model: Fixed-rate pricing only
```

### 7.2 Technical Constraints
```yaml
Architecture:
  - Simplified microservices
  - Shared database (MVP compromise)
  - Single server deployment
  - Manual scaling only

Integrations:
  - Basic SMS gateway only
  - No payment gateway (manual)
  - No government APIs (Phase 2)
  - No third-party logistics APIs
```

### 7.3 Regulatory Constraints
```yaml
Compliance:
  - GST invoice generation required
  - E-way bill number capture (manual)
  - Basic KYC for users
  - Data localization (Indian servers)
```

---

## 8. REST API Endpoints Overview

### 8.1 Core Services & Endpoints

```yaml
User Service (Port 3001):
  POST   /api/v1/users/register     - New user registration
  POST   /api/v1/users/login        - User login
  GET    /api/v1/users/{id}         - Get user profile
  PUT    /api/v1/users/{id}         - Update profile
  POST   /api/v1/users/verify-otp   - OTP verification

Fleet Service (Port 3002):
  GET    /api/v1/fleet/trucks       - List trucks
  POST   /api/v1/fleet/trucks       - Register truck
  GET    /api/v1/fleet/trucks/{id}  - Get truck details
  PUT    /api/v1/fleet/trucks/{id}/availability - Update availability
  GET    /api/v1/fleet/drivers      - List drivers

Booking Service (Port 3003):
  POST   /api/v1/bookings           - Create booking
  GET    /api/v1/bookings           - List bookings
  GET    /api/v1/bookings/{id}      - Get booking details
  PUT    /api/v1/bookings/{id}/status - Update status
  POST   /api/v1/bookings/{id}/assign - Assign truck

Route & Tracking Service (Port 3004):
  GET    /api/v1/routes/calculate   - Calculate route
  POST   /api/v1/routes/optimize    - Optimize route
  GET    /api/v1/tracking/{bookingId} - Get tracking info
  PUT    /api/v1/tracking/{bookingId}/status - Update status
  POST   /api/v1/tracking/{bookingId}/pod - Upload POD

Payment Service (Port 3005):
  POST   /api/v1/payments/calculate - Calculate payment
  POST   /api/v1/payments/invoice   - Generate invoice
  GET    /api/v1/payments/{id}      - Get payment details
  PUT    /api/v1/payments/{id}/confirm - Confirm payment
  POST   /api/v1/payments/refund/{id} - Process refund

Admin Service (Port 3006):
  GET    /api/v1/admin/metrics      - Dashboard metrics
  GET    /api/v1/admin/reports      - Generate reports
  GET    /api/v1/admin/logs         - System logs
  POST   /api/v1/admin/notifications - Send notifications
```

### 8.2 API Standards
```yaml
Standards:
  - RESTful design principles
  - JSON request/response
  - JWT authentication
  - Versioned endpoints (/v1/)
  - Consistent error codes
  - Rate limiting enabled
  - CORS configured
  - OpenAPI documentation
```

---

## 9. Microservice Architecture Overview

### 9.1 Architecture Components

```yaml
API Gateway:
  Technology: Nginx
  Responsibilities:
    - Single entry point
    - Request routing
    - Authentication
    - Rate limiting
    - SSL termination
  Port: 80/443

User Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - User registration/login
    - Profile management
    - OTP handling
    - Session management
  Port: 3001

Fleet Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - Truck registration
    - Driver management
    - Availability tracking
    - Assignment logic
  Port: 3002

Booking Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - Booking CRUD
    - Price calculation
    - Status management
    - Assignment orchestration
  Port: 3003

Route & Tracking Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - Route calculation
    - Status updates
    - POD management
    - Timeline tracking
  Port: 3004

Payment Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - Invoice generation
    - Payment tracking
    - Settlement management
    - Financial reports
  Port: 3005

Admin Service:
  Technology: Node.js + Express
  Database: PostgreSQL (shared)
  Responsibilities:
    - Metrics collection
    - Report generation
    - System monitoring
    - Admin operations
  Port: 3006

Event Bus:
  Technology: Redis Pub/Sub (simpler than Kafka for MVP)
  Purpose:
    - Async communication
    - Event broadcasting
    - Service decoupling

Monitoring:
  Technology: PM2 + Custom Dashboards
  Metrics:
    - Service health
    - Response times
    - Error rates
    - Business metrics
```

### 9.2 Communication Patterns
```yaml
Synchronous:
  - REST APIs between services
  - Request-response pattern
  - Timeout: 5 seconds
  - Retry: 3 attempts

Asynchronous:
  - Redis Pub/Sub for events
  - Fire-and-forget for notifications
  - Event sourcing for audit
```

### 9.3 Data Management
```yaml
Database Strategy:
  MVP: Shared PostgreSQL (simplicity)
  Future: Database per service

Caching:
  Redis for:
    - Session storage
    - Temporary data
    - Rate limiting
    - Pub/Sub messaging
```

---

## 10. Risk Assessment

### 10.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Development delays | Medium | High | Buffer time, phased delivery |
| Integration failures | Low | High | Thorough testing, fallbacks |
| Performance issues | Medium | Medium | Load testing, optimization |
| Security vulnerabilities | Low | High | Security audit, best practices |

### 10.2 Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | High | Critical | Incentives, training, support |
| Competition response | Medium | Medium | Fast execution, relationships |
| Regulatory changes | Low | High | Legal consultation, adaptability |
| Payment defaults | Low | Medium | Verification, escrow consideration |

### 10.3 Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Server downtime | Low | High | Monitoring, quick recovery |
| Data loss | Low | Critical | Daily backups, replication |
| Support overload | Medium | Medium | Self-service, documentation |

---

## 11. Success Criteria

### 11.1 MVP Success (Day 90)
✅ Minimum Success (Must achieve all):
- 10+ active shippers
- 75+ active trucks
- 300+ completed trips
- 90%+ delivery success rate
- ₹20 lakhs monthly GMV

### 11.2 Go/No-Go Decision Points

**Day 30**: Continue if 5 shippers, 25 trucks onboarded
**Day 60**: Continue if 200 bookings, ₹15 lakhs GMV achieved
**Day 90**: Scale if all success criteria met, else pivot

---

## 12. Appendices

### 12.1 Glossary
- **GMV**: Gross Merchandise Value
- **POD**: Proof of Delivery
- **MVP**: Minimum Viable Product
- **KYC**: Know Your Customer
- **OTP**: One-Time Password

### 12.2 References
- Market research data
- Competitor analysis
- Technology evaluations
- Regulatory guidelines

---

*Document Version: 1.0*
*Last Updated: February 2024*
*Status: Approved for Development*