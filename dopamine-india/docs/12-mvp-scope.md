# MVP Scope

## Goal

Prove the core loop ("browse → simulate purchase → see savings") is
sticky enough to retain users, with the smallest surface area.

## In scope

- Auth: Email + Google only (defer Apple/OTP to post-MVP — still listed
  in IA but feature-flagged off).
- Onboarding: name, city, state, language (en/hi), interests.
- **One full category**: Food delivery (2–3 fictional brands, ~30 seeded
  restaurants/menus) — the entire flow end-to-end including tracking
  animation and savings summary.
- **One partial category for breadth signal**: Shopping (browse + cart +
  checkout, simplified tracking) — proves the generic commerce flow
  generalizes beyond food.
- Home dashboard with full category grid, but only Food/Shopping are
  tappable — others show "Coming soon" (validates interest signal via
  taps on disabled tiles).
- Profile: money saved, orders avoided, current streak only (defer
  calories/carbon/category-coverage stats).
- Basic text search within the two live categories (defer AI/voice
  search).
- Analytics: full funnel events from `10-analytics-events.md` for the two
  live categories, wired to a dashboard from day one.
- Legal disclaimer + minimal admin tool (catalog CRUD only, no analytics
  UI yet — use SQL/metabase for early metrics).

## Explicitly deferred

- Wishlist/Moodboards, Social/Challenges, all other categories, AI search/
  AI moodboard generation, Apple/OTP login, calories/carbon stats,
  achievements, admin analytics UI.

## Exit criteria (promote to Phase 2)

- D7 retention ≥ 20% in closed beta.
- ≥ 60% of users who add to cart reach the savings-summary screen.
- No P0/P1 bugs open in the checkout/tracking simulation for 1 week.
