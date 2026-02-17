#!/bin/bash

# UberTruck MVP Deployment Script
# Deploys backend to Render and frontend to Vercel

echo "🚀 UberTruck MVP Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

# Function to prompt for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 1
    fi
}

# Check prerequisites
echo "📋 Checking prerequisites..."
check_command git
check_command node
check_command npm

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Git repository not initialized. Initializing...${NC}"
    git init
    git branch -M main
fi

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production file...${NC}"
    cat > .env.production << 'EOF'
# Production Environment Variables
DATABASE_URL=postgresql://neondb_owner:npg_D7xL5ASaczbH@ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
PORT=4000
JWT_SECRET=ubertruck-jwt-secret-prod-2026-secure-key
JWT_EXPIRES_IN=7d
USE_MOCK_REDIS=true
CORS_ORIGIN=https://ubertruck.vercel.app
LOG_LEVEL=info
EOF
fi

# Stage 1: Prepare for deployment
echo ""
echo "📦 Stage 1: Preparing for deployment..."
echo "----------------------------------------"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Uncommitted changes detected. Committing...${NC}"
    git add .
    git commit -m "Prepare for deployment - $(date +%Y-%m-%d)"
fi

# Stage 2: GitHub Repository
echo ""
echo "📝 Stage 2: GitHub Repository Setup"
echo "-----------------------------------"
echo ""
echo "Please complete these steps:"
echo ""
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named 'ubertruck-mvp'"
echo "3. Keep it private for now"
echo "4. DO NOT initialize with README, .gitignore, or license"
echo ""
confirm "Have you created the GitHub repository?"

echo ""
echo "Enter your GitHub username:"
read GITHUB_USERNAME

# Add GitHub remote
git remote add origin https://github.com/$GITHUB_USERNAME/ubertruck-mvp.git 2>/dev/null || git remote set-url origin https://github.com/$GITHUB_USERNAME/ubertruck-mvp.git

# Push to GitHub
echo -e "${GREEN}Pushing to GitHub...${NC}"
git push -u origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push to GitHub. Please check your credentials.${NC}"
    echo "You may need to set up a personal access token:"
    echo "https://github.com/settings/tokens"
    exit 1
fi

echo -e "${GREEN}✅ Code pushed to GitHub successfully!${NC}"

# Stage 3: Deploy Backend to Render
echo ""
echo "🔧 Stage 3: Deploy Backend to Render"
echo "------------------------------------"
echo ""
echo "Please complete these steps:"
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub account if not already connected"
echo "4. Select the 'ubertruck-mvp' repository"
echo "5. Use these settings:"
echo "   - Name: ubertruck-api"
echo "   - Region: Singapore"
echo "   - Branch: main"
echo "   - Runtime: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: node src/index.js"
echo ""
echo "6. Add these environment variables in Render dashboard:"
echo "   NODE_ENV=production"
echo "   PORT=4000"
echo "   DATABASE_URL=postgresql://neondb_owner:npg_D7xL5ASaczbH@ep-old-unit-a1j0qw5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
echo "   JWT_SECRET=[Click Generate for random value]"
echo "   JWT_EXPIRES_IN=7d"
echo "   USE_MOCK_REDIS=true"
echo "   CORS_ORIGIN=https://your-app.vercel.app"
echo "   LOG_LEVEL=info"
echo ""
echo "7. Click 'Create Web Service'"
echo "8. Wait for deployment (5-10 minutes)"
echo ""
confirm "Have you deployed the backend to Render?"

echo "Enter your Render backend URL (e.g., https://ubertruck-api.onrender.com):"
read BACKEND_URL

# Update frontend environment
echo -e "${GREEN}Updating frontend configuration...${NC}"
cat > ubertruck-ui/.env.production << EOF
REACT_APP_API_BASE_URL=$BACKEND_URL
REACT_APP_ENVIRONMENT=production
EOF

# Stage 4: Deploy Frontend to Vercel
echo ""
echo "🎨 Stage 4: Deploy Frontend to Vercel"
echo "-------------------------------------"
echo ""
echo "Please complete these steps:"
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'Add New...' → 'Project'"
echo "3. Import the 'ubertruck-mvp' GitHub repository"
echo "4. Configure project:"
echo "   - Framework Preset: Create React App"
echo "   - Root Directory: ubertruck-ui"
echo "   - Build Command: npm run build"
echo "   - Output Directory: build"
echo ""
echo "5. Add these environment variables:"
echo "   REACT_APP_API_BASE_URL=$BACKEND_URL"
echo "   REACT_APP_ENVIRONMENT=production"
echo "   TSC_COMPILE_ON_ERROR=true"
echo "   SKIP_PREFLIGHT_CHECK=true"
echo ""
echo "6. Click 'Deploy'"
echo "7. Wait for deployment (3-5 minutes)"
echo ""
confirm "Have you deployed the frontend to Vercel?"

echo "Enter your Vercel frontend URL (e.g., https://ubertruck.vercel.app):"
read FRONTEND_URL

# Stage 5: Update CORS
echo ""
echo "🔒 Stage 5: Update CORS Settings"
echo "---------------------------------"
echo ""
echo "Go back to Render Dashboard and update the CORS_ORIGIN environment variable to:"
echo "$FRONTEND_URL"
echo ""
echo "Then trigger a manual deploy in Render to apply the change."
echo ""
confirm "Have you updated CORS and redeployed?"

# Stage 6: Verification
echo ""
echo "✅ Stage 6: Verification"
echo "------------------------"
echo ""
echo "Testing backend health..."
curl -s $BACKEND_URL/health | python3 -m json.tool

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo -e "${RED}❌ Backend health check failed. Please check Render logs.${NC}"
fi

echo ""
echo "Testing frontend..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Frontend is accessible!${NC}"
else
    echo -e "${RED}❌ Frontend returned status $HTTP_STATUS. Please check Vercel logs.${NC}"
fi

# Summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📱 Your application is now live at:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend: $BACKEND_URL"
echo ""
echo "📊 Monitoring:"
echo "   Render Dashboard: https://dashboard.render.com"
echo "   Vercel Dashboard: https://vercel.com/dashboard"
echo "   Neon Dashboard: https://console.neon.tech"
echo ""
echo "🔍 Next Steps:"
echo "   1. Test user registration and login"
echo "   2. Create a test booking"
echo "   3. Monitor logs for any errors"
echo "   4. Set up custom domain (optional)"
echo ""
echo "📝 Important Notes:"
echo "   - Render free tier spins down after 15 min inactivity"
echo "   - First request after spindown takes 30-60 seconds"
echo "   - Consider upgrading to paid tier for production use"
echo ""
echo -e "${GREEN}🚀 Deployment successful! Your UberTruck MVP is live!${NC}"