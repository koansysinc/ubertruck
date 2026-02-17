# Deployment Guide
## Ubertruck MVP - Production Deployment & Operations
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document provides comprehensive deployment procedures, infrastructure configuration, and operational guidelines for deploying the Ubertruck MVP to production. The guide ensures zero-downtime deployments, proper monitoring, and rapid rollback capabilities.

**Deployment Goals:**
- Zero-downtime deployments
- <5 minute rollback capability
- 99.5% uptime SLA
- Automated deployment pipeline
- Comprehensive monitoring

---

## 1. Infrastructure Overview

### 1.1 Production Architecture

```yaml
Cloud Provider: AWS/DigitalOcean
Region: Mumbai (ap-south-1)

Infrastructure Components:
  Load Balancer:
    - Type: Application Load Balancer
    - SSL termination
    - Health checks
    - Auto-failover

  Application Servers:
    - Type: EC2 t3.medium / Droplet 4GB
    - Count: 1 (MVP), scalable to 3
    - OS: Ubuntu 22.04 LTS
    - Runtime: Node.js 20 LTS

  Database:
    - Type: RDS PostgreSQL 15 / Managed Database
    - Size: db.t3.small (2 vCPU, 2GB RAM)
    - Storage: 100GB SSD
    - Backup: Daily automated

  Cache:
    - Type: ElastiCache Redis 7 / Managed Redis
    - Size: cache.t3.micro
    - Memory: 1GB

  Storage:
    - Type: S3 / Spaces
    - Purpose: POD images, documents
    - CDN: CloudFront / CloudFlare

  Monitoring:
    - CloudWatch / Custom metrics
    - PM2 Plus
    - Application logs
```

### 1.2 Network Architecture

```yaml
VPC Configuration:
  CIDR: 10.0.0.0/16

  Subnets:
    Public Subnet A:
      CIDR: 10.0.1.0/24
      AZ: ap-south-1a
      Components: Load Balancer, NAT Gateway

    Public Subnet B:
      CIDR: 10.0.2.0/24
      AZ: ap-south-1b
      Components: Load Balancer (backup)

    Private Subnet A:
      CIDR: 10.0.10.0/24
      AZ: ap-south-1a
      Components: Application servers

    Private Subnet B:
      CIDR: 10.0.11.0/24
      AZ: ap-south-1b
      Components: Database (primary)

Security Groups:
  ALB-SG:
    - Inbound: 80, 443 from 0.0.0.0/0
    - Outbound: All traffic

  App-SG:
    - Inbound: 3001-3006 from ALB-SG
    - Outbound: All traffic

  DB-SG:
    - Inbound: 5432 from App-SG
    - Outbound: None

  Redis-SG:
    - Inbound: 6379 from App-SG
    - Outbound: None
```

### 1.3 Domain & SSL Configuration

```yaml
Domain Setup:
  Primary: ubertruck.in
  Subdomains:
    - api.ubertruck.in (API Gateway)
    - app.ubertruck.in (Web Application)
    - admin.ubertruck.in (Admin Panel)
    - docs.ubertruck.in (API Documentation)

SSL Certificates:
  Provider: Let's Encrypt
  Type: Wildcard (*.ubertruck.in)
  Renewal: Auto-renewal via Certbot

DNS Configuration:
  Provider: CloudFlare
  Records:
    A: ubertruck.in → Load Balancer IP
    CNAME: www → ubertruck.in
    CNAME: api → Load Balancer
    MX: Email records
    TXT: SPF, DKIM records
```

---

## 2. Pre-Deployment Setup

### 2.1 Prerequisites Checklist

```yaml
Infrastructure:
  □ AWS/DO account created
  □ VPC and subnets configured
  □ Security groups created
  □ Load balancer provisioned
  □ EC2/Droplet instances launched
  □ RDS/Database created
  □ Redis cluster ready
  □ S3/Spaces bucket created
  □ Domain registered
  □ SSL certificates obtained

Software:
  □ Git repository access
  □ Docker installed
  □ Node.js 20 installed
  □ PM2 installed
  □ Nginx configured
  □ PostgreSQL client tools
  □ Redis client tools
  □ Monitoring agents installed

Access & Credentials:
  □ SSH keys configured
  □ Database passwords set
  □ API keys obtained
  □ Environment variables prepared
  □ Backup encryption keys
  □ Monitoring dashboard access
```

### 2.2 Environment Variables

