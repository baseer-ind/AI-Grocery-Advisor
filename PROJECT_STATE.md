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
- **Architecture readiness documentation** (this PR): Architecture
  Readiness Report, Dependency Map, 4 ADRs, this file — no code
  changes, per explicit instruction to review docs before any refactor.

## Pending Features

(Numbering matches `ARCHITECTURE.md`'s original roadmap.)

1. Basket Comparison (multi-platform optimal split) — not built.
2. Bill Upload Intelligence — OCR pipeline done; product-matching
   against a real catalog beyond the seed data is the remaining gap.
3. Personalized Profiles (auth, cashback rules) — schema placeholder
   only (`User` model); no auth flow, no service layer.
4. Offer Intelligence Engine — not built; flagged as the hardest
   data-acquisition problem in the product.
5. Review Intelligence — not built.
6. Smart Alternatives — not built.
7. Price History & Buy-Now-or-Wait — `PriceHistory` model exists;
   no snapshot job or trend classifier yet.
8. Price Alerts — not built; depends on Feature 7.
9. Household Consumption Intelligence — not built; depends on Feature 2.
10. Direct Purchase Links — already implemented (`product_url` on
    every listing, no checkout automation, by design).
11. Conversational AI Assistant — not built; depends on Features 1–9.
12. WhatsApp / Voice / Recipe-to-Cart — not built; depends on the
    core engine + Basket Comparison.

## Current Architecture

Domain-separated service modules (Product, Pricing, Recommendation,
Bill Processing implemented; User schema-only; Offers/Analytics not
started) with a strict one-directional dependency graph and zero
circular dependencies (verified, see `docs/DEPENDENCY_MAP.md`).
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
- **No auth/identity layer at all** — blocks Personalized Profiles,
  Price Alerts (need to know whose alert), and Partner APIs (need API
  keys). Cheap to build now, expensive to retrofit once there's real
  user data to migrate.
- **Cashback/offer rule data goes stale** — needs a refresh process,
  not a one-time seed, once built.
- **Bill-processing coordinator couples directly to concrete
  provider/OCR classes** rather than a registry — maintainability gap,
  not a correctness risk; documented in the readiness report.

## Technical Debt

- `bill_processing_service.py` imports concrete provider/OCR classes
  directly instead of via a registry (Recommendation: fix as part of
  Partial Modularization, not urgent on its own).
- Flat `services/` directory interleaves multiple domains in one
  directory listing (discoverability cost, not a correctness issue).
- No formal Impact Analysis process applied to past PRs — template now
  exists (`docs/ARCHITECTURE_READINESS_REPORT.md`, Section 9) to apply
  going forward.
- Synchronous `/bills/upload` path still doesn't persist
  `Basket`/`BasketItem`/`BasketRecommendation` rows (only the async
  path does) — parity or retirement is an open decision, not yet made.

## Roadmap (near-term, suggested sequencing)

1. Review and decide on the Architecture Readiness Report's
   recommendation (Partial Modularization) before any further service
   restructuring.
2. Build the User/auth domain (schema already exists) — highest
   leverage scalability item per the readiness report, and a
   prerequisite for Personalized Profiles, Price Alerts, Partner APIs.
3. Basket Comparison (Feature 1) — extends the existing pricing engine
   per-item; no new infrastructure needed.
4. Resolve the data-acquisition strategy for live prices
   (affiliate/partnership feed evaluation) before scaling provider
   coverage further.
5. Price History snapshot job + trend classifier (Feature 7), as the
   prerequisite for Price Alerts (Feature 8).

## Recommended Next Priorities

1. Decide on Architecture Readiness Report recommendation (approve/
   modify/reject Partial Modularization).
2. Auth/User domain implementation.
3. Live price data-acquisition strategy decision (affiliate vs.
   scraping vs. status quo).
4. Basket Comparison feature.
5. Formal adoption of the Impact Analysis template for all new PRs.
