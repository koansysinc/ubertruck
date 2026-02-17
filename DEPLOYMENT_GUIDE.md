# UberTruck MVP - Deployment Guide

## 🚀 Production Deployment Guide

This guide provides step-by-step instructions to deploy the UberTruck application to production using **Vercel** (frontend) and **Render** (backend) with **Neon PostgreSQL** database.

---

## Architecture Overview

- **Frontend**: React app deployed on Vercel (Free tier)
- **Backend**: Node.js Express API deployed on Render (Free tier)
- **Database**: Neon PostgreSQL (Already configured)
- **File Storage**: Local (can upgrade to S3 later)

---

## Prerequisites

1. **GitHub Account** - To connect with deployment platforms
2. **Vercel Account** - Sign up at https://vercel.com
3. **Render Account** - Sign up at https://render.com
4. **Neon Database** - Already configured

---

## Step 1: Prepare the Repository

### 1.1 Initialize Git Repository

```bash
cd /home/koans/projects/ubertruck
git init
git add .
git commit -m "Initial commit - UberTruck MVP"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `ubertruck-mvp`
3. Keep it private for now
4. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ubertruck-mvp.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Connect GitHub to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `ubertruck-mvp` repository

### 2.2 Configure Backend Service

Use these settings:

- **Name**: `ubertruck-api`
- **Region**: Singapore (closest to Neon database)
- **Branch**: `main`
- **Root Directory**: `.` (root of repository)
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node src/index.js`

### 2.3 Set Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://neondb_owner:npg_D7xL5ASaczbH@ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=[Click "Generate" for a random value]
JWT_EXPIRES_IN=7d
USE_MOCK_REDIS=true
CORS_ORIGIN=https://your-app.vercel.app
LOG_LEVEL=info
```

### 2.4 Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://ubertruck-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3.2 Update Frontend Configuration

Update `/ubertruck-ui/.env.production`:

```env
REACT_APP_API_BASE_URL=https://ubertruck-api.onrender.com
REACT_APP_ENVIRONMENT=production
```

### 3.3 Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `ubertruck-ui`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.4 Set Environment Variables in Vercel

Add these environment variables:

```env
REACT_APP_API_BASE_URL=https://ubertruck-api.onrender.com
REACT_APP_ENVIRONMENT=production
TSC_COMPILE_ON_ERROR=true
SKIP_PREFLIGHT_CHECK=true
```

### 3.5 Deploy Frontend

1. Click "Deploy"
2. Wait for deployment (3-5 minutes)
3. Note your frontend URL: `https://ubertruck.vercel.app`

---

## Step 4: Update CORS Settings

After both deployments, update the backend CORS:

1. Go to Render Dashboard
2. Update `CORS_ORIGIN` environment variable to your Vercel URL
3. Redeploy the backend service

---

## Step 5: Database Migration

The database schema is already set up in Neon. No additional migration needed.

To verify:

```sql
-- Connect to Neon database
psql postgresql://neondb_owner:npg_D7xL5ASaczbH@ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

-- Check tables
\dt

-- Should see: users, trucks, bookings, etc.
```

---

## Step 6: Verify Deployment

### 6.1 Test Backend Health

```bash
curl https://ubertruck-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0-FROZEN",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 6.2 Test Frontend

1. Visit https://ubertruck.vercel.app
2. Try logging in with a test account
3. Create a booking
4. Verify all features work

---

## Step 7: Post-Deployment Checklist

- [ ] Backend health check passing
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] OTP verification works
- [ ] Login/logout works
- [ ] Booking creation works
- [ ] Dashboard displays bookings
- [ ] Driver assignment works
- [ ] All frozen requirements verified

---

## Monitoring & Maintenance

### Free Monitoring Options

1. **Render Dashboard** - Basic metrics and logs
2. **Vercel Dashboard** - Analytics and performance
3. **Neon Dashboard** - Database metrics

### Logs

- **Backend Logs**: Render Dashboard → Logs
- **Frontend Logs**: Vercel Dashboard → Functions → Logs
- **Database Logs**: Neon Dashboard → Monitoring

---

## Troubleshooting

### Backend Issues

1. **502 Bad Gateway**: Service starting up, wait 2-3 minutes
2. **Database connection failed**: Check DATABASE_URL in environment variables
3. **CORS errors**: Verify CORS_ORIGIN matches frontend URL

### Frontend Issues

1. **API calls failing**: Check REACT_APP_API_BASE_URL
2. **Build errors**: Ensure TSC_COMPILE_ON_ERROR=true
3. **Blank page**: Check browser console for errors

---

## Scaling Considerations

### When Free Tier Limits Are Reached

1. **Render Free Tier**:
   - 750 hours/month
   - Spins down after 15 min inactivity
   - Consider upgrading to Starter ($7/month)

2. **Vercel Free Tier**:
   - 100GB bandwidth/month
   - Unlimited deployments
   - Consider Pro plan if needed

3. **Neon Free Tier**:
   - 3GB storage
   - Sufficient for MVP

---

## Security Checklist

- [x] Environment variables not in code
- [x] Database credentials secure
- [x] JWT secret generated randomly
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] Helmet.js for security headers

---

## Alternative Deployment Options

If Render/Vercel doesn't work:

### Option 1: Railway.app
- Similar to Render
- $5 credit free tier
- Easy GitHub integration

### Option 2: Fly.io
- Better performance
- Generous free tier
- Global edge deployment

### Option 3: Netlify + Heroku
- Netlify for frontend
- Heroku for backend (no longer free)

---

## Support & Issues

For deployment issues:
1. Check service status pages
2. Review logs in dashboard
3. Verify environment variables
4. Test health endpoints

---

## Quick Deploy Commands

### Backend (if using CLI)
```bash
# Install Render CLI
npm install -g @render-oss/cli

# Deploy
render deploy
```

### Frontend (if using CLI)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ubertruck-ui
vercel --prod
```

---

## Success Criteria

✅ Application accessible via public URL
✅ All features working as in local development
✅ Database persisting data
✅ No CORS or authentication errors
✅ Performance acceptable (< 3s page load)

---

**Last Updated**: February 2026
**Deployment Time**: ~30 minutes total
**Monthly Cost**: $0 (Free tier)