# Architecture & Roadmap

> See [`ARCHITECTURE_HARDENING.md`](./ARCHITECTURE_HARDENING.md) for the
> async/caching/migration/background-job work done to future-proof this
> slice before new product features are layered on top of it.

## Product vision (reframed)

The product is not a price-comparison app, an expense tracker, a
coupon app, or "BuyHatke for groceries." Per the Competitive Analysis
(`docs/COMPETITIVE_ANALYSIS.md`) and the resulting product-positioning
decision: this is an **AI Household Purchase Advisor**. Every feature
should answer one question — *how can this household buy better*, not
just cheaper. Category scope is deliberately restricted to groceries
and household consumables (cleaning supplies, personal care, baby care,
pet food) until product-market fit is established — no flights, hotels,
electronics, insurance, mutual funds, or fashion. The product's
north-star metric is household savings generated, not products
compared, users, or bills uploaded. This reframing doesn't change any
already-built feature; it changes how new roadmap items (Historical
Price Intelligence, Community Pricing, Household Consumption
Intelligence) are designed and sequenced — see "Future Architecture
Plan" below.

## What's built (vertical slice)

**Product Search → Effective-Cost Pricing → AI Recommendation → UI**, fully
working against a real Postgres database and a Next.js frontend.

- `backend/app/domain/models.py` — `Platform`, `Product`, `ProductListing`,
  `PriceHistory`. Listings carry MRP, selling price, delivery/platform/handling
  fees, product & delivery ratings, ETA, stock.
- `backend/app/services/pricing_engine.py` — computes effective cost and the
  *real* discount % (after fees), distinct from the platform's advertised
  discount %.
- `backend/app/services/recommendation_engine.py` — turns a list of listings
  into five labeled recommendations (Best Overall, Cheapest, Fastest, Highest
  Rated, Best Value), each with a plain-English reason. Best Overall uses a
  weighted score (cost 40%, product rating 25%, delivery rating 20%, speed
  15%); Best Value uses rating-per-rupee.
- `backend/app/services/product_search_service.py` + `api/v1/routes_search.py`
  — `GET /api/v1/search?q=...` ties it together.
- `frontend/src/components/SearchView.tsx`, `RecommendationPanel.tsx`,
  `ListingTable.tsx` — search box, the 5-card recommendation strip, and a
  full fee breakdown table sorted by effective cost, with direct "Buy →"
  links to each platform (no checkout automation — see Feature 12 below).
- Tests: `backend/tests/test_pricing_engine.py`,
  `test_recommendation_engine.py` — pure unit tests against the engines,
  no DB needed.

## Why this slice first

The recommendation engine is the product's actual differentiator — anyone
can show a price table, the value is in the "buy here, here's why" verdict.
Building it for one feature end-to-end (rather than scaffolding all twelve
features shallowly) means the core decision logic is real and testable, and
every later feature (basket optimization, reviews, alerts) extends the same
`ListingView` → `Recommendation` pipeline instead of inventing a new one.

## Planned features (not yet built)

Each of these extends the existing domain model rather than replacing it.
Suggested schema additions are noted inline.

1. **Basket Comparison** — reuse `pricing_engine` per item; new
   `services/basket_optimizer.py` computes Option A (single platform),
   Option B (alternate), Option C (multi-platform optimal split), trading
   off extra delivery fees against per-item savings.
2. **Bill Upload Intelligence** — `bills`, `bill_line_items` tables; OCR via
   a pluggable extractor interface (start with a hosted OCR API, not a
   custom model) feeding into the same `Product` matching used by search.
3. **Personalized Profiles** — `users`, `memberships`,
   `payment_methods(card_name, cashback_rules JSON)`. Explicitly never store
   card numbers/CVV/OTP — only the cashback *rules*, used as multipliers in
   the recommendation engine's cost calculation.
4. **Offer Intelligence Engine** — `offers(platform_id, rule, valid_from,
   valid_to)` + a scheduled worker that recalculates effective cost with
   active offers applied. This is the hardest data-acquisition problem in
   the whole spec (see Risks below).
5. **Review Intelligence** — `review_summaries(listing_id, quality_score,
   delivery_score, pros, cons)`, populated by an LLM summarization job over
   scraped/ingested reviews — store the summary, not raw review text, to
   keep the UI a decision tool rather than a data dump.
6. **Smart Alternatives** — nearest-neighbor over `Product.category` +
   price/rating, with a user preference flag (same brand / similar brand /
   cheapest acceptable).
