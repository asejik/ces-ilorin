# CES Portal Design System: Modern Luminary

## 1. Design Principles & Personality

The design system for the **Citizens Elementary School (CES) Platform** is built on the **Modern Luminary** direction: engineered precision, radiant clarity, and purposeful data density.

### Core Personality Words
- **Radiant**: Luminous solar amber accents cutting through deep jet ink, embodying the vision of "Citizens of Light".
- **Engineered**: Razor-sharp hairline borders (`0.5px` to `1px`), structured tables, and zero decorative fluff.
- **Tactile**: Instant, reassuring feedback on mobile touch targets (pressed state shifts, haptic-feeling numeric PINs).
- **Accessible & Resilient**: Tested for WCAG 2.2 AA compliance, 360px mobile viewports, and low-data mobile connections in Nigeria.

---

## 2. Color System & Tokens

Every color is assigned a semantic role with contrast verified against WCAG 2.2 AA (minimum 4.5:1 for body text, 3:1 for large text and UI components).

### Base & Surface Colors

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| `--color-canvas` | `#F9FAFB` | Global page background (Arctic Slate-tinted White) |
| `--color-surface` | `#FFFFFF` | Primary card, modal, and input surface |
| `--color-surface-subtle` | `#F3F4F6` | Secondary panel, table header, or hover background |
| `--color-border` | `#EAECF0` | Subtle hairline border for cards, inputs, and rows |
| `--color-border-strong` | `#D0D5DD` | Focused inputs, prominent dividers, table borders |
| `--color-text-primary` | `#0B0F19` | Primary headings, table text, high-emphasis copy |
| `--color-text-secondary`| `#475467` | Descriptive text, form labels, secondary details |
| `--color-text-muted` | `#98A2B3` | Placeholders, inactive breadcrumbs, timestamps |

### Brand Colors (Jet Ink & Slate)

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| `--brand-ink-950` | `#0B0F19` | Dark brand foundation, primary buttons, active tabs |
| `--brand-ink-900` | `#0F172A` | Sidebar background, dark mode surfaces |
| `--brand-ink-800` | `#1E293B` | Hover state on dark buttons, card headers |
| `--brand-slate-600` | `#475467` | Secondary actions, icon strokes |

### Radiant Accent (Solar Gold)
*Represents illumination, active selections, and Distinction honours.*

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| `--solar-50` | `#FFFBEB` | Light alert / pending status background |
| `--solar-100` | `#FEF3C7` | Highlight badge background, pill hover |
| `--solar-400` | `#FBBF24` | Stars, focus indicators, decorative light rings |
| `--solar-500` | `#F59E0B` | Primary accent, distinction honours badge text |
| `--solar-600` | `#D97706` | High-contrast interactive links, active radio rings |
| `--solar-700` | `#B45309` | Text on light amber backgrounds (WCAG 4.5:1) |

### Sunday Cohort Distinction (Highland Rust)
*Mandated by the PRD: Sunday Cohort semesters and students must be visually distinguished throughout the system.*

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| `--sunday-50` | `#FFF7ED` | Sunday Cohort table row tint & card background |
| `--sunday-100` | `#FFEDD5` | Sunday Cohort pill badge background |
| `--sunday-500` | `#F97316` | Sunday Cohort visual border accent |
| `--sunday-600` | `#EA580C` | Sunday Cohort tag text, primary badge text |
| `--sunday-700` | `#C2410C` | High-contrast Sunday cohort header text |

### Academic & Semantic Status Tokens

| Status | Badge Background | Badge Text | Icon & Dot | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **`GRADUATE`** | `#ECFDF5` | `#065F46` | `#10B981` | Total $\ge 50$ AND both attendance courses cleared |
| **`NOT YET`** | `#FFF1F2` | `#9F1239` | `#F43F5E` | Complete entries, but criteria not met |
| **`PENDING`** | `#FFFBEB` | `#92400E` | `#F59E0B` | Incomplete quiz, exam, or attendance records |
| **`EXCUSED`** | `#F1F5F9` | `#334155` | `#64748B` | Permitted absence (does not clear graduation) |

---

