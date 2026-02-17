# Google Maps API Setup Guide for UberTruck

**Created**: 2026-02-14
**Status**: The current API key is invalid. Follow this guide to create a valid one.

---

## Problem

The booking form's "Use Current Location" button fails with error:
```
Unable to get address for your location
```

**Root Cause**: Invalid Google Maps API key
**Test Result**:
```bash
$ curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=17.385,78.486&key=AIzaSyBz343rdputbKtjsUAte5XAMFfandgfN6c"
{"error_message": "You must use an API key to authenticate", "status": "REQUEST_DENIED"}
```

---

## Step-by-Step Setup Guide

### Step 1: Access Google Cloud Console

1. Open your browser and go to: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. If prompted, accept the Terms of Service

---

### Step 2: Create a New Project (or Select Existing)

#### Option A: Create New Project
1. Click the project dropdown at the top of the page (next to "Google Cloud")
2. Click "NEW PROJECT"
3. Enter project details:
   - **Project Name**: `UberTruck` (or any name you prefer)
   - **Organization**: Leave as default (No organization)
4. Click "CREATE"
5. Wait for project creation (15-30 seconds)

#### Option B: Use Existing Project
1. Click the project dropdown
2. Select your existing project from the list

---

### Step 3: Enable Billing (REQUIRED)

Google Maps API requires billing to be enabled, even for free tier usage.

**Free Tier Includes**:
- $200 credit per month (automatically applied)
- Enough for ~28,000 geocoding requests/month
- Enough for ~28,000 autocomplete requests/month

#### Enable Billing:
1. Go to: **https://console.cloud.google.com/billing**
2. Click "LINK A BILLING ACCOUNT"
3. If you don't have a billing account:
   - Click "CREATE BILLING ACCOUNT"
   - Enter your billing information (credit card required)
   - Google will NOT charge you unless you exceed free tier limits
4. Link the billing account to your project

---

### Step 4: Enable Required APIs

You need to enable TWO APIs:

#### 4.1: Enable Maps JavaScript API

1. Go to: **https://console.cloud.google.com/apis/library/maps-backend.googleapis.com**
2. Make sure your project is selected in the dropdown
3. Click "ENABLE"
4. Wait for activation (10-20 seconds)

#### 4.2: Enable Geocoding API

1. Go to: **https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com**
2. Click "ENABLE"
3. Wait for activation

#### Verify APIs are Enabled:
1. Go to: **https://console.cloud.google.com/apis/dashboard**
2. You should see both APIs listed under "Enabled APIs & services"

---

