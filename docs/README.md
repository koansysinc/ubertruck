# UberTruck MVP

## 🚛 Logistics Platform for Nalgonda-Miryalguda Corridor

**Version:** 1.0.0-FROZEN
**Status:** MVP Development Phase
**Corridor:** Nalgonda ↔️ Miryalguda (~40 km)
**Pricing:** ₹5/tonne/km (FROZEN)

## 📋 Project Overview

UberTruck is a logistics platform connecting shippers with truck operators in the Nalgonda-Miryalguda corridor. The MVP focuses on the stone crushing and construction material transport market segment.

### Key Features
- 📱 **OTP-based Authentication** (6-digit, 5-minute expiry)
- 🚚 **Fleet Management** (10T, 15T, 20T trucks only)
- 📦 **Booking System** with automatic truck assignment
- 💰 **Fixed Pricing** at ₹5/tonne/km + 18% GST
- 📄 **Invoice Generation** with GST compliance
- 🗺️ **Status Tracking** (no GPS in MVP)

## 🏗️ Architecture

```
├── User Service       → Authentication & profiles
├── Fleet Service      → Truck & driver management
├── Booking Service    → Booking creation & assignment
├── Route Service      → Corridor validation
├── Payment Service    → Invoice & manual payments
└── Admin Service      → Dashboard & reports
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15
- Redis 7

### Installation

1. **Clone the repository**
   ```bash
   cd /home/koans/projects/ubertruck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb ubertruck_db

   # Run schema
   psql ubertruck_db < scripts/db/schema.sql

   # Load seed data (optional)
   psql ubertruck_db < scripts/db/seed.sql
   ```

5. **Start Redis**
   ```bash
   redis-server
   ```

6. **Start the server**
   ```bash
   npm run dev  # Development mode with nodemon
   # OR
   npm start    # Production mode
   ```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
GET /api/v1
```

### Authentication
```
POST /api/v1/users/register       → Register new user
POST /api/v1/users/login          → Request OTP
POST /api/v1/users/verify-otp     → Verify OTP & get JWT
POST /api/v1/users/resend-otp     → Resend OTP
```

### User Profile
```
GET  /api/v1/users/profile        → Get profile (auth required)
POST /api/v1/users/profile/shipper → Create shipper profile
POST /api/v1/users/profile/carrier → Create carrier profile
POST /api/v1/users/profile/driver  → Create driver profile
```

### Other Services (Under Development)
```
/api/v1/fleet      → Fleet management
/api/v1/bookings   → Booking operations
/api/v1/routes     → Route calculations
/api/v1/payments   → Payment processing
/api/v1/admin      → Admin dashboard
```

## 🧪 Testing

### Test Credentials

**Shippers:**
- 9876543210 - Nalgonda Stone Crushers (active)
- 9876543211 - Miryalguda Construction Co (active)

**Carriers:**
- 9876543213 - Telangana Logistics (active)
- 9876543214 - Quick Transport Services (active)

**Drivers:**
- 9876543215 - Ravi Kumar (active)
- 9876543216 - Anil Sharma (active)

**Admin:**
- 9999999999 - System Admin

### API Testing Example

1. **Register a new shipper:**
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543220",
    "role": "shipper"
  }'
```

2. **Verify OTP (use OTP from response in dev mode):**
```bash
curl -X POST http://localhost:3000/api/v1/users/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543220",
    "otp": "123456"
  }'
```

3. **Use the JWT token for authenticated requests:**
```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Database Schema

### Core Tables
- **users** - Authentication and roles
- **shippers** - Shipper profiles
- **carriers** - Carrier/fleet owner profiles
- **drivers** - Driver details
- **trucks** - Vehicle registry
- **bookings** - Shipment bookings
- **payments** - Invoice and payment records

## 🔒 Frozen Requirements (DO NOT CHANGE)

1. **Pricing:** ₹5/tonne/km (no dynamic pricing)
2. **Fleet:** 10T, 15T, 20T only (no 25T-40T)
3. **OTP:** 6 digits, 5 minutes validity
4. **Tracking:** Status-based only (no real-time GPS)
5. **Payment:** Manual process (no payment gateway)
6. **Corridor:** Nalgonda-Miryalguda only

## 📁 Project Structure

```
ubertruck/
├── src/
│   ├── index.js           → Main application entry
│   ├── controllers/       → Business logic
│   ├── models/           → Database models
│   ├── routes/           → API routes
│   ├── middleware/       → Auth, validation
│   ├── utils/            → Helper functions
│   ├── config/           → Configuration
│   └── database/         → DB connection
├── scripts/
│   └── db/              → Database scripts
├── tests/               → Test files
├── docs/                → Documentation
└── config/              → Config files
```

## 🛠️ Development Commands

```bash
npm run dev          → Start development server
npm run test         → Run tests
npm run test:coverage → Test coverage report
npm run lint         → Lint code
npm run format       → Format code
```

## 📈 Monitoring

- Health endpoint: `/health`
- Logs: Check console output and log files
- Database: Connect to PostgreSQL for queries
- Cache: Use Redis CLI to monitor cache

## 🚨 Troubleshooting

### Database connection issues:
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection
psql -U ubertruck_user -d ubertruck_db
```

### Redis connection issues:
```bash
# Check Redis is running
redis-cli ping
```

### Port already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process or use different port in .env
```

## 📝 Change Request Status

**CR-2024-001:** Multi-corridor support - **REJECTED**
All changes must maintain the FROZEN requirements.

## 🤝 Support

For issues or questions about the implementation, check:
- `/docs` folder for detailed documentation
- `/scripts/validate-context.sh` to verify requirements
- `/scripts/check-guardrails.sh` for compliance

## 📄 License

Proprietary - UberTruck MVP 2024

---

**Remember:** This is an MVP focused on the Nalgonda-Miryalguda corridor with frozen requirements. Do not add features beyond the specified scope.