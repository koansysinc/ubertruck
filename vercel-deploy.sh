#!/bin/bash

# Vercel Deployment Script for UberTruck Frontend

echo "======================================"
echo "🚀 UberTruck Frontend Vercel Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📦 Preparing for deployment..."
echo ""

# Navigate to frontend directory
cd /home/koans/projects/ubertruck/ubertruck-ui

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ vercel.json not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ vercel.json found${NC}"
echo ""

# Set environment variables for the deployment
export REACT_APP_API_BASE_URL="https://ubertruck.onrender.com"
export REACT_APP_ENVIRONMENT="production"
export TSC_COMPILE_ON_ERROR="true"
export SKIP_PREFLIGHT_CHECK="true"
export GENERATE_SOURCEMAP="false"

echo "🔧 Environment Variables Set:"
echo "  - REACT_APP_API_BASE_URL: $REACT_APP_API_BASE_URL"
echo "  - REACT_APP_ENVIRONMENT: $REACT_APP_ENVIRONMENT"
echo "  - TSC_COMPILE_ON_ERROR: $TSC_COMPILE_ON_ERROR"
echo ""

echo "🚀 Starting Vercel deployment..."
echo ""
echo "This will:"
echo "  1. Build the React application"
echo "  2. Deploy to Vercel"
echo "  3. Provide you with a production URL"
echo ""

# Deploy using Vercel CLI
# Using --yes flag to skip interactive prompts
# Using --prod flag to deploy to production
vercel --yes --prod \
  --env REACT_APP_API_BASE_URL="https://ubertruck.onrender.com" \
  --env REACT_APP_ENVIRONMENT="production" \
  --env TSC_COMPILE_ON_ERROR="true" \
  --env SKIP_PREFLIGHT_CHECK="true" \
  --env GENERATE_SOURCEMAP="false" \
  --build-env REACT_APP_API_BASE_URL="https://ubertruck.onrender.com" \
  --build-env REACT_APP_ENVIRONMENT="production" \
  --build-env TSC_COMPILE_ON_ERROR="true" \
  --build-env SKIP_PREFLIGHT_CHECK="true" \
  --build-env GENERATE_SOURCEMAP="false"

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Note your Vercel URL from above"
    echo "  2. Update CORS_ORIGIN on Render to match your Vercel URL"
    echo "  3. Test the deployed application"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Please check the error messages above."
    exit 1
fi