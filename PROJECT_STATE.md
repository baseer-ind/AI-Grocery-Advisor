# Project State

Snapshot as of the architecture-hardening + readiness-documentation
work (PR #4, branch `claude/architecture-hardening`). See
`ARCHITECTURE.md` for the original feature roadmap,
`ARCHITECTURE_HARDENING.md` for the infrastructure work completed in
PR #4, and `docs/ARCHITECTURE_READINESS_REPORT.md` for the
forward-looking domain-architecture assessment.

## Completed Features

- **Product Search → Effective-Cost Pricing → AI Recommendation → UI**
  (the original vertical slice, PR #1): real Postgres-backed search,
  fee-aware pricing engine, five-recommendation engine, Next.js UI.
- **Pluggable price-provider architecture** (PR #2): `PriceProvider`
  interface, `CSVProvider`, `MockProvider`, real `BigBasketProvider`
  adapter, provider fan-out aggregator.
- **Bill Upload MVP** (PR #3): OCR (Tesseract + mock) → basket
  extraction → per-item provider recommendations, with bill-price
  comparison against live listings.
- **Architecture hardening** (PR #4, open):
  - Async provider fan-out (`asyncio.gather`), no more event-loop
    blocking on provider I/O.
  - Redis caching (60s TTL, fail-open) for search/recommendation
    results.
  - Location-aware pricing schema (`location_key` column + index) —
    schema/plumbing only, no location-aware provider implementation yet.
  - Background job framework: `arq` worker + `/bills/upload-async`
    (202 + polling) alongside the existing synchronous `/bills/upload`.
  - User foundation: `User` model + nullable ownership FKs on
    `BillUpload`/`Basket` — no auth flow yet.
  - Search scalability: `pg_trgm` GIN indexes on `products.name`/`brand`.
  - Alembic migration tooling initialized and wired to the async engine.
- **Architecture readiness documentation** (PR #5): Architecture
  Readiness Report, Dependency Map, 4 ADRs, this file — no code
  changes, per explicit instruction to review docs before any refactor.
- **User Identity and Authentication domain**: email/password
  + Google Sign-In auth, server-side session management (opaque
  tokens, immediate revocation on logout), password reset flow,
  `UserPreferences` (grocery/cashback preferences, membership tier),
  ownership association for async bill uploads, and bill/basket history
  endpoints. Partial Modularization refactor explicitly deferred again
  per instruction. See ADR-005.
- **Basket Comparison and Basket Optimization Engine** (this PR):
  `basket_optimization_engine.py` (pure, no-I/O) ranks platforms across
  an entire basket — current cost, cheapest platform, best-overall
  platform, multi-platform cherry-picked optimum, estimated savings —
  and produces four basket-level recommendations (Best Overall,
  Cheapest, Best Value, Fastest), each with a reason string.
  `basket_comparison_service.py` is the source-agnostic orchestration
  entry point: bill uploads, OCR-derived baskets, and now manually
  entered baskets (`POST /api/v1/baskets/compare`) all flow through the
  same pipeline. Comparison results persist as `BasketOptimization`
  (one JSON row per basket, same pattern as
  `BasketRecommendation`) when the caller is authenticated; anonymous
  comparisons still return a full result, just unsaved. New `GET
  /api/v1/baskets/{basket_id}/comparison` retrieves a saved result.
  `Basket.source`/`Basket.location_key` columns added (migration
  `e7a1c9d3f456`). See ADR-006.

## Pending Features

(Numbering matches `ARCHITECTURE.md`'s original roadmap.)

1. Basket Comparison (multi-platform optimal split) — implemented this
   PR (`basket_optimization_engine.py`/`basket_comparison_service.py`);
   covers bill-derived, OCR-derived, and manual baskets. Saved-basket
   favorites/history beyond raw `Basket` rows still not built.
2. Bill Upload Intelligence — OCR pipeline done; product-matching
   against a real catalog beyond the seed data is the remaining gap.
3. Personalized Profiles (auth, cashback rules) — auth flow and
   preferences now implemented (this PR); cashback *rules* (actual
   offer logic, not just storing a preference) still not built.
4. Offer Intelligence Engine — not built; flagged as the hardest
   data-acquisition problem in the product.
5. Review Intelligence — not built.
6. Smart Alternatives — not built.
7. Price History & Buy-Now-or-Wait — `PriceHistory` model exists;
   no snapshot job or trend classifier yet.
8. Price Alerts — not built; depends on Feature 7. User domain is now
   ready to attach this (new table + `user_id` FK, no `User` schema
   change needed).
9. Household Consumption Intelligence — not built; depends on Feature 2.
10. Direct Purchase Links — already implemented (`product_url` on
    every listing, no checkout automation, by design).
11. Conversational AI Assistant — not built; depends on Features 1–9.
12. WhatsApp / Voice / Recipe-to-Cart — not built; depends on the
    core engine + Basket Comparison.
13. Local Kirana & Community Price Intelligence — **design-only, not
    built**. Full architecture/schema/confidence-model proposal in
    `docs/adr/0007-community-price-intelligence.md`. **Superseded in
    part by ADR-008** (see #14): community price history is no longer a
    separate table, it's rows in ADR-008's unified `price_observations`
    table; ADR-007's confidence-tier/level model and ingestion-route
    plan are otherwise unchanged.
14. **Historical Price Intelligence — design-only, not built.** Full
    architecture/schema proposal in
    `docs/adr/0008-historical-price-intelligence.md`, written in
    response to the Competitive Analysis report
    (`docs/COMPETITIVE_ANALYSIS.md`) identifying this as the strongest
    long-term defensible asset in the category. Unifies and generalizes
    the existing `PriceHistory` model and ADR-007's community-history
    design into one `price_observations` table, source/confidence-aware
    from day one. ADR-008 recommends this be built **before** ADR-007's
    community-submission ingestion routes (not independently, as
    ADR-007 originally concluded), since ADR-007 now writes into the
    table this ADR defines.

## Current Architecture

Domain-separated service modules (Product, Pricing, Recommendation,
Bill Processing, User/Auth, Basket Comparison implemented;
Offers/Analytics not started) with a strict one-directional dependency
graph and zero circular dependencies (verified, see
`docs/DEPENDENCY_MAP.md`).
FastAPI HTTP layer is a thin adapter over framework-agnostic service
functions. Two runtime processes share Postgres + Redis: the API
process (request/response, including async bill-upload enqueue) and
the `arq` worker process (OCR + basket + recommendation building for
async bill uploads). Full diagram in
`docs/ARCHITECTURE_READINESS_REPORT.md`, Section 1.

## Open Risks

- **Live price data acquisition** is the hardest unsolved problem in
  the product — no public APIs from Blinkit/Zepto/Swiggy Instamart;
  sustained scraping has ToS/legal exposure. Affiliate/partnership
  feeds should be evaluated before investing in a scraper fleet.
- **Auth/identity layer now exists** (this PR) — unblocks Personalized
  Profiles, Price Alerts, and Partner APIs going forward. Remaining
  gap: no email-sending infra, so password reset tokens are only
  returned directly in development; production needs a transport
  before this flow is user-facing.
- **Cashback/offer rule data goes stale** — needs a refresh process,
  not a one-time seed, once built.
- **Bill-processing coordinator couples directly to concrete
  provider/OCR classes** rather than a registry — maintainability gap,
  not a correctness risk; documented in the readiness report.
- **Local Kirana & Community Price Intelligence is fully designed
  (ADR-007) but unbuilt** — not a current risk per se, but the longer it
  stays unbuilt the longer the product has no mitigation for the
  unsolved live-price-acquisition problem above; the sequencing decision
  is explicitly the user's, not made here.
- **Historical Price Intelligence is fully designed (ADR-008) but
  unbuilt** — per the Competitive Analysis report, this is the
  strongest available long-term moat (price history compounds and
  can't be backfilled by a later entrant) and the clock on that
  compounding doesn't start until the table exists and is being
  populated; ADR-008 recommends building this early, before ADR-007's
  ingestion routes, for that reason. Sequencing decision is still the
  user's to make, not assumed here.

## Technical Debt

- `bill_processing_service.py` imports concrete OCR classes
  directly instead of via a registry (price providers now go through
  `providers/registry.py`, added this PR since basket comparison needed
  the same provider list as bill processing — OCR has no second caller
  yet, so it wasn't pulled out; Recommendation: fix as part of Partial
  Modularization, not urgent on its own).
- Flat `services/` directory interleaves multiple domains in one
  directory listing (discoverability cost, not a correctness issue).
- No formal Impact Analysis process applied to past PRs — template now
  exists (`docs/ARCHITECTURE_READINESS_REPORT.md`, Section 9); applied
  to this PR (see PR description) going forward.
- Synchronous `/bills/upload` path still doesn't persist
  `Basket`/`BasketItem`/`BasketRecommendation` rows (only the async
  path does) — parity or retirement is an open decision, not yet made.
  Ownership association in this PR therefore only applies to the async
  path.
- No email-sending infrastructure — password reset tokens are only
  returned directly to the client in development; production needs a
  transport before the reset flow is usable end-to-end.

## Roadmap (near-term, suggested sequencing)

1. **Historical Price Intelligence (Feature 14, ADR-008) — design
   complete, recommended as the next implementation priority** per the
   Competitive Analysis report's defensibility ranking and ADR-008's
   own "start the data-compounding clock early" argument. ADR-008
   recommends this precede Community Price Intelligence's ingestion
   routes (a change from ADR-007's original "ship in either order"
   conclusion), since the two are now one unified schema.
2. Local Kirana & Community Price Intelligence (Feature 13, ADR-007) —
   design complete; confidence-tier/level model unchanged, but its
   ingestion routes should land after #1 per ADR-008.
3. Review and decide on the Architecture Readiness Report's
   recommendation (Partial Modularization) before any further service
   restructuring — still deferred, per instruction.
4. Basket Comparison (Feature 1) — **implemented**
   (`basket_optimization_engine.py`/`basket_comparison_service.py`).
5. Resolve the data-acquisition strategy for live prices
   (affiliate/partnership feed evaluation) before scaling provider
   coverage further.
6. Household Consumption Intelligence (Feature 9) — explicitly flagged
   in ADR-008 §6 as the next design needed after Historical Price
   Intelligence, since the two together (price + behavior) are what
   produce the "household purchase advisor" recommendations described
   in the product-vision reframing (see `ARCHITECTURE.md`).

## Recommended Next Priorities

1. **Decide on Historical Price Intelligence sequencing** (ADR-008) —
   the Competitive Analysis report's top-ranked defensibility item;
   ADR-008 recommends building it before Community Price
   Intelligence's ingestion routes. This is the most consequential
   open decision right now.
2. Decide on Community Price Intelligence sequencing (ADR-007) relative
   to #1 above.
3. Decide on Architecture Readiness Report recommendation (approve/
   modify/reject Partial Modularization) — still pending.
4. Live price data-acquisition strategy decision (affiliate vs.
   scraping vs. status quo).
5. Email-sending infrastructure, to make password reset production-ready.
6. Formal adoption of the Impact Analysis template for all new PRs.