```bash
# Production Environment Variables (.env.production)

# Application
NODE_ENV=production
PORT=3001
API_VERSION=v1
JWT_SECRET=<secure-random-string>
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/ubertruck_prod
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000

# Redis
REDIS_URL=redis://elasticache-endpoint:6379
REDIS_PASSWORD=<redis-password>
REDIS_DB=0

# Services Ports
USER_SERVICE_PORT=3001
FLEET_SERVICE_PORT=3002
BOOKING_SERVICE_PORT=3003
ROUTE_SERVICE_PORT=3004
PAYMENT_SERVICE_PORT=3005
ADMIN_SERVICE_PORT=3006

# External APIs
SMS_API_KEY=<2factor-api-key>
SMS_SENDER_ID=UBTRUK
MAPS_API_KEY=<google-maps-key>
WEATHER_API_KEY=<openweather-key>

# AWS/Storage
S3_BUCKET=ubertruck-prod
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>

# Monitoring
PM2_PUBLIC_KEY=<pm2-public-key>
PM2_SECRET_KEY=<pm2-secret-key>
SENTRY_DSN=<sentry-dsn>

# Feature Flags
ENABLE_SMS=true
ENABLE_EMAIL=true
ENABLE_PAYMENT_GATEWAY=false
MAINTENANCE_MODE=false
```

### 2.3 Server Initialization Script

```bash
#!/bin/bash
# Server initialization script (init-server.sh)

echo "=== Ubertruck MVP Server Initialization ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  nginx \
  postgresql-client \
  redis-tools \
  htop \
  unzip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Install Docker (optional for containerized deployment)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Create application directory
sudo mkdir -p /opt/ubertruck
sudo chown ubuntu:ubuntu /opt/ubertruck

# Setup log directories
sudo mkdir -p /var/log/ubertruck
sudo chown ubuntu:ubuntu /var/log/ubertruck

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001:3006/tcp
sudo ufw --force enable

# Install SSL certificate
sudo snap install --classic certbot
sudo certbot certonly --standalone -d ubertruck.in -d *.ubertruck.in

echo "=== Server initialization complete ==="
```

---

## 3. Application Deployment

### 3.1 Deployment Process

```yaml
Deployment Steps:
  1. Code Preparation:
     - Git tag release
     - Update version numbers
     - Update changelog
     - Create release notes

  2. Build Process:
     - Install dependencies
     - Run tests
     - Build production bundle
     - Generate source maps

  3. Database Migration:
     - Backup current database
     - Run migration scripts
     - Verify schema changes
     - Update seed data

  4. Deployment:
     - Upload build to servers
     - Update environment variables
     - Start/restart services
     - Verify health checks

  5. Verification:
     - Run smoke tests
     - Check monitoring dashboards
     - Verify key functionalities
     - Monitor error rates
```

### 3.2 Deployment Script

```bash
#!/bin/bash
# Deployment script (deploy.sh)

set -e

echo "🚀 Starting Ubertruck MVP Deployment"

# Configuration
REPO_URL="https://github.com/ubertruck/mvp.git"
DEPLOY_DIR="/opt/ubertruck"
BRANCH="main"
TAG=$1

# Validate tag
if [ -z "$TAG" ]; then
  echo "❌ Error: Please provide a release tag"
  echo "Usage: ./deploy.sh v1.0.0"
  exit 1
fi

# Deployment function
deploy_service() {
  SERVICE_NAME=$1
  SERVICE_PORT=$2

  echo "📦 Deploying $SERVICE_NAME..."

  cd $DEPLOY_DIR/$SERVICE_NAME

  # Install dependencies
  npm ci --production

  # Run database migrations (if applicable)
  if [ "$SERVICE_NAME" == "user-service" ]; then
    npm run migrate:production
  fi

  # Start/restart with PM2
  pm2 restart ecosystem.config.js --only $SERVICE_NAME

  # Wait for health check
  sleep 5
  curl -f http://localhost:$SERVICE_PORT/health || exit 1

  echo "✅ $SERVICE_NAME deployed successfully"
}

# Pull latest code
cd $DEPLOY_DIR
git fetch --all --tags
git checkout tags/$TAG

# Deploy each service
deploy_service "user-service" 3001
deploy_service "fleet-service" 3002
deploy_service "booking-service" 3003
deploy_service "route-service" 3004
deploy_service "payment-service" 3005
deploy_service "admin-service" 3006

# Deploy frontend
echo "📦 Deploying frontend..."
cd $DEPLOY_DIR/frontend
npm ci --production
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo nginx -s reload
echo "✅ Frontend deployed successfully"

# Save PM2 configuration
pm2 save

echo "🎉 Deployment complete! Version: $TAG"
```

