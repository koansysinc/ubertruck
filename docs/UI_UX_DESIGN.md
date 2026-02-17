# UberTruck MVP - UI/UX Design Guide

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--primary: #1E40AF;        /* Blue - Trust & Reliability */
--primary-dark: #1E3A8A;   /* Darker Blue */
--primary-light: #3B82F6;  /* Light Blue */

/* Secondary Colors */
--success: #10B981;        /* Green - Confirmed/Delivered */
--warning: #F59E0B;        /* Orange - In Transit */
--danger: #EF4444;         /* Red - Cancelled/Error */
--info: #6B7280;          /* Gray - Information */

/* Neutral Colors */
--white: #FFFFFF;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-900: #111827;
--black: #000000;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes (Mobile First) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Spacing System
```css
/* 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

---

## 📱 Mobile-First Screens

### 1. Splash Screen
```
┌─────────────────────┐
│                     │
│     🚛 UberTruck   │
│                     │
│   Logistics Made    │
│      Simple         │
│                     │
│    [Loading...]     │
│                     │
└─────────────────────┘
```

### 2. Login/Registration
```
┌─────────────────────┐
│  < Back             │
│                     │
│   Welcome Back!     │
│                     │
│  📱 Phone Number    │
│  ┌─────────────────┐│
│  │ +91 ___________││
│  └─────────────────┘│
│                     │
│  I am a:            │
│  ○ Shipper         │
│  ○ Carrier         │
│  ○ Driver          │
│                     │
│  [Send OTP]         │
│                     │
│  New User? Register │
└─────────────────────┘
```

### 3. OTP Verification
```
┌─────────────────────┐
│  < Back             │
│                     │
│   Verify OTP        │
│   Sent to +91...   │
│                     │
│   ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐│
│   │ ││ ││ ││ ││ ││ ││
│   └─┘└─┘└─┘└─┘└─┘└─┘│
│                     │
│   Resend in 00:45   │
│                     │
│   [Verify]          │
│                     │
└─────────────────────┘
```

### 4. Shipper Dashboard
```
┌─────────────────────┐
│  ☰  Dashboard    🔔 │
├─────────────────────┤
│  Hello, Company!    │
│                     │
│  Quick Actions:     │
│  ┌────┐ ┌────┐     │
│  │ 🚛 │ │ 📋 │     │
│  │Book│ │Track│     │
│  └────┘ └────┘     │
│                     │
│  Active Bookings    │
│  ┌─────────────────┐│
│  │BK001 • In Transit││
│  │Nalgonda → Miryal││
│  │20T • ₹2,500     ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │BK002 • Assigned ││
│  │Tomorrow 10:00 AM ││
│  │15T • ₹1,875     ││
│  └─────────────────┘│
│                     │
├─────────────────────┤
│ 🏠 📦 💰 👤        │
└─────────────────────┘
```

### 5. Create Booking (Multi-Step)
```
Step 1: Cargo Details
┌─────────────────────┐
│  < New Booking  1/4 │
├─────────────────────┤
│  Cargo Type         │
│  ┌─────────────────┐│
│  │ Select Type   ▼ ││
│  └─────────────────┘│
│                     │
│  Weight (Tonnes)    │
│  ┌─────────────────┐│
│  │ Enter weight    ││
│  └─────────────────┘│
│                     │
│  Truck Type         │
│  ○ 10T  ○ 15T  ○ 20T│
│                     │
│  Special Instructions│
│  ┌─────────────────┐│
│  │                 ││
│  └─────────────────┘│
│                     │
│  [Next →]           │
└─────────────────────┘

Step 2: Pickup Location
┌─────────────────────┐
│  < New Booking  2/4 │
├─────────────────────┤
│  📍 Pickup Location │
│                     │
│  ┌─────────────────┐│
│  │🔍 Search location││
│  └─────────────────┘│
│                     │
│  [Map View]         │
│  ┌─────────────────┐│
│  │                 ││
│  │   📍 Nalgonda   ││
│  │                 ││
│  └─────────────────┘│
│                     │
│  Pickup Date & Time │
│  ┌────────┐┌───────┐│
│  │📅 Date ││🕐 Time ││
│  └────────┘└───────┘│
│                     │
│  [← Back] [Next →]  │
└─────────────────────┘

