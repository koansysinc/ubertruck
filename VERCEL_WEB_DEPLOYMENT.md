# 🚀 Quick Vercel Web Deployment Guide

## Deploy Frontend in 3 Minutes

### Step 1: Open Vercel Import Page
Go to: **https://vercel.com/import/git**

### Step 2: Import Repository
1. Click **"Continue with GitHub"**
2. Select **koansysinc/ubertruck** repository
3. Click **Import**

### Step 3: Configure Project Settings

**IMPORTANT - Set these EXACT values:**

| Setting | Value |
|---------|-------|
| **Project Name** | ubertruck |
| **Framework Preset** | Create React App |
| **Root Directory** | `ubertruck-ui` ⚠️ (Click Edit and type this) |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add these ONE BY ONE:

```
Name: REACT_APP_API_BASE_URL
Value: https://ubertruck.onrender.com

Name: REACT_APP_ENVIRONMENT
Value: production

Name: TSC_COMPILE_ON_ERROR
Value: true

Name: SKIP_PREFLIGHT_CHECK
Value: true

Name: GENERATE_SOURCEMAP
Value: false

Name: REACT_APP_ENABLE_OTP_BYPASS
Value: false

Name: REACT_APP_ENABLE_DEBUG_MODE
Value: false
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Copy your deployment URL (e.g., ubertruck-xxx.vercel.app)

---

## ✅ Your Deployment URL Will Be:
- **Preview**: https://ubertruck-[random].vercel.app
- **Production**: https://ubertruck.vercel.app (if available)

---

## 🔄 After Deployment - Update CORS

### CRITICAL - Update Render Backend:
1. Go to: https://dashboard.render.com
2. Select your **ubertruck** service
3. Click **Environment** tab
4. Find **CORS_ORIGIN**
5. Update to your Vercel URL (e.g., `https://ubertruck.vercel.app`)
6. Click **Save Changes**
7. Wait 2 minutes for redeploy

---

## 🧪 Quick Test Commands

Once deployed, test with these:

```bash
# Test frontend is live
curl -I https://ubertruck.vercel.app

# Test API connection from frontend
curl https://ubertruck.vercel.app

# Test backend is responding
curl https://ubertruck.onrender.com/health
```

---

## ⚡ Deployment Checklist

- [ ] Opened https://vercel.com/import/git
- [ ] Selected koansysinc/ubertruck repository
- [ ] Set Root Directory to `ubertruck-ui`
- [ ] Added all 7 environment variables
- [ ] Clicked Deploy
- [ ] Copied deployment URL
- [ ] Updated CORS_ORIGIN on Render
- [ ] Tested the live site

---

## 🎯 Expected Result

After deployment, you should be able to:
1. Visit your Vercel URL
2. See UberTruck homepage
3. Click "Get Started"
4. Enter phone number
5. Receive OTP (backend connection working)

---

**Deployment URL**: Will be shown after deployment completes
**Time Required**: 3-5 minutes total