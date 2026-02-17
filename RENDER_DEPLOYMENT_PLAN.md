# 🚀 Render Backend Deployment Plan

## Step-by-Step Guide to Deploy UberTruck Backend to Render

### ✅ Pre-Deployment Checklist
- [x] Code pushed to GitHub
- [x] render.yaml configured
- [x] Environment variables prepared
- [x] Database connection string ready (Neon PostgreSQL)

---

## 📋 Step 1: Create Render Account (if needed)

1. Go to https://render.com
2. Sign up with GitHub (recommended) or email
3. Verify your email if required

---

## 🔗 Step 2: Connect GitHub Repository

1. **Login to Render Dashboard**: https://dashboard.render.com

2. **Click "New +" → "Web Service"**

3. **Connect GitHub**:
   - Click "Connect account" under GitHub
   - Authorize Render to access your repositories
   - If repo is private, grant access to private repos

4. **Select Repository**:
   - Find `koansysinc/ubertruck`
   - Click "Connect"

---

## ⚙️ Step 3: Configure Service Settings

Use these EXACT settings:

| Setting | Value |
|---------|-------|
| **Name** | `ubertruck-api` |
| **Region** | `Singapore` (closest to Neon database) |
| **Branch** | `master` |
| **Root Directory** | Leave blank (repository root) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Plan** | `Free` (to start) |

---

## 🔐 Step 4: Add Environment Variables

Click "Advanced" and add these environment variables ONE BY ONE:

### Required Environment Variables:

```
NODE_ENV = production
PORT = 4000
DATABASE_URL = postgresql://neondb_owner:npg_D7xL5ASaczbH@ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET = [Click "Generate" button for random value]
JWT_EXPIRES_IN = 7d
USE_MOCK_REDIS = true
CORS_ORIGIN = https://your-frontend.vercel.app
LOG_LEVEL = info
RATE_LIMIT_WINDOW_MS = 60000
RATE_LIMIT_MAX_REQUESTS = 100
WS_PORT = 4001
```

### Optional (for future):
```
REDIS_URL = [Leave empty for now, using mock]
GOOGLE_MAPS_API_KEY = [Add if you have one]
```

---

## 🚀 Step 5: Deploy

1. **Review all settings**
2. **Click "Create Web Service"**
3. **Watch the deployment logs**
4. **Wait for "Live" status** (5-10 minutes first time)

---

## 📊 Step 6: Monitor Deployment

### What to expect in logs:
```
==> Cloning from https://github.com/koansysinc/ubertruck.git
==> Checking out commit db974af
==> Running build command 'npm install'...
==> Generating container image
==> Starting service with 'node src/index.js'
Database connection established
Redis connection established
UberTruck MVP Server running on port 4000
```

### Success Indicators:
- ✅ "Live" status in dashboard
- ✅ Green checkmark next to service name
- ✅ URL assigned (e.g., https://ubertruck-api.onrender.com)

---

## 🧪 Step 7: Test Deployed Backend

Your backend URL will be: `https://ubertruck-api.onrender.com`

### Test Commands:

1. **Health Check**:
```bash
curl https://ubertruck-api.onrender.com/health
```
Expected: `{"status":"healthy","version":"1.0.0-FROZEN",...}`

2. **API Version**:
```bash
curl https://ubertruck-api.onrender.com/api/v1
```

3. **Price Calculation** (Frozen requirement test):
```bash
curl -X POST https://ubertruck-api.onrender.com/api/v1/payments/calculate \
  -H "Content-Type: application/json" \
  -d '{"distance":100,"weight":10,"pickupPincode":"508001","deliveryPincode":"508207"}'
```
Expected: Base price 5000 (₹5/tonne/km verified)

---

## ⚠️ Important Notes

### Free Tier Limitations:
- **Spins down** after 15 minutes of inactivity
- **First request** after spindown takes 30-60 seconds
- **750 hours/month** included
- Consider upgrading to Starter ($7/month) for production

### Troubleshooting:

**If deployment fails:**
- Check build logs for npm install errors
- Verify all environment variables are set
- Ensure DATABASE_URL is correct
- Check if JWT_SECRET was generated

**If API returns 502/503:**
- Service is starting up (wait 1-2 minutes)
- Check logs for database connection errors
- Verify CORS_ORIGIN is set correctly

**If "Service Unavailable":**
- Free tier spinning up (wait 30-60 seconds)
- Check Render dashboard for status

---

## 📝 Post-Deployment Steps

1. **Save your backend URL**: `https://ubertruck-api.onrender.com`

2. **Update CORS after frontend deployment**:
   - Go to Environment settings
   - Update `CORS_ORIGIN` to your Vercel frontend URL
   - Click "Save Changes"
   - Service will auto-redeploy

3. **Monitor logs**:
   - Dashboard → Your Service → Logs
   - Check for any errors or warnings

---

## 🎯 Success Criteria

✅ Backend responds to health check
✅ Price calculation returns correct values (₹5/tonne/km)
✅ API endpoints accessible
✅ Database connection successful
✅ No errors in logs

---

## 📊 Deployment Timeline

- Account setup: 2 minutes
- GitHub connection: 1 minute
- Configuration: 3 minutes
- First deployment: 5-10 minutes
- Testing: 2 minutes
**Total: ~15-20 minutes**

---

## 🆘 Need Help?

- **Render Status**: https://status.render.com
- **Render Docs**: https://render.com/docs
- **Common Issues**: Check logs first!

---

**Ready to deploy?** Go to https://dashboard.render.com and start with Step 2!