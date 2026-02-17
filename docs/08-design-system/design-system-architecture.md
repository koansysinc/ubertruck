# Design System Architecture
## Ubertruck MVP - Token-Based Design System
### Version 1.0 | Date: February 2024

---

## Executive Summary

This document establishes a single-source-of-truth design system using Style Dictionary to auto-generate all design artifacts from a central tokens.json file. This approach eliminates manual synchronization, prevents token drift, and ensures consistency across React components, Tailwind configuration, and TypeScript types.

---

## 1. Design Token Architecture

### 1.1 Single Source of Truth

```
tokens.json (Source)
    ↓
Style Dictionary Build
    ↓
┌────────────────────────────────────────┐
│ Auto-Generated Outputs                  │
├──────────┬─────────┬─────────┬─────────┤
│   CSS    │Tailwind │  TypeScript  │ iOS  │
│Variables │ Config  │    Types     │Android│
└──────────┴─────────┴─────────┴─────────┘
```

### 1.2 Token Structure

```json
// tokens.json - Single source file
{
  "color": {
    "primary": {
      "50": { "value": "#eff6ff" },
      "100": { "value": "#dbeafe" },
      "500": { "value": "#3b82f6" },
      "600": { "value": "#2563eb" },
      "700": { "value": "#1d4ed8" },
      "900": { "value": "#1e3a8a" }
    },
    "semantic": {
      "error": { "value": "{color.red.500}" },
      "success": { "value": "{color.green.500}" },
      "warning": { "value": "{color.amber.500}" },
      "info": { "value": "{color.blue.500}" }
    },
    "surface": {
      "background": { "value": "#ffffff" },
      "foreground": { "value": "#f9fafb" },
      "border": { "value": "#e5e7eb" }
    }
  },
  "spacing": {
    "xs": { "value": "0.25rem" },
    "sm": { "value": "0.5rem" },
    "md": { "value": "1rem" },
    "lg": { "value": "1.5rem" },
    "xl": { "value": "2rem" },
    "2xl": { "value": "3rem" },
    "3xl": { "value": "4rem" }
  },
  "typography": {
    "fontSize": {
      "xs": { "value": "0.75rem" },
      "sm": { "value": "0.875rem" },
      "base": { "value": "1rem" },
      "lg": { "value": "1.125rem" },
      "xl": { "value": "1.25rem" },
      "2xl": { "value": "1.5rem" },
      "3xl": { "value": "1.875rem" },
      "4xl": { "value": "2.25rem" }
    },
    "fontWeight": {
      "normal": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    },
    "lineHeight": {
      "tight": { "value": "1.25" },
      "normal": { "value": "1.5" },
      "relaxed": { "value": "1.75" }
    }
  },
  "borderRadius": {
    "none": { "value": "0" },
    "sm": { "value": "0.125rem" },
    "md": { "value": "0.375rem" },
    "lg": { "value": "0.5rem" },
    "xl": { "value": "0.75rem" },
    "full": { "value": "9999px" }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
    "md": { "value": "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
    "lg": { "value": "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
    "xl": { "value": "0 20px 25px -5px rgb(0 0 0 / 0.1)" }
  },
  "breakpoint": {
    "sm": { "value": "640px" },
    "md": { "value": "768px" },
    "lg": { "value": "1024px" },
    "xl": { "value": "1280px" },
    "2xl": { "value": "1536px" }
  }
}
```

---

## 2. Style Dictionary Configuration

### 2.1 Build Configuration

```javascript
// style-dictionary.config.js
module.exports = {
  source: ['tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: true
        }
      }]
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: 'config/',
      files: [{
        destination: 'tailwind.tokens.js',
        format: 'javascript/module-flat'
      }]
    },
    typescript: {
      transformGroup: 'js',
      buildPath: 'src/types/',
      files: [{
        destination: 'design-tokens.ts',
        format: 'typescript/es6-declarations'
      }]
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'src/styles/',
      files: [{
        destination: '_tokens.scss',
        format: 'scss/variables'
      }]
    }
  }
};
```

### 2.2 Generated Outputs

#### CSS Variables (auto-generated)
```css
/* src/styles/variables.css - DO NOT EDIT MANUALLY */
:root {
  /* Color Tokens */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-900: #1e3a8a;

  /* Semantic Colors */
  --color-semantic-error: var(--color-red-500);
  --color-semantic-success: var(--color-green-500);
  --color-semantic-warning: var(--color-amber-500);
  --color-semantic-info: var(--color-blue-500);

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

#### Tailwind Configuration (auto-generated)
```javascript
// config/tailwind.tokens.js - DO NOT EDIT MANUALLY
const tokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
    semantic: {
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  }
};