### 3.3 PM2 Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'user-service',
      script: './user-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/ubertruck/user-service-error.log',
      out_file: '/var/log/ubertruck/user-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 3,
      min_uptime: 10000,
      max_memory_restart: '500M'
    },
    {
      name: 'fleet-service',
      script: './fleet-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/ubertruck/fleet-service-error.log',
      out_file: '/var/log/ubertruck/fleet-service-out.log',
      max_memory_restart: '500M'
    },
    {
      name: 'booking-service',
      script: './booking-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/var/log/ubertruck/booking-service-error.log',
      out_file: '/var/log/ubertruck/booking-service-out.log',
      max_memory_restart: '500M'
    },
    {
      name: 'route-service',
      script: './route-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: '/var/log/ubertruck/route-service-error.log',
      out_file: '/var/log/ubertruck/route-service-out.log',
      max_memory_restart: '500M'
    },
    {
      name: 'payment-service',
      script: './payment-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: '/var/log/ubertruck/payment-service-error.log',
      out_file: '/var/log/ubertruck/payment-service-out.log',
      max_memory_restart: '500M'
    },
    {
      name: 'admin-service',
      script: './admin-service/dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      error_file: '/var/log/ubertruck/admin-service-error.log',
      out_file: '/var/log/ubertruck/admin-service-out.log',
      max_memory_restart: '500M'
    }
  ]
};
```

---

## 4. Database Deployment

### 4.1 Database Migration

```bash
#!/bin/bash
# Database migration script (migrate-db.sh)

set -e

echo "🗄️ Starting database migration"

# Configuration
DB_HOST="rds-endpoint.amazonaws.com"
DB_NAME="ubertruck_prod"
DB_USER="ubertruck_admin"
BACKUP_DIR="/opt/backups"

# Create backup
echo "📦 Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"

# Run migrations
echo "🔄 Running migrations..."
cd /opt/ubertruck/user-service
npm run migrate:production

# Verify migration
echo "✔️ Verifying migration..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

echo "✅ Database migration complete"
```

### 4.2 Database Initialization

```sql
-- Initial database setup (init-db.sql)

-- Create database
CREATE DATABASE ubertruck_prod;

-- Connect to database
\c ubertruck_prod;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS fleet;
CREATE SCHEMA IF NOT EXISTS booking;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS tracking;
CREATE SCHEMA IF NOT EXISTS admin;

-- Install extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create read-only user for analytics
CREATE USER ubertruck_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE ubertruck_prod TO ubertruck_readonly;
GRANT USAGE ON SCHEMA core, fleet, booking, payment, tracking, admin TO ubertruck_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA core, fleet, booking, payment, tracking, admin TO ubertruck_readonly;

-- Performance tuning
ALTER DATABASE ubertruck_prod SET shared_buffers = '256MB';
ALTER DATABASE ubertruck_prod SET effective_cache_size = '1GB';
ALTER DATABASE ubertruck_prod SET maintenance_work_mem = '64MB';
ALTER DATABASE ubertruck_prod SET checkpoint_completion_target = 0.9;
ALTER DATABASE ubertruck_prod SET wal_buffers = '7864kB';
ALTER DATABASE ubertruck_prod SET default_statistics_target = 100;
ALTER DATABASE ubertruck_prod SET random_page_cost = 1.1;
```

---

## 5. Web Server Configuration

### 5.1 Nginx Configuration

```nginx
# /etc/nginx/sites-available/ubertruck

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ubertruck.in www.ubertruck.in api.ubertruck.in;
    return 301 https://$server_name$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name ubertruck.in www.ubertruck.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ubertruck.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ubertruck.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Root directory
    root /var/www/html;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API Gateway
server {
    listen 443 ssl http2;
    server_name api.ubertruck.in;

    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/ubertruck.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ubertruck.in/privkey.pem;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    # API routing to microservices
    location /api/v1/users {
        proxy_pass http://localhost:3001;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/fleet {
        proxy_pass http://localhost:3002;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/bookings {
        proxy_pass http://localhost:3003;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/routes {
        proxy_pass http://localhost:3004;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/tracking {
        proxy_pass http://localhost:3004;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/payments {
        proxy_pass http://localhost:3005;
        include /etc/nginx/proxy_params;
    }

    location /api/v1/admin {
        proxy_pass http://localhost:3006;
        include /etc/nginx/proxy_params;
    }

    # Health check endpoint
    location /health {
        access_log off;
        default_type application/json;
        return 200 '{"status":"healthy"}';
    }
}
```

### 5.2 Proxy Parameters

```nginx
# /etc/nginx/proxy_params

proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Request-ID $request_id;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffering
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;

# Error handling
proxy_next_upstream error timeout http_500 http_502 http_503;
proxy_next_upstream_tries 2;
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run security audit
        run: npm audit --production

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - uses: actions/checkout@v3

      - name: Get version
        id: get_version
        run: echo ::set-output name=VERSION::${GITHUB_REF#refs/tags/}

      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/ubertruck
            ./deploy.sh ${{ steps.get_version.outputs.VERSION }}

      - name: Verify deployment
        run: |
          sleep 30
          curl -f https://api.ubertruck.in/health

      - name: Send notification
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment ${{ steps.get_version.outputs.VERSION }} ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 6.2 Rollback Procedure

```bash
#!/bin/bash
# Rollback script (rollback.sh)

set -e

echo "⚠️ Starting rollback procedure"

# Configuration
DEPLOY_DIR="/opt/ubertruck"
PREVIOUS_TAG=$1

if [ -z "$PREVIOUS_TAG" ]; then
  echo "❌ Error: Please provide the previous release tag"
  echo "Usage: ./rollback.sh v1.0.0"
  exit 1
fi

# Confirm rollback
read -p "Are you sure you want to rollback to $PREVIOUS_TAG? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled"
  exit 0
fi

# Create backup of current state
echo "📦 Creating backup of current state..."
tar -czf /opt/backups/rollback_backup_$(date +%Y%m%d_%H%M%S).tar.gz $DEPLOY_DIR

# Rollback code
echo "🔄 Rolling back to $PREVIOUS_TAG..."
cd $DEPLOY_DIR
git fetch --all --tags
git checkout tags/$PREVIOUS_TAG

# Rollback database (if needed)
echo "🗄️ Check if database rollback is needed..."
# Add database rollback logic here if schema changed

# Restart services
echo "🔄 Restarting services..."
pm2 restart all

# Verify rollback
sleep 10
for port in 3001 3002 3003 3004 3005 3006; do
  curl -f http://localhost:$port/health || {
    echo "❌ Service on port $port is not healthy"
    exit 1
  }
done

echo "✅ Rollback to $PREVIOUS_TAG completed successfully"

# Send notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"⚠️ Production rolled back to $PREVIOUS_TAG\"}"
```

---

## 7. Monitoring & Logging

### 7.1 Monitoring Setup

```yaml
Monitoring Stack:

PM2 Plus:
  - Real-time monitoring
  - Error tracking
  - Performance metrics
  - Custom metrics
  - Alert notifications

CloudWatch/Custom Metrics:
  System Metrics:
    - CPU utilization
    - Memory usage
    - Disk I/O
    - Network traffic

  Application Metrics:
    - Request rate
    - Response time
    - Error rate
    - Active users

  Business Metrics:
    - Bookings/hour
    - Revenue/day
    - Truck utilization
    - User growth

Health Checks:
  Endpoints:
    - /health - Basic health
    - /health/ready - Readiness probe
    - /health/live - Liveness probe

  Frequency: Every 30 seconds
  Timeout: 5 seconds
  Unhealthy threshold: 3
```

### 7.2 Logging Configuration

```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File output
    new winston.transports.File({
      filename: `/var/log/ubertruck/${process.env.SERVICE_NAME}-error.log`,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: `/var/log/ubertruck/${process.env.SERVICE_NAME}-combined.log`,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Log rotation
const DailyRotateFile = require('winston-daily-rotate-file');
logger.add(new DailyRotateFile({
  filename: `/var/log/ubertruck/${process.env.SERVICE_NAME}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
}));
```

### 7.3 Alert Configuration

```yaml
Alert Rules:

Critical Alerts (Immediate):
  - Service down
  - Database unreachable
  - Error rate >10%
  - Response time >5s
  - Disk space <10%

  Channels: Phone call, SMS, Slack

High Priority (5 minutes):
  - CPU >90%
  - Memory >90%
  - Error rate >5%
  - Queue backlog >1000

  Channels: Email, Slack

Medium Priority (15 minutes):
  - CPU >80%
  - Response time >2s
  - Failed background jobs
  - Low cache hit rate

  Channels: Slack

Low Priority (Daily):
  - Disk usage >70%
  - SSL certificate expiry <30 days
  - Dependency updates available

  Channels: Email digest
