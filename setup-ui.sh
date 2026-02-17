#!/bin/bash

echo "=================================="
echo "UberTruck UI Setup Script"
echo "=================================="
echo ""

# Check if ubertruck-ui already exists
if [ -d "ubertruck-ui" ]; then
  echo "⚠️  ubertruck-ui directory already exists"
  read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing existing ubertruck-ui..."
    rm -rf ubertruck-ui
  else
    echo "❌ Setup cancelled"
    exit 1
  fi
fi

echo "📦 Step 1: Creating React app with TypeScript..."
npx create-react-app ubertruck-ui --template typescript

if [ $? -ne 0 ]; then
  echo "❌ Failed to create React app"
  exit 1
fi

cd ubertruck-ui

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

echo ""
echo "📁 Step 3: Copying source files..."
# Copy all our source files
cp -r ../src/* src/

# Copy integration files
cp ../app-integration/App.tsx src/
cp ../app-integration/index.tsx src/
cp ../app-integration/index.css src/

echo ""
echo "⚙️  Step 4: Configuring Tailwind CSS..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

echo ""
echo "⚙️  Step 5: Creating environment file..."
cat > .env.local << 'EOF'
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_SOCIAL_LOGIN=false
EOF

echo ""
echo "📝 Step 6: Updating package.json scripts..."
# This is optional - the default scripts should work

echo ""
echo "✅ Setup complete!"
echo ""
echo "=================================="
echo "🚀 How to Run:"
echo "=================================="
echo ""
echo "1. Start the backend API server (if not running):"
echo "   cd backend && npm start"
echo ""
echo "2. Start the React app:"
echo "   cd ubertruck-ui"
echo "   npm start"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "=================================="
echo "📋 Features to Test:"
echo "=================================="
echo ""
echo "✓ Phone number entry (+91[6-9]XXXXXXXXX)"
echo "✓ OTP verification (6 digits)"
echo "✓ Profile setup (optional)"
echo "✓ 4-step booking wizard"
echo "✓ Dynamic price calculation"
echo "✓ GST breakdown display"
echo ""
echo "=================================="
echo ""
echo "⚠️  Important Notes:"
echo ""
echo "1. Backend API must be running at http://localhost:3000"
echo "2. If backend is at different URL, update .env.local"
echo "3. For testing without backend, API calls will fail"
echo "   (but UI will still render)"
echo ""
echo "Happy testing! 🎉"