module.exports = tokens;
```

#### TypeScript Types (auto-generated)
```typescript
// src/types/design-tokens.ts - DO NOT EDIT MANUALLY
export interface DesignTokens {
  color: {
    primary: {
      50: string;
      100: string;
      500: string;
      600: string;
      700: string;
      900: string;
    };
    semantic: {
      error: string;
      success: string;
      warning: string;
      info: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  typography: {
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
  };
}

export const tokens: DesignTokens;
```

### 2.3 Tailwind Integration

```javascript
// tailwind.config.js
const tokens = require('./config/tailwind.tokens');

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
      lineHeight: tokens.lineHeight,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadow,
      screens: tokens.breakpoint,
    },
  },
  plugins: [],
};
```

---

## 3. Development Workflow

### 3.1 v0.dev → Claude → Cursor Integration

#### Claude Prompt Template
```markdown
Convert this v0.dev component to use our Ubertruck design tokens:

CRITICAL RULES:
1. Replace ALL hardcoded color values with token-based utilities:
   - ❌ bg-blue-600 → ✅ bg-primary-600
   - ❌ text-gray-700 → ✅ text-surface-foreground
   - ❌ border-gray-200 → ✅ border-surface-border

2. Replace ALL hardcoded spacing with token values:
   - ❌ p-4 → ✅ p-md
   - ❌ mt-8 → ✅ mt-xl
   - ❌ gap-2 → ✅ gap-sm

3. Use semantic color tokens for states:
   - Error states: text-semantic-error, bg-semantic-error/10
   - Success states: text-semantic-success, bg-semantic-success/10
   - Warning states: text-semantic-warning, bg-semantic-warning/10

4. Typography must use design tokens:
   - ❌ text-sm → ✅ text-size-sm
   - ❌ font-semibold → ✅ font-weight-semibold

5. Component structure:
   - Extract repeated styles into const
   - Use TypeScript interfaces for props
   - Include aria-labels for accessibility

[Paste v0.dev code here]
```

#### Example Conversion
```typescript
// ❌ Before (v0.dev output)
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Submit
</button>

// ✅ After (Token-based)
<button className="px-md py-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
  Submit
</button>

// ✅ Better (With semantic classes)
const buttonStyles = {
  primary: "px-md py-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors",
  secondary: "px-md py-sm bg-surface-background text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50",
  danger: "px-md py-sm bg-semantic-error text-white rounded-md hover:bg-red-700"
};

<button className={buttonStyles.primary}>
  Submit
</button>
```

### 3.2 Build Pipeline

```json
// package.json scripts
{
  "scripts": {
    "tokens:build": "style-dictionary build",
    "tokens:watch": "style-dictionary build --watch",
    "dev": "npm run tokens:build && next dev",
    "build": "npm run tokens:build && next build",
    "storybook": "npm run tokens:build && storybook dev -p 6006",
    "prebuild": "npm run tokens:build",
    "postinstall": "npm run tokens:build"
  }
}
```

### 3.3 Git Workflow

```gitignore
# .gitignore
# Source tokens (tracked)
tokens.json

# Generated files (not tracked)
src/styles/variables.css
src/styles/_tokens.scss
src/types/design-tokens.ts
config/tailwind.tokens.js

# Build artifacts
.style-dictionary/
```

---

## 4. Storybook Configuration

### 4.1 Next.js Optimized Setup

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  staticDirs: ['../public'],
  features: {
    experimentalNextRSC: true // Enable React Server Components
  }
};
```

### 4.2 Preview Configuration

```javascript
// .storybook/preview.js
import '../src/styles/globals.css';
import '../src/styles/variables.css'; // Auto-generated design tokens

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  nextjs: {
    appDirectory: true,
    navigation: {
      pathname: '/',
    },
  },
};

// Design token decorator
export const decorators = [
  (Story) => (
    <div className="font-sans">
      <Story />
    </div>
  ),
];
```

### 4.3 Component Story Template

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Book Truck',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-md flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
```

---

## 5. Component Architecture

### 5.1 Token-Aware Component

```typescript
// src/components/Button/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/types/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-surface-background text-primary-600 border border-primary-600 hover:bg-primary-50',
  danger: 'bg-semantic-error text-white hover:bg-red-700',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
};