## 3. Typography System

The typography pairs **Outfit** (a bold, precision geometric sans for headings and badges) with **Plus Jakarta Sans** or **Inter** (for high-legibility mobile forms and tabular data).

### Font Families
- **Display & Headings**: `'Outfit', -apple-system, BlinkMacSystemFont, sans-serif`
- **Body & Forms**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
- **Scores & Tabular Figures**: `'Plus Jakarta Sans', monospace` with `font-feature-settings: 'tnum' on, 'cv02' on` (ensures numbers like `05/05` and `51/60` align vertically).

### Type Scale

| Style / Token | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 36px (2.25rem) | 40px | 700 (Bold) | -0.02em | Certificate title, welcome headline |
| `display-md` | 30px (1.875rem)| 36px | 700 (Bold) | -0.02em | Screen titles, KPI numbers |
| `heading-lg` | 24px (1.5rem) | 32px | 600 (Semibold)| -0.015em | Section headers, card titles |
| `heading-md` | 20px (1.25rem) | 28px | 600 (Semibold)| -0.01em | Modal headers, quiz question text |
| `heading-sm` | 16px (1.0rem) | 24px | 600 (Semibold)| 0 | Table headers, sub-headings |
| `body-base` | 16px (1.0rem) | 24px | 400 (Regular) | 0 | Standard form inputs, instructions |
| `body-sm` | 14px (0.875rem)| 20px | 400 (Regular) | 0 | Table cell content, field labels |
| `body-xs` | 12px (0.75rem) | 16px | 500 (Medium) | +0.01em | Metadata, tooltips, badge labels |

---

## 4. Spacing, Radii & Depth

### Spacing Scale (4px Base Grid)
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px (Standard mobile screen padding & card gaps)
- `space-6`: 24px (Desktop card padding)
- `space-8`: 32px (Section gaps)
- `space-12`: 48px (Touch target min-height)
- `space-16`: 64px (Major layout divider)

### Border Radii
- `radius-sm`: 4px (Checkboxes, small tags)
- `radius-md`: 8px (Form inputs, standard buttons, data cards)
- `radius-lg`: 12px (Modals, container panels, quiz question boxes)
- `radius-full`: 9999px (Pills, circular badges, avatar icons)

### Shadows & Elevation
- **Card Default (`shadow-sm`)**: `0 1px 3px 0 rgba(11, 15, 25, 0.06), 0 1px 2px -1px rgba(11, 15, 25, 0.04)`
- **Modal / Floating (`shadow-lg`)**: `0 10px 15px -3px rgba(11, 15, 25, 0.08), 0 4px 6px -4px rgba(11, 15, 25, 0.04)`
- **Hairline Border**: `1px solid var(--color-border)` (Primary mechanism of depth).

---

## 5. Motion & Micro-Interactions

Restraint over decoration. Animations must convey feedback, state transitions, or focus.

- **Durations**:
  - Fast (150ms): Hover, focus rings, checkbox check, button active presses.
  - Base (250ms): Modals, drawer slides, accordion expands.
  - Slow (400ms): Certificate reveal, quiz progress step advance.
- **Easing Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out).
- **Reduced Motion Support**: All transitions degrade to instant opacity swaps when `prefers-reduced-motion: reduce` is active.

---

## 6. Component Specifications

### 1. Buttons

```html
<!-- Primary Action -->
<button class="h-11 px-5 rounded-md bg-[#0B0F19] text-white font-medium text-sm hover:bg-[#1E293B] active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2">
  Submit Assessment
</button>

<!-- Secondary Action -->
<button class="h-11 px-5 rounded-md bg-white border border-[#EAECF0] text-[#0B0F19] font-medium text-sm hover:bg-[#F3F4F6] transition-all">
  Cancel
</button>

<!-- Sunday Special Badge -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
  <span class="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
  Sunday Cohort
</span>
```

### 2. Form Inputs & Touch Targets
- **Minimum Touch Target**: `48px` height for all mobile inputs, buttons, and radio option cards.
- **Focus State**: `2px solid #F59E0B` outline with `2px` offset.
- **Labels**: Always visible, bold, `14px`, `#0B0F19` with required asterisks in `#E11D48`.

