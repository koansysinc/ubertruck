# UberTruck MVP - Deployment Checklist

**Phase 1 Complete - Pre-Production Deployment Guide**

---

## Prerequisites

### Environment Setup
- [ ] Node.js ≥ 20.0.0 installed
- [ ] npm ≥ 9.0.0 installed
- [ ] Git repository initialized
- [ ] Environment variables configured

### Backend Requirements
- [ ] PostgreSQL database running
- [ ] Redis cache available
- [ ] API server deployed and accessible
- [ ] HTTPS/SSL certificates configured

---

## 1. Environment Configuration

### Required Environment Variables
Create `.env` file with:

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://api.ubertruck.com
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_SOCIAL_LOGIN=false
REACT_APP_ENABLE_OFFLINE_MODE=false

# Analytics (Optional)
REACT_APP_GOOGLE_ANALYTICS_ID=
REACT_APP_SENTRY_DSN=

# Environment
NODE_ENV=production
```

Checklist:
- [ ] `.env.production` file created
- [ ] All required variables set
- [ ] No sensitive data in `.env` (use CI/CD secrets)
- [ ] API base URL points to production
- [ ] Timeout values appropriate for production

---

## 2. Code Quality Checks

### Pre-Deployment Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Check TypeScript compilation
npx tsc --noEmit

# Lint code (if configured)
npm run lint
```

Checklist:
- [ ] All 65 tests passing
- [ ] No TypeScript errors
- [ ] No console.log statements in code
- [ ] No hardcoded API URLs or tokens
- [ ] All validation patterns from OpenAPI spec implemented

---

## 3. Build Process

### Production Build
```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Check build output
ls -lh build/
```

Checklist:
- [ ] Build completes without errors
- [ ] Bundle size reasonable (< 1MB for main chunk)
- [ ] Source maps generated (for debugging)
- [ ] No development-only code in bundle
- [ ] Assets minified and optimized

---

## 4. Security Audit

### Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix auto-fixable issues
npm audit fix