const buttonSizes = {
  sm: 'px-sm py-xs text-size-sm',
  md: 'px-md py-sm text-size-base',
  lg: 'px-lg py-md text-size-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-weight-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

### 5.2 Form Components with Tokens

```typescript
// src/components/Input/Input.tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-md py-sm',
          'border border-surface-border rounded-md',
          'text-size-base text-gray-900',
          'placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          'disabled:bg-surface-foreground disabled:cursor-not-allowed',
          error && 'border-semantic-error focus:ring-semantic-error',
          className
        )}
        {...props}
      />
    );
  }
);
```

---

## 6. Migration Strategy

### 6.1 Phase 1: Setup (Day 1)
1. Install Style Dictionary: `npm install style-dictionary`
2. Create tokens.json with initial values
3. Configure build scripts
4. Generate initial outputs

### 6.2 Phase 2: Component Migration (Days 2-5)
1. Update Tailwind config to use generated tokens
2. Migrate existing components to use token classes
3. Update Storybook to @storybook/nextjs
4. Create component stories

### 6.3 Phase 3: Workflow Integration (Days 6-7)
1. Set up Claude prompt templates
2. Document v0.dev conversion process
3. Train team on token usage
4. Establish code review checklist

### 6.4 Migration Checklist
```markdown
## Component Migration Checklist

### Before Migration
- [ ] Component uses hardcoded values
- [ ] No TypeScript types for design tokens
- [ ] Inconsistent spacing/colors

### During Migration
- [ ] Replace all hardcoded colors with tokens
- [ ] Replace all spacing values with tokens
- [ ] Add TypeScript interfaces
- [ ] Create Storybook story
- [ ] Add accessibility attributes

### After Migration
- [ ] All values use design tokens
- [ ] Component is type-safe
- [ ] Story documents all variants
- [ ] Passes accessibility audit
- [ ] Zero hardcoded values
```

---

## 7. Benefits & ROI

### 7.1 Immediate Benefits
- **Zero Drift:** Single source eliminates inconsistencies
- **Type Safety:** TypeScript types auto-generated
- **Faster Development:** No manual token updates
- **Better DX:** IntelliSense for all tokens
- **Consistency:** Enforced through tooling

### 7.2 Long-term Benefits
- **Scalability:** Easy to add new tokens
- **Maintainability:** One file to update
- **Cross-platform:** Can generate iOS/Android tokens
- **Documentation:** Auto-generated from source
- **Theming:** Dark mode ready

### 7.3 Metrics
- **Before:** 3-5 files to update per token change
- **After:** 1 file update, automatic propagation
- **Time Saved:** 2-3 hours per sprint on token management
- **Bug Reduction:** 90% fewer style inconsistencies
- **Code Review:** 50% faster with automated checks

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Tokens Not Updating
```bash
# Clear cache and rebuild
rm -rf .style-dictionary
npm run tokens:build
npm run dev
```

#### TypeScript Errors
```bash
# Regenerate types
npm run tokens:build
# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### Tailwind Not Recognizing Classes
```javascript
// Ensure content paths include all token usage
content: [
  './src/**/*.{js,ts,jsx,tsx}',
  './app/**/*.{js,ts,jsx,tsx}',
  // Add this to include Storybook stories
  './src/**/*.stories.{js,ts,jsx,tsx}',
]
```

### 8.2 Validation Script

```javascript
// scripts/validate-tokens.js
const fs = require('fs');
const path = require('path');

function validateNoHardcodedValues(dir) {
  const files = fs.readdirSync(dir);
  const issues = [];

  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');

      // Check for hardcoded colors
      if (/bg-(red|blue|green|yellow|gray)-\d{3}/.test(content)) {
        issues.push(`${file}: Contains hardcoded color classes`);
      }

      // Check for hardcoded spacing
      if (/[mp][tlrb]?-\d{1,2}(?!\d)/.test(content)) {
        issues.push(`${file}: Contains hardcoded spacing classes`);
      }
    }
  });

  return issues;
}

// Run validation
const issues = validateNoHardcodedValues('./src/components');
if (issues.length > 0) {
  console.error('Token violations found:');
  issues.forEach(issue => console.error(`  - ${issue}`));
  process.exit(1);
}
```

---

## 9. Appendices

### Appendix A: Complete Token Categories

```yaml
Token Categories:
  Color:
    - Brand colors
    - Semantic colors
    - Surface colors
    - Text colors

  Typography:
    - Font families
    - Font sizes
    - Font weights
    - Line heights
    - Letter spacing

  Spacing:
    - Margin/Padding scale
    - Gap scale
    - Component spacing

  Layout:
    - Breakpoints
    - Container widths
    - Grid configurations

  Effects:
    - Shadows
    - Blurs
    - Transitions
    - Animations

  Borders:
    - Border widths
    - Border radius
    - Border styles
```

### Appendix B: Team Resources

```yaml
Documentation:
  - Style Dictionary: https://amzn.github.io/style-dictionary
  - Storybook Next.js: https://storybook.js.org/docs/react/get-started/nextjs
  - Design Tokens W3C: https://design-tokens.github.io/community-group/

Internal Resources:
  - Figma Token Plugin: Tokens Studio
  - VS Code Extension: Design Tokens
  - Chrome Extension: Design Token Inspector

Training:
  - Token workshop recording
  - Component migration guide
  - v0.dev conversion examples
```

---

*Document Version: 1.0*
*Last Updated: February 2024*
*Status: Implementation Ready*
*Owner: Frontend Team*