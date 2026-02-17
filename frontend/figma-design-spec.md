# UberTruck India — Booking & Tracking
## Figma Design Specification Document

---

## 📁 Project Structure

```
UberTruck India — Booking & Tracking/
├── 📄 01 Wireframes
├── 📄 02 Visuals
├── 📄 03 Components
├── 📄 04 Prototypes
└── 📄 05 Design Tokens
```

---

## 🎨 Design Tokens

### Color System

```json
{
  "colors": {
    "primary": {
      "black": "#000000",
      "black-90": "#1A1A1A",
      "black-80": "#333333",
      "black-70": "#4D4D4D"
    },
    "accent": {
      "yellow": "#FFCA28",
      "yellow-light": "#FFE082",
      "yellow-dark": "#FFB300"
    },
    "neutral": {
      "white": "#FFFFFF",
      "gray-50": "#FAFAFA",
      "gray-100": "#F5F5F5",
      "gray-200": "#EEEEEE",
      "gray-300": "#E0E0E0",
      "gray-400": "#BDBDBD",
      "gray-500": "#9E9E9E",
      "gray-600": "#757575",
      "gray-700": "#616161",
      "gray-800": "#424242",
      "gray-900": "#212121"
    },
    "semantic": {
      "success": "#4CAF50",
      "warning": "#FF9800",
      "error": "#F44336",
      "info": "#2196F3"
    },
    "map": {
      "dark-bg": "#1A1A1A",
      "dark-roads": "#2D2D2D",
      "route-active": "#4285F4",
      "pin-shadow": "rgba(0,0,0,0.3)"
    }
  }
}
```

### Typography Scale

```json
{
  "typography": {
    "fontFamily": "SF Pro Display, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
    "scale": {
      "display": {
        "size": "32px",
        "lineHeight": "40px",
        "weight": 700
      },
      "headline": {
        "size": "24px",
        "lineHeight": "32px",
        "weight": 600
      },
      "title": {
        "size": "20px",
        "lineHeight": "28px",
        "weight": 600
      },
      "body-large": {
        "size": "16px",
        "lineHeight": "24px",
        "weight": 400
      },
      "body": {
        "size": "14px",
        "lineHeight": "20px",
        "weight": 400
      },
      "caption": {
        "size": "12px",
        "lineHeight": "16px",
        "weight": 400
      },
      "overline": {
        "size": "10px",
        "lineHeight": "14px",
        "weight": 500,
        "letterSpacing": "0.5px"
      }
    }
  }
}
```

### Spacing System

```json
{
  "spacing": {
    "xxs": "4px",
    "xs": "8px",
    "sm": "12px",
    "md": "16px",
    "lg": "20px",
    "xl": "24px",
    "xxl": "32px",
    "xxxl": "48px"
  }
}
```

### Elevation/Shadow Tokens

```json
{
  "elevation": {
    "0": "none",
    "1": "0px 1px 3px rgba(0,0,0,0.12)",
    "2": "0px 2px 6px rgba(0,0,0,0.16)",
    "3": "0px 4px 12px rgba(0,0,0,0.20)",
    "4": "0px 8px 24px rgba(0,0,0,0.24)",
    "5": "0px 16px 32px rgba(0,0,0,0.30)"
  }
}
```

### Border Radius

```json
{
  "borderRadius": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "24px",
    "full": "999px"
  }
}
```

---

## 📱 Screen Specifications

### Device Frames
- **Primary**: 360 × 800 (Standard Android)
- **Secondary**: 375 × 812 (iPhone X/11)
- **Large**: 412 × 915 (Large Android)
- **Tablet**: 768 × 1024 (iPad Mini)

---

## 🧩 Component Library

### 1. MapOverlayCard
```
Component: MapOverlayCard
├── Frame (Auto Layout)
│   ├── Padding: 16px
│   ├── Background: #FFFFFF
│   ├── Border Radius: 16px
│   ├── Shadow: elevation-3
│   └── Content
│       ├── Icon (24×24)
│       ├── Text (body-large)
│       └── Action (optional)
```

**Variants:**
- Default
- Expanded
- Minimized

### 2. TruckCard
```
Component: TruckCard
├── Frame (120×140)
│   ├── Border: 2px solid #E0E0E0
│   ├── Border Radius: 12px
│   ├── Padding: 12px
│   └── Layout (Vertical, Center)
│       ├── TruckImage (48×48)
│       ├── TruckName (title)
│       ├── Capacity (caption, gray-600)
│       ├── Price (body-large, bold)
│       └── ETA (caption, gray-500)
```

**States:**
- Default (border: gray-300)
- Selected (border: black, bg: gray-50)
- Disabled (opacity: 0.5)

### 3. BottomSheet
```
Component: BottomSheet
├── Frame (Full Width)
│   ├── Background: #FFFFFF
│   ├── Border Radius: 24px 24px 0 0
│   ├── Shadow: elevation-4
│   └── Content
│       ├── Handle (40×4, gray-400, centered)
│       ├── Header (optional)
│       ├── Body (scrollable)
│       └── Actions (sticky bottom)
```