```

---

## 8. Security Configuration

### 8.1 Security Hardening

```bash
#!/bin/bash
# Security hardening script

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install fail2ban
apt install fail2ban -y
systemctl enable fail2ban

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

# Enable automatic security updates
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades

# Setup audit logging
apt install auditd -y
systemctl enable auditd

# Secure shared memory
echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab

# Kernel hardening
cat >> /etc/sysctl.conf <<EOF
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_broadcasts = 1
EOF

sysctl -p
```

### 8.2 SSL/TLS Configuration

```bash
# Generate strong DH parameters
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Nginx SSL configuration
cat > /etc/nginx/snippets/ssl-params.conf <<EOF
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_dhparam /etc/ssl/certs/dhparam.pem;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_ecdh_curve secp384r1;
ssl_session_timeout 10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
EOF
```

---

## 9. Backup & Recovery

### 9.1 Backup Strategy

```yaml
Backup Schedule:

Database:
  Full Backup:
    Frequency: Daily at 2 AM
    Retention: 30 days
    Location: S3 bucket

  Incremental:
    Frequency: Every 6 hours
    Retention: 7 days

  Transaction Logs:
    Frequency: Continuous
    Retention: 3 days

Application Files:
  Code:
    Method: Git tags
    Backup: GitHub

  Uploaded Files:
    Frequency: Daily
    Location: S3 with versioning
    Retention: 90 days

  Configuration:
    Frequency: On change
    Location: Encrypted S3
    Versioning: Enabled

Monitoring Data:
  Logs:
    Retention: 30 days
    Archive: S3 Glacier

  Metrics:
    Retention: 90 days
```

### 9.2 Backup Script

```bash
#!/bin/bash
# Automated backup script (backup.sh)

set -e

# Configuration
BACKUP_DIR="/opt/backups"
S3_BUCKET="ubertruck-backups"
DB_HOST="rds-endpoint"
DB_NAME="ubertruck_prod"
DB_USER="ubertruck_admin"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "📦 Backing up database..."
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --format=custom \
  --compress=9 \
  > $BACKUP_DIR/db_$DATE.dump

# Compress application files
echo "📦 Backing up application files..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  /opt/ubertruck

# Backup configuration
echo "📦 Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /etc/nginx/sites-available/ubertruck \
  /opt/ubertruck/.env.production \
  /opt/ubertruck/ecosystem.config.js