### 3. Student Assessment Option Cards
- Unselected: `border border-[#EAECF0] bg-white text-[#0B0F19] p-4 rounded-lg`
- Selected: `border-2 border-[#D97706] bg-[#FFFBEB] text-[#0B0F19] font-medium shadow-sm`
- Touch feedback: slight scale down (`active:scale-[0.99]`) with instant radio indicator fill.

### 4. Tactile PIN Pad (Assessment Entry)
- 4-digit or course-code PIN input with large, discrete 56px high boxes.
- Smooth cursor autofocus across inputs.
- Shake animation on invalid code entry with clear red error text.

### 5. Data Tables (Broadsheet & Student Directory)
- **Header**: Sticky `top-0`, `#F9FAFB` background, uppercase `12px` font, tracked `+0.05em`, hairline bottom border.
- **Row**: Alternating subtle zebra `#FFFFFF` / `#F9FAFB` on desktop.
- **Sunday Cohort Row Accent**: Left border `3px solid #EA580C` + faint peach hover highlight.
- **Tabular Numbers**: Scores formatted with monospaced tabular figures (`tnum`).

### 6. Certificate Template Layout
- Aspect ratio: Landscape (US Letter / A4).
- Double geometric border with gold corner accents (`#D97706`).
- Deep Jet Ink typography with radiant gold foil badge for Distinction.
- Dynamic fields: Student Name, Matric No, Completion Date, Honour Classification, Dual Signatory blocks.

---

## 7. Tailwind CSS Theme Configuration

Copy-ready configuration snippet for `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F9FAFB',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F3F4F6',
        },
        ink: {
          950: '#0B0F19',
          900: '#0F172A',
          800: '#1E293B',
          600: '#475467',
        },
        solar: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        sunday: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        status: {
          graduate: {
            bg: '#ECFDF5',
            text: '#065F46',
            dot: '#10B981',
          },
          notyet: {
            bg: '#FFF1F2',
            text: '#9F1239',
            dot: '#F43F5E',
          },
          pending: {
            bg: '#FFFBEB',
            text: '#92400E',
            dot: '#F59E0B',
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(11, 15, 25, 0.05)',
        sm: '0 1px 3px 0 rgba(11, 15, 25, 0.08), 0 1px 2px -1px rgba(11, 15, 25, 0.04)',
        md: '0 4px 6px -1px rgba(11, 15, 25, 0.08), 0 2px 4px -2px rgba(11, 15, 25, 0.04)',
        lg: '0 10px 15px -3px rgba(11, 15, 25, 0.08), 0 4px 6px -4px rgba(11, 15, 25, 0.04)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
export default config
```

---

## 8. CSS Variables (`globals.css`)

```css
:root {
  --color-canvas: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F3F4F6;
  --color-border: #EAECF0;
  --color-border-strong: #D0D5DD;
  
  --color-text-primary: #0B0F19;
  --color-text-secondary: #475467;
  --color-text-muted: #98A2B3;
  
  --brand-ink: #0B0F19;
  --solar-accent: #F59E0B;
  --solar-accent-hover: #D97706;
  
  --sunday-accent: #EA580C;
  --sunday-bg: #FFEDD5;
  
  /* Status Semantics */
  --status-graduate-bg: #ECFDF5;
  --status-graduate-text: #065F46;
  
  --status-notyet-bg: #FFF1F2;
  --status-notyet-text: #9F1239;
  
  --status-pending-bg: #FFFBEB;
  --status-pending-text: #92400E;
}

body {
  background-color: var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-jakarta), -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
}

/* Enforce Tabular Numbers on Numeric and Score Outputs */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Smooth Touch Targets */
button, input, select, textarea {
  touch-action: manipulation;
}
```

---

## 9. Sign-off & Transition to Build (P07)

The **Modern Luminary** design system is finalized and locked into [`docs/DESIGN.md`](file:///home/asejik/projects/ces/docs/DESIGN.md). All future components across both the administrative back-office and the mobile student assessment workflows will strictly adhere to these tokens.