### Step 5: Create API Key

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Click "CREATE CREDENTIALS" button at the top
3. Select "API key" from the dropdown
4. A popup will show your new API key
5. **COPY THE API KEY IMMEDIATELY** (you'll need it in Step 7)
6. Click "RESTRICT KEY" (recommended for security)

---

### Step 6: Configure API Key Restrictions (Recommended)

#### Application Restrictions:
1. Select "HTTP referrers (web sites)"
2. Add allowed referrers:
   ```
   http://localhost:3000/*
   http://127.0.0.1:3000/*
   ```
3. For production, add your production domain:
   ```
   https://yourdomain.com/*
   ```

#### API Restrictions:
1. Select "Restrict key"
2. Select these APIs:
   - ✅ Maps JavaScript API
   - ✅ Geocoding API
3. Click "SAVE"

---

### Step 7: Update UberTruck Configuration

Replace the invalid API key with your new valid key:

#### 7.1: Update .env.local file

```bash
# Edit the frontend environment file
nano /home/koans/projects/ubertruck/ubertruck-ui/.env.local
```

Update this line:
```bash
# OLD (invalid key):
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBz343rdputbKtjsUAte5XAMFfandgfN6c

# NEW (your valid key from Step 5):
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
```

Save and exit (Ctrl+X, then Y, then Enter)

#### 7.2: Restart Frontend

```bash
# Kill existing frontend process
pkill -f "react-scripts start"

# Start frontend with new API key
cd /home/koans/projects/ubertruck/ubertruck-ui
SKIP_PREFLIGHT_CHECK=true TSC_COMPILE_ON_ERROR=true npm start
```

---

### Step 8: Verify API Key Works

#### Test 1: Direct API call
```bash
# Replace YOUR_API_KEY with your actual key
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=17.385,78.486&key=YOUR_API_KEY"
```

**Expected Success Response**:
```json
{
  "results": [
    {
      "formatted_address": "Hyderabad, Telangana, India",
      "address_components": [...],
      ...
    }
  ],
  "status": "OK"
}
```

**If you see this, the key is valid!** ✅

#### Test 2: Browser Test
1. Open http://localhost:3000 in your browser
2. Login with phone: `9595959595`
3. Click "Create New Booking"
4. Click "Use Current Location" button
5. Allow browser location access
6. **Success**: Address should populate automatically

---

## Troubleshooting

### Error: "REQUEST_DENIED"
**Cause**: API key invalid or APIs not enabled
**Fix**:
- Check that both APIs are enabled (Step 4)
- Verify billing is enabled (Step 3)
- Wait 2-5 minutes after creating key (propagation delay)

### Error: "API key not valid"
**Cause**: API restrictions are too strict
**Fix**:
- Go to credentials page
- Edit your API key
- Temporarily remove all restrictions to test
- If it works, restrictions are the issue

### Error: "This API project is not authorized"
**Cause**: API not enabled for this project
**Fix**: Re-do Step 4 to enable both APIs

### Error: "You must enable Billing"
**Cause**: Billing account not linked
**Fix**: Complete Step 3

---

## Cost Monitoring

Set up billing alerts to avoid unexpected charges:

1. Go to: **https://console.cloud.google.com/billing/budgets**
2. Click "CREATE BUDGET"
3. Set budget amount: `$10` (well above free tier)
4. Set alert thresholds: 50%, 90%, 100%
5. Add your email for notifications

**Realistic Usage for UberTruck**:
- Development/Testing: $0 (within free tier)
- Production (100 bookings/day): ~$5-10/month

---

## Security Best Practices

### For Development:
- ✅ Restrict to localhost domains
- ✅ Restrict to required APIs only
- ✅ Don't commit API key to Git (use .env.local)

### For Production:
- ✅ Restrict to production domain only
- ✅ Use environment variables (not hardcoded)
- ✅ Monitor API usage in Cloud Console
- ✅ Rotate keys every 90 days

---

## Quick Reference Commands

```bash
# Check current API key in config
cat /home/koans/projects/ubertruck/ubertruck-ui/.env.local | grep GOOGLE_MAPS

# Test API key validity
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=17.385,78.486&key=YOUR_KEY"

# Update API key
nano /home/koans/projects/ubertruck/ubertruck-ui/.env.local

# Restart frontend
pkill -f "react-scripts start" && cd /home/koans/projects/ubertruck/ubertruck-ui && npm start
```

---

## Support Links

- **Google Maps Platform Documentation**: https://developers.google.com/maps/documentation
- **Pricing Calculator**: https://mapsplatform.google.com/pricing/
- **API Key Best Practices**: https://developers.google.com/maps/api-key-best-practices
- **Billing Overview**: https://cloud.google.com/billing/docs/how-to/budgets

---

## Summary

Once you complete these steps:
1. ✅ Create Google Cloud project
2. ✅ Enable billing (required, but free tier is generous)
3. ✅ Enable Maps JavaScript API + Geocoding API
4. ✅ Create API key with restrictions
5. ✅ Update .env.local file
6. ✅ Restart frontend

The "Use Current Location" button will work perfectly!

**Estimated Time**: 10-15 minutes (if you have a Google account and credit card ready)

---

**Created by**: Claude Code
**Last Updated**: 2026-02-14
**Status**: Ready to follow