**Variants:**
- Collapsed (200px height)
- Half (50vh)
- Expanded (80vh)

### 4. FloatingActionButton
```
Component: FAB
├── Frame (56×56)
│   ├── Background: #000000
│   ├── Border Radius: full
│   ├── Shadow: elevation-3
│   └── Icon (24×24, white, centered)
```

**States:**
- Default
- Pressed (scale: 0.95)
- Disabled (opacity: 0.5)

### 5. SafetyBadge
```
Component: SafetyBadge
├── Frame (Auto Layout, Horizontal)
│   ├── Background: #E3F2FD
│   ├── Border Radius: 8px
│   ├── Padding: 8px 12px
│   └── Content
│       ├── Icon (16×16, #2196F3)
│       └── Text (caption, #1976D2)
```

### 6. PaymentSelector
```
Component: PaymentSelector
├── Frame (Auto Layout)
│   ├── Background: #F5F5F5
│   ├── Border Radius: 8px
│   ├── Padding: 12px
│   └── Content
│       ├── PaymentIcon (20×20)
│       ├── PaymentMethod (body)
│       └── ChevronDown (16×16)
```

### 7. OTPModal
```
Component: OTPModal
├── Frame (280×200)
│   ├── Background: #FFF3E0
│   ├── Border Radius: 16px
│   ├── Padding: 20px
│   └── Content
│       ├── Title (body, center)
│       ├── OTPDisplay (display, #FF9800, letter-spacing: 8px)
│       └── Instructions (caption, gray-600)
```

### 8. ProgressStep
```
Component: ProgressStep
├── Frame (Auto Layout, Horizontal)
│   ├── StepIndicator
│   │   ├── Dot (12×12)
│   │   └── Line (2px width, variable height)
│   └── Content
│       ├── Title (body-large)
│       └── Time (caption, gray-600)
```

**States:**
- Pending (gray-400)
- Active (black, pulsing)
- Completed (success green)

### 9. DriverCard
```
Component: DriverCard
├── Frame (Auto Layout)
│   ├── Background: #FFFFFF
│   ├── Padding: 16px
│   └── Layout
│       ├── Avatar (60×60, rounded)
│       ├── DriverInfo
│       │   ├── Name (title)
│       │   ├── Vehicle (body, gray-600)
│       │   └── Rating (stars + value)
│       └── Actions
│           ├── CallButton (44×44)
│           └── MessageButton (44×44)
```

---

## 📱 Screen Designs

### Screen 1: Booking

```
Frame: Booking Screen (360×800)
├── MapView (Full Screen)
│   ├── MapBackground (gradient: #E8F5E9 → #C8E6C9)
│   ├── Roads (gray lines)
│   ├── PickupPin (black)
│   ├── DropPin (black outline)
│   └── Route (dashed line)
├── StatusBar (System)
├── Header (Fixed Top)
│   ├── MenuButton (40×40)
│   └── LocationInputCard
│       ├── PickupInput
│       └── DropInput
├── TimeSelector (Below Header)
└── BottomSheet
    ├── Handle
    ├── SafetyBadge
    ├── TruckCarousel (Horizontal Scroll)
    ├── FareBreakdown
    ├── PaymentSelector
    └── BookButton (Black, Full Width)
```

### Screen 2: Tracking

```
Frame: Tracking Screen (360×800)
├── DarkMapView (Full Screen)
│   ├── MapBackground (#1A1A1A)
│   ├── Roads (#2D2D2D)
│   ├── RouteProgress (animated)
│   ├── TruckMarker (moving)
│   └── LocationMarkers
├── Header (Gradient Overlay)
│   └── BackButton (40×40, glass)
└── BottomCard
    ├── Handle
    ├── DriverCard
    ├── OTPDisplay
    ├── ProgressTracker (5 steps)
    ├── LiveUpdates
    ├── ActionButtons
    └── SafetyFooter
```

---

## 🎬 Prototype Flows

### Main Flow
```
1. Booking Screen
   ↓ [Tap "Book Truck"]
2. Booking Confirmation (Toast/Modal)
   ↓ [Auto transition 2s]
3. Tracking Screen
   ↓ [Progress updates every 5s]
4. Delivery Complete
```

### Interactions

#### Horizontal Scroll (TruckCards)
- **Type**: Scroll
- **Direction**: Horizontal
- **Snap**: To center
- **Overscroll**: Bounce
- **Scroll indicators**: Hidden

#### Bottom Sheet Swipe
- **Gesture**: Drag
- **Direction**: Vertical
- **Breakpoints**:
  - Collapsed: 200px
  - Half: 50vh
  - Expanded: 80vh
- **Animation**: Spring (Tension: 200, Friction: 25)

