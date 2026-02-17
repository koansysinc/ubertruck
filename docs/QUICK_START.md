# Quick Start - Test UberTruck Features NOW

**Fastest way to see your features running in the browser**

---

## 🚀 Super Quick Start (2 minutes)

### Method 1: Using Vite (Fastest)

```bash
# Create Vite app (much faster than CRA)
npm create vite@latest ubertruck-ui -- --template react-ts

cd ubertruck-ui

# Install dependencies
npm install
npm install react-router-dom

# Copy source files
cp -r ../src/* src/
cp ../app-integration/App.tsx src/
cp ../app-integration/index.tsx src/main.tsx

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind (edit tailwind.config.js)
cat > tailwind.config.js << 'EOF'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
EOF

# Update index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Create .env.local
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
EOF

# Update api.ts to use VITE_ prefix
sed -i 's/process.env.REACT_APP_API_BASE_URL/import.meta.env.VITE_API_BASE_URL/g' src/services/api.ts

# Start!
npm run dev
```

Open: http://localhost:5173

---

## Method 2: Test Without Full Setup

### View Components in Isolation

Create `test-component.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // Paste component code here
    function PhoneEntry() {
      const [phone, setPhone] = React.useState('');

      return (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Enter Phone Number</h1>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="p-4 border-2 rounded-xl w-full"
          />
        </div>
      );
    }

    ReactDOM.render(<PhoneEntry />, document.getElementById('root'));
  </script>
</body>
</html>
```

Open `test-component.html` in browser - instant preview!

---

## Method 3: Use Automated Script

```bash
# Make executable
chmod +x setup-ui.sh

# Run (will take 2-3 minutes)
./setup-ui.sh

# Follow on-screen instructions
```

---

## Method 4: CodeSandbox (Online, No Install)

1. Go to https://codesandbox.io/
2. Create new React TypeScript project
3. Upload your `src/` folder
4. Starts immediately in browser!

---

## What You'll See

### 1. Phone Entry Screen
<img width="400" alt="Phone entry with validation" />

- Input field with +91 prefix
- Real-time validation
- Error messages for invalid numbers
- "Next" button (disabled until valid)

### 2. OTP Screen
<img width="400" alt="OTP verification" />

- 6 input boxes
- Auto-focus between boxes
- Countdown timer: 5:00
- Paste support (Ctrl+V)
- Resend OTP button

### 3. Dashboard
<img width="400" alt="Dashboard" />

- Welcome message
- Stats cards (₹5/tonne/km, capacity, validity)
- "Create New Booking" button
- Logout button

### 4. Booking Wizard
<img width="400" alt="4-step wizard" />

- **Step 1:** Locations (pickup + delivery)
- **Step 2:** Cargo details (type, weight, etc.)
- **Step 3:** Contacts (pickup + delivery persons)
- **Step 4:** Price breakdown + confirmation

---

## Testing Without Backend

All features will work visually, but API calls will fail gracefully:

**What Works:**
- ✅ All forms render
- ✅ All validation works
- ✅ Navigation between screens
- ✅ Timers and animations
- ✅ Price calculation UI
- ✅ Error messages display

**What Doesn't Work (needs backend):**
- ❌ Actual OTP sending
- ❌ JWT token generation
- ❌ Real price calculation
- ❌ Booking creation

**To Mock API:**

Edit `src/services/api.ts`:

```typescript
// Add at top of file
const USE_MOCK = true;

if (USE_MOCK) {
  // Return mock data instead of fetch
  return Promise.resolve({
    sessionId: 'mock-session',
    otpExpiresIn: 300,
    // ...
  });
}
```

---

## Fastest Way to See Something

### Option A: Static HTML

```bash
cd ubertruck
cat > demo.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-8">
  <div class="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
    <h1 class="text-3xl font-bold mb-2">UberTruck</h1>
    <p class="text-gray-500 mb-8">Logistics Made Simple</p>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2">Phone Number</label>
      <div class="flex items-center gap-3 bg-gray-100 p-4 rounded-xl border-2">
        <span class="font-bold border-r pr-3">🇮🇳 +91</span>
        <input
          type="tel"
          placeholder="Enter phone number"
          class="bg-transparent outline-none w-full"
          maxlength="10"
        />
      </div>
      <p class="text-xs text-gray-400 mt-2">
        We'll send you a 6-digit verification code
      </p>
    </div>

    <button class="w-full py-4 bg-black text-white rounded-xl font-bold">
      Next
    </button>
  </div>
</body>
</html>
EOF

# Open in browser
open demo.html  # Mac
# or
xdg-open demo.html  # Linux
# or just double-click demo.html in file explorer
```

This shows the phone entry screen instantly!

---

## Next Actions

**Right Now (0 min setup):**
- Open `demo.html` → See phone entry screen

**Quick (2 min setup):**
- Run Vite setup → Full app running

**Full (5 min setup):**
- Run `setup-ui.sh` → Production-ready app

**Cloud (0 min setup):**
- Upload to CodeSandbox → Instant preview

---

## Troubleshooting

### "Command not found: npm"
```bash
# Install Node.js first
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### "Port already in use"
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)
```

### "Module not found"
```bash
# Install dependencies
npm install
```

---

## Summary

**Fastest to Slowest:**

1. **Static HTML** (0 seconds) - Open `demo.html`
2. **CodeSandbox** (30 seconds) - Upload online
3. **Vite** (2 minutes) - Fast build tool
4. **Create React App** (5 minutes) - Full setup
5. **Automated Script** (3 minutes) - One command

**Recommended:** Start with static HTML to see something immediately, then use Vite for full features.

---

**Need help?** Check `UI_SETUP_GUIDE.md` for detailed instructions.

**Ready to test!** 🎯
