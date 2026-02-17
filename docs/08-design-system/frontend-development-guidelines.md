# Frontend Development Guidelines
## Ubertruck MVP - Component Development Workflow
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document establishes the frontend development workflow for Ubertruck MVP, focusing on the v0.dev → Claude → Cursor pipeline with strict token-based design system adherence. All components must use design tokens exclusively, with zero hardcoded values.

---

## 1. Development Workflow

### 1.1 Component Creation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   v0.dev    │───>│   Claude    │───>│   Cursor    │───>│  Storybook  │
│  (Initial)  │    │ (Transform) │    │  (Refine)   │    │   (Test)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                   │                   │
       ▼                  ▼                   ▼                   ▼
  Rapid Prototype    Token Conversion    Type Safety       Visual Testing
```

### 1.2 Step-by-Step Process

#### Step 1: v0.dev Generation
```markdown
Prompt for v0.dev:
"Create a booking card component for a logistics platform that shows:
- Pickup and delivery locations
- Weight and cargo type
- Price
- Status badge
- Action buttons (view details, cancel)
Use a clean, professional design"
```

#### Step 2: Claude Transformation

```markdown
# Claude Prompt Template

Transform this v0.dev component for Ubertruck:

## Context
We use a token-based design system with Style Dictionary. All values must use tokens.

## Token Mapping Rules
COLORS:
- bg-blue-* → bg-primary-*
- bg-gray-* → bg-surface-*
- text-red-* → text-semantic-error
- text-green-* → text-semantic-success
- border-gray-* → border-surface-border

SPACING:
- p-1 → p-xs
- p-2 → p-sm
- p-4 → p-md
- p-6 → p-lg
- p-8 → p-xl
- m-*, mt-*, mb-*, ml-*, mr-* → use token equivalents

TYPOGRAPHY:
- text-xs → text-size-xs
- text-sm → text-size-sm
- text-base → text-size-base
- text-lg → text-size-lg
- font-medium → font-weight-medium
- font-semibold → font-weight-semibold

BORDERS:
- rounded → rounded-md
- rounded-lg → rounded-lg
- rounded-full → rounded-full

## Requirements
1. Convert to TypeScript with proper interfaces
2. Use our design tokens exclusively
3. Add proper ARIA labels
4. Extract styles into semantic constants
5. Make responsive with mobile-first approach

