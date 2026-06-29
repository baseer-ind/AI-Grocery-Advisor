# Design System

## Principles

1. Familiar interaction patterns, original visual execution (see
   `legal-and-branding-safety.md`).
2. Each fictional brand gets its own accent palette layered on top of a
   shared neutral system — the app should feel like "many stores, one
   mall," not visually fragmented.
3. India-first: support Devanagari + Latin scripts, generous touch
   targets, low-bandwidth-friendly image sizes.

## Core tokens (app shell — not brand-specific)

- **Primary**: `#5B4FE5` (Dopamine Violet) — used for nav, primary CTAs
  outside of any specific brand context.
- **Secondary**: `#FF8A3D` (Ember Orange) — savings/celebration moments.
- **Success/Savings green**: `#1FAA59`.
- **Neutral scale**: `#0E0E12` → `#FFFFFF`, 10-step grey ramp.
- **Surface**: light/dark mode pair, dark mode default off (most
  competitor apps are light, but provide system-following dark theme).

## Typography

- Original variable font (e.g. a licensed/open font such as Inter or a
  custom Indic-aware family — never a brand's bespoke font). Latin +
  Devanagari weights: Regular/Medium/SemiBold/Bold.
- Type scale: Display 28/34, Title 20/26, Body 15/22, Caption 12/16.

## Per-brand theming

Each fictional `brand` row carries `primary_color`/`secondary_color`
(generated, contrast-checked ≥ 4.5:1 against white/black). Brand screens
(Category Home → Detail → Checkout) apply the brand accent to: app bar,
primary buttons, progress indicators. Shell chrome (bottom nav, system
savings ticker) always stays in the app-level palette so the user never
loses the sense of being inside one umbrella app.

## Motion

- Standard easing: `Curves.easeOutCubic`, 200–300ms for transitions.
- Original celebratory animation for completion/savings screens
  (confetti-style particle burst in app palette, not a copied Lottie from
  any real brand).
- Tracking screens use a simple animated progress rail (stage dots +
  connecting line filling), not a literal map clone of any real app.

## Accessibility

- WCAG AA contrast minimum across all brand themes (enforced at brand
  creation time via the admin tool, see `09-admin-dashboard.md`).
- Minimum 44x44dp touch targets, scalable text (supports OS text-scale up
  to 130% without layout breakage), VoiceOver/TalkBack labels on all
  interactive elements, especially icon-only buttons.

## Iconography

Single original icon set (consistent stroke width 1.5px, 24dp grid) for
all UI chrome. Category icons (🍔🛒✈️ etc. in the spec) are illustrative
placeholders only — production uses original glyphs, not emoji, in the
shipped app.