7. **Price History & Buy-Now-or-Wait** — already have `PriceHistory`;
   needs a daily price-snapshot job and a simple trend classifier
   (min/avg/max over trailing N days) before an AI verdict is trustworthy.
8. **Price Alerts** — `alerts(user_id, listing_id, condition, threshold)` +
   a Redis-backed scheduled job diffing latest prices against thresholds.
9. **Household Consumption Intelligence** — derived from bill line items
   over time; needs feature 2 first.
10. **Direct Purchase Links only** — already implemented in the UI
    (`product_url` on every listing). Deliberately no checkout automation,
    no platform login, no payment handling — keeps compliance/maintenance
    burden low and matches the explicit requirement.
11. **Conversational AI Assistant** — once 1–9 exist, this is a thin
    natural-language layer (Claude API) over the same services, not a new
    data layer.
12. **WhatsApp / Voice / Recipe-to-Cart** — channel layers on top of the same
    API; build after the core engine and at least Basket Comparison exist.
13. **Local Kirana & Community Price Intelligence** — community-submitted
    prices (bills, receipts, shelf-tag/product photos, manual entries,
    independent-website submissions), explicitly never trusted at the same
    confidence level as official platform data. Full architecture, schema,
    confidence-scoring, and provider-model proposal in
    `docs/adr/0007-community-price-intelligence.md` — **proposed, not yet
    implemented**, pending the sequencing decision against Basket Comparison
    (see "Future Architecture Plan" below).

## Future Architecture Plan

This section tracks features that have a complete design proposal but are
explicitly not yet approved for implementation, plus the sequencing
decisions still open.

### Historical Price Intelligence (proposed, design-only)

Full design in `docs/adr/0008-historical-price-intelligence.md`, written
directly in response to `docs/COMPETITIVE_ANALYSIS.md` ranking this the
strongest available long-term defensible asset (price history compounds
over time and can't be backfilled by a later entrant — the same moat
BuyHatke holds today). Generalizes the existing `PriceHistory` model and
ADR-007's community-history design into one unified, source/confidence-
aware `price_observations` table, plus a daily-aggregate rollup, a
retention/archival policy (18-month raw retention, indefinite aggregate
retention), and location-key reuse from the existing `location_key`
precedent. Effort estimate ~6–6.5 days, excluding Household Intelligence
join logic and true ML forecasting (both explicitly deferred).

**Status: recommended as the next implementation priority**, ahead of
Community Price Intelligence's ingestion routes — ADR-008 argues those
routes should write into the table this ADR defines, rather than
shipping a separate community-only history table as ADR-007 originally
proposed. This is a recommendation, not a decision made on the user's
behalf; final sequencing is still the user's call.

### Local Kirana & Community Price Intelligence (proposed, design-only)

Full design in `docs/adr/0007-community-price-intelligence.md`, covering:
architecture proposal, database schema (`CommunityPriceObservation` +
`CommunityPriceAggregate`), a two-tier confidence model (`VERIFIED`/
`COMMUNITY` tier, `LOW`/`MEDIUM`/`HIGH` level within `COMMUNITY`), a
schema-only foundation for a future contributor-reputation system, provider
model changes (`OfficialProvider`/`CommunityProvider` marker base classes),
a price-history foundation (`CommunityPriceHistory`) for future buy-time
intelligence, dependency-impact analysis, and an effort estimate
(~6.5–8 days, excluding reputation scoring, forecasting, and photo-upload
storage infra).

**Status: awaiting a sequencing decision.** The ADR's own analysis (§10)
is that this feature and Basket Comparison are independent — neither
blocks the other — and can ship in either order, with one flagged minor
follow-up (`basket_optimization_engine.py` would eventually need the same
confidence-penalty treatment once community prices exist). The decision of
which to build first (or whether to build this at all yet, given the
unresolved photo-upload-storage and live-price-acquisition open questions)
is explicitly left to the user/founder, not made here.

## Key risks worth flagging before scaling this

- **Live price data acquisition is the hardest part of this whole product,**
  harder than any of the AI features. Blinkit/Zepto/Swiggy Instamart don't
  offer public APIs; sustained scraping at this scale has ToS and legal
  exposure that should be reviewed before committing engineering time to a
  scraper fleet. A partnership/affiliate-feed approach (where available) is
  lower risk than scraping and should be evaluated first.
- **Card/cashback rule data goes stale** — banks change offer terms
  frequently; treat `payment_methods.cashback_rules` as needing a manual or
  semi-automated refresh process, not a one-time seed.
- **Affiliate links are the most de-risked monetization path** given the
  "no checkout automation" constraint — worth wiring up before subscription
  tiers.