# Encrypt backups
echo "🔐 Encrypting backups..."
for file in $BACKUP_DIR/*_$DATE.*; do
  gpg --cipher-algo AES256 \
    --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --batch --yes \
    --output "$file.gpg" \
    --symmetric "$file"
  rm "$file"
done

# Upload to S3
echo "☁️ Uploading to S3..."
aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/$(date +%Y/%m/%d)/ \
  --exclude "*" \
  --include "*_$DATE.*.gpg"

# Clean up old local backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.gpg" -mtime +7 -delete

echo "✅ Backup completed successfully"

# Send notification
curl -X POST $MONITORING_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{"text":"✅ Production backup completed successfully"}'
```

### 9.3 Recovery Procedure

```bash
#!/bin/bash
# Disaster recovery script (restore.sh)

set -e

echo "⚠️ Starting disaster recovery..."

# Configuration
BACKUP_DATE=$1
S3_BUCKET="ubertruck-backups"
RESTORE_DIR="/opt/restore"

if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: ./restore.sh YYYYMMDD_HHMMSS"
  exit 1
fi

# Download backups from S3
echo "📥 Downloading backups..."
mkdir -p $RESTORE_DIR
aws s3 cp s3://$S3_BUCKET/ $RESTORE_DIR \
  --recursive \
  --exclude "*" \
  --include "*_$BACKUP_DATE.*.gpg"

# Decrypt backups
echo "🔓 Decrypting backups..."
for file in $RESTORE_DIR/*.gpg; do
  gpg --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --batch --yes \
    --output "${file%.gpg}" \
    --decrypt "$file"
done

# Restore database
echo "🗄️ Restoring database..."
pg_restore \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --clean \
  --if-exists \
  $RESTORE_DIR/db_$BACKUP_DATE.dump

# Restore application files
echo "📦 Restoring application files..."
tar -xzf $RESTORE_DIR/app_$BACKUP_DATE.tar.gz -C /

# Restore configuration
echo "⚙️ Restoring configuration..."
tar -xzf $RESTORE_DIR/config_$BACKUP_DATE.tar.gz -C /

# Restart services
echo "🔄 Restarting services..."
pm2 restart all
nginx -s reload

echo "✅ Recovery completed successfully"
```

---

## 10. Operational Procedures

### 10.1 Daily Operations Checklist

```yaml
Morning Checks (9 AM):
  □ Check system health dashboard
  □ Review overnight alerts
  □ Check backup completion
  □ Review error logs
  □ Check disk space
  □ Verify service status
  □ Review performance metrics
  □ Check scheduled jobs status

Afternoon Checks (2 PM):
  □ Monitor active users
  □ Check booking success rate
  □ Review payment settlements
  □ Check API response times
  □ Monitor database connections
  □ Review cache hit rates

Evening Checks (6 PM):
  □ Review daily metrics
  □ Check for security alerts
  □ Verify backup schedule
  □ Review resource utilization
  □ Check for pending updates
  □ Update status report
```

### 10.2 Maintenance Procedures

```yaml
Scheduled Maintenance:

Weekly:
  - Security updates check
  - Log rotation verification
  - Cache cleanup
  - Database vacuum
  - Dependency updates review

Monthly:
  - SSL certificate check
  - Full system backup test
  - Disaster recovery drill
  - Performance review
  - Capacity planning review

Quarterly:
  - Security audit
  - Database optimization
  - Infrastructure review
  - Cost optimization
  - Documentation update
```

### 10.3 Incident Response

```yaml
Incident Response Plan:

Detection:
  - Automated monitoring alerts
  - User reports
  - Manual checks

Classification:
  P1 - Critical: System down
  P2 - High: Major feature broken
  P3 - Medium: Performance degradation
  P4 - Low: Minor issues

Response Times:
  P1: Immediate (24x7)
  P2: 30 minutes (business hours)
  P3: 2 hours
  P4: Next business day

Escalation:
  L1: DevOps Engineer
  L2: Technical Lead
  L3: CTO
  L4: External vendor

Communication:
  - Status page update
  - Customer notification
  - Internal updates
  - Post-mortem report
```

---

## Appendices

### Appendix A: Troubleshooting Guide

```yaml
Common Issues:

Service Won't Start:
  Symptoms: PM2 shows error status
  Check:
    - Port already in use
    - Environment variables
    - Database connectivity
    - Log files for errors
  Solution:
    - Kill process using port
    - Verify .env file
    - Check database credentials
    - Fix code errors

High Response Time:
  Symptoms: API responses >1s
  Check:
    - Database query performance
    - Memory usage
    - CPU utilization
    - Network latency
  Solution:
    - Optimize queries
    - Increase resources
    - Enable caching
    - Scale horizontally

Database Connection Errors:
  Symptoms: "Connection refused" errors
  Check:
    - Database status
    - Connection pool exhaustion
    - Network connectivity
    - Security groups
  Solution:
    - Restart database
    - Increase pool size
    - Check network rules
    - Update security groups
```

### Appendix B: Emergency Contacts

```yaml
Support Contacts:

Technical Team:
  DevOps Lead: +91-XXXXXXXXXX
  Backend Lead: +91-XXXXXXXXXX
  Database Admin: +91-XXXXXXXXXX
  On-call Engineer: +91-XXXXXXXXXX

Vendors:
  AWS Support: Premium support case
  Domain Registrar: support@registrar.com
  SMS Provider: +91-XXXXXXXXXX
  SSL Provider: Let's Encrypt community

Management:
  CTO: +91-XXXXXXXXXX
  VP Engineering: +91-XXXXXXXXXX
  Customer Success: +91-XXXXXXXXXX
```

### Appendix C: Resource URLs

```yaml
Important URLs:

Production:
  Application: https://ubertruck.in
  API: https://api.ubertruck.in
  Admin: https://admin.ubertruck.in
  Docs: https://docs.ubertruck.in

Monitoring:
  PM2 Plus: https://app.pm2.io
  CloudWatch: https://console.aws.amazon.com/cloudwatch
  Status Page: https://status.ubertruck.in

Documentation:
  GitHub: https://github.com/ubertruck/mvp
  API Docs: https://docs.ubertruck.in/api
  Runbooks: Internal wiki

Tools:
  Slack: ubertruck.slack.com
  Jira: ubertruck.atlassian.net
  Confluence: ubertruck.atlassian.net/wiki
```

---

*Document Version: 1.0*
*Last Updated: February 2024*
*Status: Approved for Production*
*Next Review: Monthly*