[Paste v0.dev code here]
```

#### Step 3: Cursor Refinement
```typescript
// Instructions for Cursor
// 1. Add comprehensive TypeScript types
// 2. Implement proper error states
// 3. Add loading skeletons
// 4. Include unit tests
// 5. Optimize for performance (memo where needed)
```

#### Step 4: Storybook Documentation
```typescript
// Create comprehensive stories showing:
// - All component states
// - Interactive controls
// - Accessibility checks
// - Mobile/tablet/desktop views
// - Dark mode variants (if applicable)
```

---

## 2. Component Standards

### 2.1 File Structure

```
src/components/
├── BookingCard/
│   ├── BookingCard.tsx          // Component
│   ├── BookingCard.styles.ts    // Style constants
│   ├── BookingCard.types.ts     // TypeScript interfaces
│   ├── BookingCard.test.tsx     // Unit tests
│   ├── BookingCard.stories.tsx  // Storybook stories
│   └── index.ts                 // Barrel export
```

### 2.2 Component Template

```typescript
// BookingCard.types.ts
export interface BookingCardProps {
  id: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  weight: number;
  cargoType: string;
  price: number;
  status: BookingStatus;
  onViewDetails?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export interface Location {
  city: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-transit'
  | 'delivered'
  | 'cancelled';
```

```typescript
// BookingCard.styles.ts
export const bookingCardStyles = {
  container: 'bg-surface-background border border-surface-border rounded-lg p-lg shadow-sm hover:shadow-md transition-shadow',
  header: 'flex justify-between items-start mb-md',
  title: 'text-size-lg font-weight-semibold text-gray-900',
  status: {
    pending: 'bg-amber-50 text-semantic-warning px-sm py-xs rounded-md text-size-xs font-weight-medium',
    confirmed: 'bg-blue-50 text-semantic-info px-sm py-xs rounded-md text-size-xs font-weight-medium',
    'in-transit': 'bg-indigo-50 text-indigo-700 px-sm py-xs rounded-md text-size-xs font-weight-medium',
    delivered: 'bg-green-50 text-semantic-success px-sm py-xs rounded-md text-size-xs font-weight-medium',
    cancelled: 'bg-red-50 text-semantic-error px-sm py-xs rounded-md text-size-xs font-weight-medium',
  },
  locationSection: 'space-y-sm mb-md',
  locationRow: 'flex items-center gap-sm',
  locationIcon: 'w-5 h-5 text-gray-400',
  locationText: 'text-size-base text-gray-700',
  detailsGrid: 'grid grid-cols-3 gap-md mb-lg',
  detailItem: 'space-y-xs',
  detailLabel: 'text-size-xs text-gray-500',
  detailValue: 'text-size-sm font-weight-medium text-gray-900',
  priceSection: 'flex justify-between items-center pt-md border-t border-surface-border',
  price: 'text-size-xl font-weight-semibold text-primary-600',
  actions: 'flex gap-sm',
} as const;
```

```typescript
// BookingCard.tsx
import { FC, memo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Package, Truck } from 'lucide-react';
import { Button } from '@/components/Button';
import { BookingCardProps } from './BookingCard.types';
import { bookingCardStyles as styles } from './BookingCard.styles';

export const BookingCard: FC<BookingCardProps> = memo(({
  id,
  pickupLocation,
  deliveryLocation,
  weight,
  cargoType,
  price,
  status,
  onViewDetails,
  onCancel,
  className
}) => {
  const handleViewDetails = () => onViewDetails?.(id);
  const handleCancel = () => onCancel?.(id);

  return (
    <article
      className={cn(styles.container, className)}
      aria-label={`Booking from ${pickupLocation.city} to ${deliveryLocation.city}`}
    >
      <header className={styles.header}>
        <h3 className={styles.title}>Booking #{id.slice(-6)}</h3>
        <span className={styles.status[status]} role="status">
          {status.replace('-', ' ')}
        </span>
      </header>

      <div className={styles.locationSection}>
        <div className={styles.locationRow}>
          <MapPin className={styles.locationIcon} aria-hidden="true" />
          <span className={styles.locationText}>
            {pickupLocation.city}, {pickupLocation.state}
          </span>
        </div>
        <div className={styles.locationRow}>
          <Truck className={styles.locationIcon} aria-hidden="true" />
          <span className={styles.locationText}>
            {deliveryLocation.city}, {deliveryLocation.state}
          </span>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <dt className={styles.detailLabel}>Weight</dt>
          <dd className={styles.detailValue}>{weight} tonnes</dd>
        </div>
        <div className={styles.detailItem}>
          <dt className={styles.detailLabel}>Cargo Type</dt>
          <dd className={styles.detailValue}>{cargoType}</dd>
        </div>
        <div className={styles.detailItem}>
          <dt className={styles.detailLabel}>Distance</dt>
          <dd className={styles.detailValue}>40 km</dd>
        </div>
      </div>

      <footer className={styles.priceSection}>
        <div>
          <span className={styles.detailLabel}>Total Price</span>
          <p className={styles.price}>₹{price.toLocaleString('en-IN')}</p>
        </div>
        <div className={styles.actions}>
          {status !== 'cancelled' && status !== 'delivered' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              aria-label={`Cancel booking ${id}`}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleViewDetails}
            aria-label={`View details for booking ${id}`}
          >
            View Details
          </Button>
        </div>
      </footer>
    </article>
  );
});

BookingCard.displayName = 'BookingCard';
```

### 2.3 Style Guidelines

#### DO's ✅
```typescript
// Use design tokens
className="bg-primary-600 text-white"
className="p-md mb-lg"
className="text-size-base font-weight-medium"
className="border-surface-border"
className="shadow-md rounded-lg"

// Use semantic class names
const statusStyles = {
  success: 'bg-semantic-success/10 text-semantic-success',
  error: 'bg-semantic-error/10 text-semantic-error',
};

// Extract repeated patterns
const cardStyles = 'bg-surface-background rounded-lg p-lg shadow-sm';
```

#### DON'Ts ❌
```typescript
// Hardcoded colors
className="bg-blue-600 text-white"
className="border-gray-200"

// Hardcoded spacing
className="p-4 mb-6"
className="mt-8 ml-2"

// Inline styles
style={{ padding: '16px', marginBottom: '24px' }}

// Magic numbers
className="w-[240px] h-[180px]"
```

---

## 3. Quality Checklist

### 3.1 Pre-Commit Checklist

```markdown
## Component Quality Checklist

### Design Tokens ✓
- [ ] All colors use design tokens
- [ ] All spacing uses design tokens
- [ ] All typography uses design tokens
- [ ] No hardcoded values anywhere
- [ ] Validated with token linter

### TypeScript ✓
- [ ] Proper interfaces for all props
- [ ] No `any` types
- [ ] Proper generics where applicable
- [ ] JSDoc comments for complex logic

### Accessibility ✓
- [ ] Proper ARIA labels
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast passes WCAG AA
- [ ] Focus states visible

### Performance ✓
- [ ] Component is memoized if needed
- [ ] No unnecessary re-renders
- [ ] Images are optimized
- [ ] Code splitting considered

### Testing ✓
- [ ] Unit tests written
- [ ] Storybook story created
- [ ] All states documented
- [ ] Edge cases covered
- [ ] Error states handled

### Mobile ✓
- [ ] Responsive design tested
- [ ] Touch targets adequate (44x44px)
- [ ] Works on small screens (320px)
- [ ] Performance on 3G tested
```

### 3.2 Code Review Template

```markdown
## Code Review Checklist

### Token Compliance
- [ ] No hardcoded colors found
- [ ] No hardcoded spacing found
- [ ] Uses semantic token names
- [ ] Follows token naming convention

### Component Architecture
- [ ] Single responsibility principle
- [ ] Props interface is clean
- [ ] Composition over inheritance
- [ ] Proper separation of concerns

### Best Practices
- [ ] Error boundaries implemented
- [ ] Loading states included
- [ ] Empty states handled
- [ ] Proper error messages

### Documentation
- [ ] Props documented
- [ ] Storybook story complete
- [ ] README updated if needed
- [ ] Complex logic commented
```

---

## 4. Common Patterns

### 4.1 Form Components

```typescript
// Consistent form field pattern
export const FormField: FC<FormFieldProps> = ({
  label,
  error,
  required,
  children
}) => (
  <div className="space-y-xs">
    <label className="text-size-sm font-weight-medium text-gray-700">
      {label}
      {required && <span className="text-semantic-error ml-xs">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-size-xs text-semantic-error" role="alert">
        {error}
      </p>
    )}
  </div>
);
```

### 4.2 Status Indicators

```typescript
// Reusable status badge
export const StatusBadge: FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeStyles = {
    sm: 'px-xs py-xs text-size-xs',
    md: 'px-sm py-xs text-size-sm',
    lg: 'px-md py-sm text-size-base',
  };