# Review manual fixes
npm audit fix --force  # Only if necessary
```

Checklist:
- [ ] No high/critical vulnerabilities
- [ ] Dependencies up to date
- [ ] JWT tokens stored securely (not in code)
- [ ] API keys not exposed in frontend
- [ ] HTTPS enforced for all API calls
- [ ] Input validation on all forms
- [ ] XSS protection implemented
- [ ] CORS configured properly on backend

---

## 5. API Integration Verification

### API Endpoint Tests
Test all 17 endpoints:

**Authentication:**
- [ ] POST /auth/login - Send OTP
- [ ] POST /auth/verify-otp - Verify OTP
- [ ] POST /auth/refresh - Refresh token

**Users:**
- [ ] GET /users/profile - Get user profile
- [ ] PUT /users/profile - Update profile

**Bookings:**
- [ ] POST /bookings - Create booking
- [ ] GET /bookings - List bookings
- [ ] GET /bookings/{id} - Get booking details
- [ ] PUT /bookings/{id}/cancel - Cancel booking

**Payments:**
- [ ] POST /payments/calculate - Calculate price
- [ ] POST /payments/process - Process payment

**Tracking:**
- [ ] GET /bookings/{id}/tracking - Real-time tracking
- [ ] GET /bookings/{id}/status - Booking status

**Carriers:**
- [ ] GET /carriers - List carriers
- [ ] GET /carriers/{id} - Carrier details

### API Validation
- [ ] All requests include Authorization header
- [ ] All requests include X-Request-ID (UUID)
- [ ] Token refresh on 401 works
- [ ] Error responses include requestId
- [ ] Retry logic works on network errors

---

## 6. User Flow Testing

### Manual Testing Scenarios

**Authentication Flow:**
1. [ ] Enter valid Indian phone number
2. [ ] Receive OTP (check backend logs if not SMS)
3. [ ] Enter correct OTP → authenticated
4. [ ] Try wrong OTP → error shown
5. [ ] Resend OTP → new code sent
6. [ ] Complete profile (optional)
7. [ ] Logout → redirected to login

**Booking Flow:**
8. [ ] Enter pickup location (address, pincode, lat/lng)
9. [ ] Enter delivery location
10. [ ] Select pickup time (must be >= now + 1 hour)
11. [ ] Select cargo type
12. [ ] Enter weight (0.1-50 tonnes)
13. [ ] Enter description
14. [ ] Enter pickup contact (name + phone)
15. [ ] Enter delivery contact
16. [ ] Price calculated automatically
17. [ ] GST breakdown shown (CGST/SGST or IGST)
18. [ ] Review booking summary
19. [ ] Create booking → success
20. [ ] Booking ID received

**Edge Cases:**
21. [ ] Network error during API call → retry works
22. [ ] Token expires during session → auto-refresh
23. [ ] Price expires before booking → recalculate button shown
24. [ ] Invalid phone number → validation error
25. [ ] Weight out of range → validation error

---

## 7. Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

Checklist:
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Images optimized and compressed
- [ ] Unused dependencies removed
- [ ] Tree shaking enabled
- [ ] Gzip compression enabled on server

### Runtime Performance
- [ ] Initial load < 3 seconds (on 3G)
- [ ] Time to interactive < 5 seconds
- [ ] Lighthouse score > 80 (Performance)
- [ ] No memory leaks in dev tools
- [ ] Smooth animations (60 FPS)

---

## 8. Browser Compatibility

### Supported Browsers
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (414x896)

---

## 9. Deployment Steps

### Static Hosting (Vercel/Netlify)

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Netlify:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

Checklist:
- [ ] Build command: `npm run build`
- [ ] Publish directory: `build`
- [ ] Environment variables added in dashboard
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled
- [ ] Redirects configured for SPA
- [ ] _redirects file for client-side routing:
  ```
  /*    /index.html   200
  ```

---

## 10. Post-Deployment Verification

### Smoke Tests
- [ ] Homepage loads
- [ ] Login flow works
- [ ] Booking flow works
- [ ] API calls succeed
- [ ] Errors handled gracefully
- [ ] Logout works

### Monitoring Setup
- [ ] Error tracking (Sentry/Bugsnag)
- [ ] Analytics (Google Analytics/Mixpanel)
- [ ] Performance monitoring (Lighthouse CI)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] API response time monitoring

### Logging
- [ ] Frontend errors logged
- [ ] API errors logged with requestId
- [ ] User actions tracked (optional)
- [ ] Console.log removed from production build

---

## 11. Rollback Plan

### Backup Strategy
- [ ] Previous build artifacts saved
- [ ] Database backup before deploy
- [ ] Git tag for release version
- [ ] Deployment automation tested

### Rollback Procedure
If deployment fails:
1. [ ] Identify issue from logs
2. [ ] Roll back to previous deployment
3. [ ] Verify rollback successful
4. [ ] Fix issue in development
5. [ ] Re-deploy after testing

---

## 12. Documentation

### User Documentation
- [ ] User guide for booking flow
- [ ] FAQ document
- [ ] Support contact information
- [ ] Terms of service
- [ ] Privacy policy

### Developer Documentation
- [ ] README.md updated
- [ ] API integration guide
- [ ] Component usage examples
- [ ] Testing guide
- [ ] Deployment guide (this document)

---

## 13. Compliance & Legal

### GDPR/Data Privacy
- [ ] Privacy policy published
- [ ] Cookie consent implemented (if using cookies)
- [ ] User data deletion process defined
- [ ] Data retention policy documented

### Terms & Conditions
- [ ] Terms of service published
- [ ] Refund policy defined
- [ ] Cancellation policy defined
- [ ] Dispute resolution process

---

## 14. Launch Checklist

### Pre-Launch
- [ ] All tests passing (65/65)
- [ ] Code reviewed and approved
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness checked
- [ ] API integration verified
- [ ] Error tracking configured
- [ ] Monitoring dashboards set up

### Launch Day
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Monitor API response times
- [ ] Check analytics tracking
- [ ] Verify user flows work
- [ ] Have rollback plan ready

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Fix critical bugs immediately
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## 15. Emergency Contacts

### Support Team
- **Frontend Lead:** [Name/Email]
- **Backend Lead:** [Name/Email]
- **DevOps:** [Name/Email]
- **Project Manager:** [Name/Email]
- **On-Call Engineer:** [Phone]

### Service Providers
- **Hosting:** Vercel/Netlify Support
- **API Hosting:** [Provider Support]
- **Database:** [PostgreSQL Admin]
- **Monitoring:** [Sentry/Analytics Support]

---

## Deployment Sign-Off

### Pre-Production
- [ ] Development complete
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Security audit passed
- [ ] Performance acceptable

**Approved by:** _______________  **Date:** _______

### Production Deployment
- [ ] All checklist items completed
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Rollback plan ready

**Deployed by:** _______________  **Date:** _______

---

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0 | 2026-02-13 | Phase 1 complete - Auth + Booking | - |

---

**Notes:**
- This checklist is for Phase 1 deployment
- Component tests and E2E tests recommended before full production
- Current test coverage: 95%+ on business logic (hooks)
- Known limitation: Components/screens not tested yet (plan for Phase 2)

**Recommendation:** Deploy to staging environment first, then production after additional testing.
