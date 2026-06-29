# Development Plan & Milestones

Each milestone has an explicit exit criterion — nothing advances on a
calendar date alone.

## Milestone 0 — Foundations (Weeks 1–2)
- Repo scaffolds (this commit): backend skeleton, mobile skeleton, docs.
- Supabase project + auth providers configured (Google + Email).
- Postgres schema migrated (Alembic), Redis provisioned.
- CI: lint + type-check + test pipeline for both backend and mobile.
- **Exit criteria**: `docker-compose up` brings up API + DB + Redis
  locally; health-check endpoint returns 200; mobile app builds and shows
  splash screen.

## Milestone 1 — Auth & Onboarding (Weeks 3–4)
- Login (Google + Email), session exchange, onboarding flow, legal
  disclaimer, `users`/`user_settings`/`user_stats` tables live.
- **Exit criteria**: new user can sign up, complete onboarding, land on
  Home dashboard; stats row auto-created.

## Milestone 2 — Food Category Full Loop (Weeks 5–8)
- Catalog seeded (2–3 brands, ~30 listings), browse/detail/cart/checkout/
  tracking/savings-summary screens, savings calculation service.
- **Exit criteria**: a user can go from Home → Food → browse → cart →
  checkout → tracking → savings summary, fully working, with all funnel
  analytics events firing correctly (verified against
  `10-analytics-events.md`).

## Milestone 3 — Shopping Category + Profile Stats (Weeks 9–10)
- Generalize the commerce flow to a second category, confirming the
  shared-widget architecture holds. Profile shows money saved/orders
  avoided/streak.
- **Exit criteria**: MVP scope (`12-mvp-scope.md`) fully met; closed beta
  ready to ship.

## Milestone 4 — Closed Beta (Weeks 11–12)
- Ship to 500–1000 invited users, instrument dashboards, daily metrics
  review.
- **Exit criteria**: MVP exit criteria from `12-mvp-scope.md` hit, or a
  documented list of why-not + fixes in flight.

## Milestone 5 — V2 Build-out (Weeks 13–22)
- Per `13-v2-features.md`: remaining core categories, Discover/AI search,
  Wishlist/Moodboards, Social/Challenges, Admin analytics dashboard.
- **Exit criteria**: each feature ships behind a flag, A/B or staged
  rollout, individually measured against its own success metric before
  full rollout.

## Milestone 6 — Hardening & Launch Prep (Weeks 23–26)
- Security review against `17-security-architecture.md` checklist, load
  testing against `16-scalability-plan.md` growth triggers, App
  Store/Play Store submission with compliance checklist from
  `legal-and-branding-safety.md`.
- **Exit criteria**: store approval obtained in at least one platform;
  zero open P0/P1 security findings.

## Milestone 7 — GA Launch (Week 27+)
- Phased rollout per `15-launch-strategy.md`.
- **Exit criteria**: GA live pan-India, on-call/incident process active.

## Ongoing
- V3 features (`14-v3-features.md`) prioritized post-GA based on observed
  usage data, not assumed upfront.
- Technical debt log maintained in this repo (`docs/TECH_DEBT.md`, created
  when the first real debt item is incurred — not pre-created empty).