Step 3: Delivery Location
┌─────────────────────┐
│  < New Booking  3/4 │
├─────────────────────┤
│  📍 Delivery Location│
│                     │
│  ┌─────────────────┐│
│  │🔍 Search location││
│  └─────────────────┘│
│                     │
│  [Map View]         │
│  ┌─────────────────┐│
│  │                 ││
│  │  📍 Miryalguda  ││
│  │                 ││
│  └─────────────────┘│
│                     │
│  Distance: 45 km    │
│                     │
│  [← Back] [Next →]  │
└─────────────────────┘

Step 4: Review & Confirm
┌─────────────────────┐
│  < New Booking  4/4 │
├─────────────────────┤
│  📋 Booking Summary │
│                     │
│  From: Nalgonda     │
│  To: Miryalguda     │
│  Date: Tomorrow 10AM│
│  Truck: 20T         │
│  Weight: 18T        │
│  Distance: 45 km    │
│                     │
│  💰 Price Breakdown │
│  ┌─────────────────┐│
│  │Base: ₹4,050     ││
│  │(₹5 × 18T × 45km)││
│  │GST(18%): ₹729   ││
│  │─────────────────││
│  │Total: ₹4,779    ││
│  └─────────────────┘│
│                     │
│  [← Back] [Confirm] │
└─────────────────────┘
```

### 6. Track Booking
```
┌─────────────────────┐
│  < Track BK001      │
├─────────────────────┤
│  Status: In Transit │
│                     │
│  ● ─── ● ─── ◐ ─── ○│
│  Pick  Load Transit Del│
│                     │
│  [Live Tracking Map]│
│  ┌─────────────────┐│
│  │    🚛           ││
│  │  ·······→      ││
│  │ 📍        📍   ││
│  └─────────────────┘│
│                     │
│  Driver: Ram Kumar  │
│  Vehicle: TS07AB1234│
│  Phone: [Call Driver]│
│                     │
│  Updates:           │
│  • 2:00 PM - In transit│
│  • 11:30 AM - Loaded│
│  • 10:00 AM - Arrived│
│                     │
│  ETA: 4:30 PM       │
└─────────────────────┘
```

### 7. Driver App - Delivery
```
┌─────────────────────┐
│  Current Delivery   │
├─────────────────────┤
│  BK001              │
│  Nalgonda → Miryal  │
│                     │
│  📦 18T General Cargo│
│                     │
│  Pickup OTP:        │
│  ┌─────────────────┐│
│  │ Enter 6-digit   ││
│  └─────────────────┘│
│                     │
│  [Verify & Start]   │
│                     │
│  Status Updates:    │
│  [Picked Up]        │
│  [In Transit]       │
│  [Delivered]        │
│                     │
│  📷 Upload POD      │
│  ┌─────────────────┐│
│  │ [Tap to upload] ││
│  └─────────────────┘│
│                     │
│  [Complete Delivery]│
└─────────────────────┘
```

---

## 💻 Desktop Admin Dashboard

```
┌──────────────────────────────────────────────────┐
│ UberTruck Admin          👤 Admin    🔔  ⚙️  🚪 │
├──────┬───────────────────────────────────────────┤
│      │                Dashboard                   │
│  📊  ├───────────────────────────────────────────┤
│ Dash │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│      │  │ Active   │ │ Revenue  │ │ Delivered│ │
│  👥  │  │ 234      │ │ ₹45.2L   │ │ 89%      │ │
│Users │  │ Bookings │ │ This Month│ │ On Time  │ │
│      │  └──────────┘ └──────────┘ └──────────┘ │
│  📦  │                                           │
│Book- │  [Revenue Chart]    [Booking Trends]     │
│ings  │  ┌──────────────┐  ┌──────────────┐    │
│      │  │     📈       │  │      📊       │    │
│  🚛  │  └──────────────┘  └──────────────┘    │
│Fleet │                                           │
│      │  Recent Bookings                          │
│  💰  │  ┌────────────────────────────────────┐  │
│Pay-  │  │ ID    From    To     Status   Amount│  │
│ments │  │ BK001 Nalg   Miryal Transit ₹4,779 │  │
│      │  │ BK002 Miryal Nalg   Assigned ₹3,150│  │
│  📊  │  └────────────────────────────────────┘  │
│Reports│                                          │
└──────┴───────────────────────────────────────────┘
```

---

## 🎯 UI Components

### Buttons
```css
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  min-height: 48px; /* Touch target */
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-900);
  border: 1px solid var(--gray-300);
}
```

### Cards
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 12px;
}
```