  const statusStyles = {
    active: 'bg-semantic-success/10 text-semantic-success',
    pending: 'bg-semantic-warning/10 text-semantic-warning',
    inactive: 'bg-gray-100 text-gray-600',
    error: 'bg-semantic-error/10 text-semantic-error',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-weight-medium',
        sizeStyles[size],
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
};
```

### 4.3 Loading States

```typescript
// Consistent skeleton loader
export const BookingCardSkeleton: FC = () => (
  <div className="bg-surface-background border border-surface-border rounded-lg p-lg animate-pulse">
    <div className="flex justify-between mb-md">
      <div className="h-6 bg-gray-200 rounded w-32" />
      <div className="h-6 bg-gray-200 rounded w-20" />
    </div>
    <div className="space-y-sm mb-md">
      <div className="h-5 bg-gray-200 rounded w-48" />
      <div className="h-5 bg-gray-200 rounded w-48" />
    </div>
    <div className="grid grid-cols-3 gap-md mb-lg">
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
    <div className="h-12 bg-gray-200 rounded" />
  </div>
);
```

---

## 5. Migration Guide

### 5.1 Converting Existing Components

#### Before (Hardcoded)
```tsx
// ❌ Old component with hardcoded values
<div className="p-4 mb-6 bg-blue-600 text-white rounded-lg">
  <h2 className="text-xl font-bold mb-2">Booking Details</h2>
  <p className="text-sm text-gray-300">Weight: 10 tonnes</p>
</div>
```

#### After (Token-based)
```tsx
// ✅ Migrated component with tokens
<div className="p-md mb-lg bg-primary-600 text-white rounded-lg">
  <h2 className="text-size-xl font-weight-bold mb-sm">Booking Details</h2>
  <p className="text-size-sm text-gray-300">Weight: 10 tonnes</p>
</div>
```

### 5.2 VS Code Snippets

```json
// .vscode/ubertruck.code-snippets
{
  "Ubertruck Component": {
    "prefix": "utcomp",
    "body": [
      "import { FC, memo } from 'react';",
      "import { cn } from '@/lib/utils';",
      "import { ${1:ComponentName}Props } from './${1:ComponentName}.types';",
      "import { ${2:componentName}Styles as styles } from './${1:ComponentName}.styles';",
      "",
      "export const ${1:ComponentName}: FC<${1:ComponentName}Props> = memo(({",
      "  ${3:props}",
      "}) => {",
      "  return (",
      "    <div className={cn(styles.container)}>",
      "      ${4:content}",
      "    </div>",
      "  );",
      "});",
      "",
      "${1:ComponentName}.displayName = '${1:ComponentName}';"
    ]
  },
  "Token Color": {
    "prefix": "tc",
    "body": "text-${1|primary,semantic-error,semantic-success,semantic-warning,surface|}-${2:500}"
  },
  "Token Spacing": {
    "prefix": "ts",
    "body": "${1|p,m,px,py,mx,my,mt,mb,ml,mr|}-${2|xs,sm,md,lg,xl,2xl,3xl|}"
  }
}
```

---

## 6. Tooling Setup

### 6.1 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent hardcoded values
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXAttribute[name.name="className"][value.value=/bg-(red|blue|green|yellow|gray)-\\d{3}/]',
        message: 'Use design tokens instead of hardcoded color classes',
      },
      {
        selector: 'JSXAttribute[name.name="className"][value.value=/[mp][tlrbxy]?-\\d{1,2}/]',
        message: 'Use design token spacing instead of hardcoded values',
      },
    ],
  },
};
```

### 6.2 Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run type-check && npm run test",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "validate-tokens": "node scripts/validate-tokens.js"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run pre-commit && npm run validate-tokens"
    }
  }
}
```

---

## 7. Team Training

### 7.1 Onboarding Checklist

```markdown
## New Developer Onboarding

### Day 1: Setup
- [ ] Install Style Dictionary
- [ ] Run token build
- [ ] Review design system docs
- [ ] Install VS Code extensions

### Day 2: Practice
- [ ] Create component from v0.dev
- [ ] Transform with Claude
- [ ] Refine in Cursor
- [ ] Create Storybook story

### Day 3: Review
- [ ] Code review with team
- [ ] Discuss token usage
- [ ] Review common patterns
- [ ] Q&A session
```

### 7.2 Resources

```yaml
Internal Documentation:
  - Design System Architecture: /docs/08-design-system/
  - Component Library: Storybook at localhost:6006
  - Token Reference: /tokens.json

External Resources:
  - v0.dev: https://v0.dev
  - Claude: https://claude.ai
  - Cursor: https://cursor.sh
  - Style Dictionary: https://amzn.github.io/style-dictionary

Training Videos:
  - Component Development Workflow: [Internal Link]
  - Token System Deep Dive: [Internal Link]
  - Storybook Best Practices: [Internal Link]
```

---

*Document Version: 1.0*
*Last Updated: February 2024*
*Status: Active*
*Owner: Frontend Team Lead*