#### Truck Movement Animation
- **Type**: Smart Animate
- **Duration**: 10000ms
- **Easing**: Linear
- **Loop**: Yes
- **Path**: Along route polyline

#### ETA Countdown
- **Type**: Timer
- **Update**: Every 60s
- **Format**: "X min" → "X-1 min"
- **Complete**: "Arrived"

---

## 🌏 Localization Specifications

### Currency Display
- Symbol: ₹ (Rupee)
- Format: ₹X,XXX
- Position: Before amount
- Decimal: Not shown for whole amounts

### Distance
- Unit: km (kilometers)
- Format: XX km
- Decimal: One place for <10km

### Time
- Format: 12-hour with AM/PM
- Date: DD/MM/YYYY

### Default Values
- Payment: "Cash"
- Language: English (Indian)
- Phone: +91 prefix

### GST Display
```
Base Fare: ₹2,250
GST (18%): ₹405
─────────────────
Total: ₹2,655
```

---

## ♿ Accessibility Guidelines

### Color Contrast
- **Body Text**: ≥4.5:1 against background
- **Large Text**: ≥3:1 against background
- **Interactive Elements**: ≥4.5:1

### Touch Targets
- **Minimum Size**: 48×48px
- **Spacing**: 8px between targets
- **Padding**: 12px for text buttons

### Labels
```
Button: aria-label="Book truck for ₹2,655"
Input: placeholder="Enter pickup location"
Icon: alt="Menu button"
Image: alt="10 tonne mini truck"
```

### Focus States
- **Outline**: 2px solid #4285F4
- **Offset**: 2px
- **Border Radius**: Inherit from element

---

## 📦 Export Specifications

### Icons (SVG)
```
/icons/
├── menu.svg (24×24)
├── back-arrow.svg (24×24)
├── phone.svg (20×20)
├── message.svg (20×20)
├── location-pin.svg (24×24)
├── truck.svg (32×32)
├── check.svg (16×16)
├── chevron-down.svg (16×16)
└── share.svg (20×20)
```

### Images (PNG)
```
/images/
├── driver-avatar-default.png (120×120)
├── truck-10t.png (96×96)
├── truck-15t.png (96×96)
├── truck-20t.png (96×96)
└── safety-badge-bg.png (320×80)
```

### Design Tokens (JSON)
```json
{
  "version": "1.0.0",
  "name": "UberTruck India",
  "format": "design-tokens",
  "tokens": {
    /* All tokens from above */
  }
}
```

---

## 🎯 Component Usage Guidelines

### Do's ✅
- Use 48px minimum touch targets
- Maintain 8px grid system
- Keep text contrast ≥4.5:1
- Use system fonts for better performance
- Show loading states for all async operations

### Don'ts ❌
- Don't use pure black on pure white
- Don't make buttons smaller than 44×44px
- Don't use more than 2 font weights per screen
- Don't hide critical information in collapsed states
- Don't auto-dismiss important notifications

---

## 📐 Grid System

### Mobile Grid (360px)
- Columns: 4
- Gutter: 16px
- Margin: 16px

### Tablet Grid (768px)
- Columns: 8
- Gutter: 24px
- Margin: 24px

---

## 🔄 State Management

### Component States
1. **Default**: Base state
2. **Hover**: Desktop only
3. **Pressed**: Scale 0.95
4. **Disabled**: Opacity 0.5
5. **Loading**: Spinner overlay
6. **Error**: Red border
7. **Success**: Green checkmark

### Screen States
1. **Loading**: Skeleton screens
2. **Empty**: Illustration + message
3. **Error**: Error message + retry
4. **Success**: Confirmation + next action
5. **Offline**: Cached data + sync badge

---

## 📝 Figma File Organization

```
Pages Structure:
├── 🎨 Cover
├── 📐 01 Wireframes
│   ├── Booking Flow
│   ├── Tracking Flow
│   └── Edge Cases
├── 🎨 02 Visuals
│   ├── Booking Screens
│   ├── Tracking Screens
│   └── Modals & Overlays
├── 🧩 03 Components
│   ├── Atoms
│   ├── Molecules
│   └── Organisms
├── 🔗 04 Prototypes
│   ├── Happy Path
│   ├── Error States
│   └── Animations
└── 🎯 05 Design Tokens
    ├── Colors
    ├── Typography
    ├── Spacing
    └── Shadows
```

---

## 🚀 Implementation Notes

### Performance Optimizations
- Lazy load map tiles
- Virtualize truck card list
- Debounce location search
- Cache driver photos
- Compress all images <100KB

### Platform Considerations
- **iOS**: Use native map view
- **Android**: Material Design shadows
- **Web**: Progressive enhancement
- **PWA**: Offline-first approach

---

This specification provides complete guidance for creating the Figma design. Each component is detailed with exact measurements, states, and behaviors matching Uber India's UI patterns while maintaining UberTruck's logistics focus.