### Status Badges
```css
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success { background: #10B98120; color: #10B981; }
.badge-warning { background: #F59E0B20; color: #F59E0B; }
.badge-danger { background: #EF444420; color: #EF4444; }
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
/* Default: 0-639px */

/* Tablet */
@media (min-width: 640px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Wide */
@media (min-width: 1280px) { }
```

---

## ⚡ Performance & Offline

### Progressive Web App Features
- Service Worker for offline caching
- IndexedDB for local data storage
- Background sync for pending bookings
- Push notifications for status updates

### Loading States
```
┌─────────────────────┐
│                     │
│  ░░░░░░░░░░░░░░░   │ ← Skeleton loader
│  ░░░░░░░░░          │
│  ░░░░░░░░░░░░░      │
│                     │
└─────────────────────┘
```

### Error States
```
┌─────────────────────┐
│                     │
│       😔           │
│   No Connection     │
│                     │
│ [Retry] [Offline Mode]│
│                     │
└─────────────────────┘
```

---

## 🔒 Accessibility

- Minimum touch target: 48x48px
- Color contrast ratio: 4.5:1 minimum
- Focus indicators for keyboard navigation
- Screen reader labels for icons
- Error messages below form fields
- Loading spinners with aria-live regions

---

## 📐 Information Architecture

```
UberTruck
├── Public
│   ├── Splash
│   ├── Login
│   └── Register
├── Shipper
│   ├── Dashboard
│   ├── Book Truck
│   ├── My Bookings
│   ├── Invoices
│   └── Profile
├── Carrier
│   ├── Dashboard
│   ├── Fleet Management
│   ├── Driver Management
│   ├── Bookings
│   └── Payments
├── Driver
│   ├── Dashboard
│   ├── Current Delivery
│   ├── Delivery History
│   └── Profile
└── Admin
    ├── Dashboard
    ├── Users
    ├── Bookings
    ├── Reports
    └── Settings
```

---

## 🎨 Material Design 3 Components

### For Android Native App
- **Navigation**: Bottom Navigation Bar (4 items max)
- **Lists**: Material Cards with elevation
- **Forms**: Outlined Text Fields
- **Feedback**: Snackbars for actions, Dialogs for confirmations
- **Loading**: Linear Progress Indicators
- **FAB**: For primary action (Create Booking)

---

## 📱 Mobile Gestures

- **Pull to Refresh**: Update booking list
- **Swipe to Delete**: Cancel bookings (with confirmation)
- **Long Press**: Quick actions menu
- **Pinch to Zoom**: Map views

---

## 🌈 Theme Variations

### Light Theme (Default)
- Background: #FFFFFF
- Surface: #F9FAFB
- Text: #111827

### Dark Theme
- Background: #111827
- Surface: #1F2937
- Text: #F9FAFB

---

## ✨ Micro-interactions

1. **Button Press**: Scale down to 0.95
2. **Card Tap**: Subtle elevation change
3. **Loading**: Pulsing animation
4. **Success**: Green checkmark animation
5. **Error**: Shake animation on invalid input

---

## 📋 Frozen Requirements Display

Always prominently show:
- "₹5/tonne/km - Fixed Rate"
- "18% GST Included"
- "Service Area: Nalgonda-Miryalguda Only"
- "Manual Payment Only"

These should appear in:
- Booking creation flow
- Invoice screens
- Help/FAQ sections
- Onboarding screens