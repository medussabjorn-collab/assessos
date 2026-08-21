# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Prelim
**Generated:** 2026-08-19 06:42:16
**Category:** B2B Service

---

## Global Rules

### Color Palette

This table reflects the actual live tokens in `app/globals.css`'s `:root` block, not the generic scaffold this file originally shipped with. Every value below has a light-mode default and flips automatically in dark mode (`:root[data-theme="dark"]` or `prefers-color-scheme:dark`) — see that file directly for the dark-mode hex values, not restated here to avoid a second place to drift.

| Role | Hex (light) | CSS Variable |
|------|-----|--------------|
| Background | `#FBFCFE` | `--bg` |
| Surface | `#FFFFFF` | `--surface` |
| Surface 2 | `#F3F5FA` | `--surface-2` |
| Ink (text) | `#0A0E17` | `--ink` |
| Ink 2 (secondary text) | `#414B63` | `--ink-2` |
| Border | `#E2E7F1` | `--line` |
| Accent (brand blue) | `#1F72B4` | `--accent` |
| Accent 2 (brand green) | `#5FA234` | `--accent-2` |
| CTA background (neutral-extreme) | `#14141A` | `--cta-bg` |
| CTA text | `#FFFFFF` | `--cta-ink` |

**Accent is switchable.** Four visitor-selectable palettes exist via `data-palette` on `<html>` — `corporate` (default, the accent hex above), `cobalt`, `emerald`, `copper` — each redefining `--accent`/`--accent-2` for both light and dark. `--cta-bg`/`--cta-ink` do **not** change with palette — the primary CTA is deliberately neutral, not brand-colored, in every palette and both themes (see Buttons below for why).

### Typography

- **Body/UI Font:** Plus Jakarta Sans (`--font-sans`) — weights 400–800, all body text and most headings.
- **Display Font:** Source Serif 4 (`--font-display`) — weight 600 only, used sparingly on ~11 prominent section headers (hero, page-hero, section heads, CTA banners) for editorial contrast against the sans-heavy rest of the page. Not used for body copy or minor headings.
- **Mono/Data Font:** JetBrains Mono (`--font-code`) — labels, data values, breadcrumbs.
- **Mood:** enterprise, evidence-based, defensible, restrained — not glossy-consumer, not dark-technical-dev-tool.
- **Weight discipline:** the blanket heading rule (`h1,h2,h3,h4`) sits at 600, not 700/800. Only the ~11 serif-treated prominent headers and a couple of section-specific rules go heavier; most component titles (card headings, list item titles) inherit the 600 base rather than re-asserting bold.

Both fonts are loaded via `next/font/google` in `app/layout.tsx` (not a `<link>`/`@import`) — do not add a Google Fonts CSS import, follow the existing `next/font` pattern for any future third face.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

Real implementation lives in `app/globals.css` (`.btn`/`.btn-primary`/`.btn-ghost`). The primary CTA is intentionally **neutral-extreme, not brand-colored** — near-black in light mode, near-white in dark mode (`--cta-bg`/`--cta-ink`), always the most opaque/confident element on the page rather than tinted with the switchable accent. Both primary and ghost buttons are full pills (`border-radius:100px`), not the rounded-rect this file originally specified — a deliberate departure from default-blue-rounded-rect, the most common SaaS button pattern, toward something more considered.

```css
.btn {
  padding: .72em 1.2em;
  border-radius: 100px;
  font-weight: 600;
  transition: transform .18s, box-shadow .2s, background .2s, border-color .2s, color .2s;
}
.btn-primary { background: var(--cta-bg); color: var(--cta-ink); }
.btn-ghost { background: var(--surface); color: var(--ink); border-color: var(--line-2); }
.btn:active { transform: scale(.97); }
.btn-primary:hover { transform: translateY(-2px); }
```

MUI's own `contained`/`colorPrimary` buttons (ContactForm, ROICalculator, StudentRegistration, StudentLogin submit buttons; Nav's "Book a demo") mirror this via a scoped `!important` override rather than solely through MUI's theme object — `@mui/material-nextjs`'s `AppRouterCacheProvider` doesn't reliably re-theme these on light/dark toggle (SSR-cached Emotion insertion order wins over the post-hydration theme rebuild), so the CSS override is the actual source of truth for these buttons' color, not `MuiShell`'s `palette.primary.main` alone. See the comment directly above `.MuiButton-contained.MuiButton-colorPrimary` in `globals.css` if extending this further.

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #0F172A;
  outline: none;
  box-shadow: 0 0 0 3px #0F172A20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Trust & Authority

**Keywords:** Certificates/badges displayed, expert credentials, case studies with metrics, before/after comparisons, industry recognition, security badges

**Best For:** Healthcare/medical landing pages, financial services, enterprise software, premium/luxury products, legal services

**Key Effects:** Badge hover effects, metric pulse animations, certificate carousel, smooth stat reveal

### Page Pattern

**Pattern Name:** Enterprise Gateway

- **Conversion Strategy:** Path selection (I am a...). Mega menu navigation. Trust signals prominent.
- **CTA Placement:** Contact Sales (Primary) + Login (Secondary)
- **Section Order:** 1. Hero (Video/Mission), 2. Solutions by Industry, 3. Solutions by Role, 4. Client Logos, 5. Contact Sales

### Navigation

Five top-level items, three of them mega-menus reusing the same `.mega`/`.mega-card`/`.mega-grid` CSS pattern (`components/Nav.tsx`): **Solutions** (3 hiring-type links), **Industries** (18 industries, existing/original pattern), **Platform** (Platform/Products/Tour). **Security** and **Pricing** stay flat, single-click — compliance and pricing are high-intent lookups that shouldn't sit behind a hover menu. Kept deliberately short: a prior version had 7 flat links plus a visitor-facing color-swatch picker plus a separate theme toggle plus sign-in links plus a CTA plus a hamburger — 15+ simultaneous affordances, which reads as cluttered/unpolished rather than as an enterprise product's restraint.

### Appearance control

Light/dark mode and the 4-palette accent switcher are merged into a single "Appearance" icon-button that opens a small popover on click (`.appearance-pop`), rather than being permanently visible in the nav bar. The underlying mechanism is unchanged from before: `data-theme`/`data-palette` attributes on `<html>`, persisted to `localStorage` under `prelim-theme`/`prelim-palette`, applied pre-paint by a no-flash inline script in `app/layout.tsx`. Only the trigger UI moved — do not reintroduce always-visible swatches in the primary nav; if a future page needs the palette picker inline (e.g. a settings page), reuse the existing `swatches()` render function in `Nav.tsx` rather than duplicating the palette list.

---

## Anti-Patterns (Do NOT Use)

- ❌ Playful design
- ❌ Hidden credentials
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
