# ADR-006: Basket Comparison and Optimization Engine

## Status
Accepted

## Context
Every comparison capability built so far (`recommendation_engine.py`,
`bill_recommendation_service.py`) operates on one product at a time. The
roadmap's Feature 1 ("Basket Comparison") and this milestone's explicit
ask require comparing an entire basket — multiple items — across
platforms at once, producing a single verdict (current cost, cheapest
platform, best overall platform, multi-platform optimized cost,
estimated savings) instead of five per-item recommendation sets a user
has to mentally aggregate themselves. The input must not be limited to
bill uploads: OCR-derived baskets, manually entered baskets, and (later)
saved baskets all need to flow through the same comparison, per the
milestone's explicit "Future Data Compatibility" and "Input sources"
requirements.

## Decision
- **New pure engine, `basket_optimization_engine.py`** — mirrors
  `recommendation_engine.py`'s shape (a dataclass-only, no-I/O function,
  `build_basket_optimization(item_recs) -> BasketOptimizationResult`)
  but operates one level up: across all of a basket's items rather than
  one product's listings. It reuses `pricing_engine.compute_pricing()`
  unmodified (duck-typed against `NormalizedListing`, exactly as
  `provider_aggregator.py` already does) and mirrors
  `recommendation_engine._overall_score`'s weighting (cost 40% / rating
  25% / delivery 20% / speed 15%), averaged per platform across the
  items that platform actually covers.
- **Per-platform totals only count a platform once it's been seen on an
  item** — a platform that doesn't carry every basket item still gets a
  `PlatformBasketTotal` with `covers_full_basket=False`, so a partial
  match isn't silently inflated into a false "cheapest" by ignoring the
  items it's missing. Full-coverage platforms are always preferred for
  the cheapest/best-overall/best-value/fastest recommendations; partial
  coverage is only used as a fallback when no platform covers the whole
  basket.
- **Multi-platform optimized cost cherry-picks the best platform per
  item independently** — distinct from "best single platform," and
  reported separately, because it answers a different question
  ("what's the absolute floor if I'm willing to order from multiple
  platforms" vs. "what's my best one-stop option").
- **`current_basket_cost` is `None`, not zero, when any item's price is
  unknown** — manual baskets (Requirement: "Manually entered baskets")
  may have items with no price yet; treating an unpriced item as ₹0
  would corrupt "estimated savings" (a fix applied to
  `bill_recommendation_service.build_recommendations_for_basket`, which
  previously always injected a synthetic "Your Bill" listing even when
  `total_price` was 0 — now only does so when `total_price > 0`).
- **New orchestration layer, `basket_comparison_service.py`** — the
  single source-agnostic entry point (`compare_basket(providers, basket,
  location_key)`), following the existing `auth_service.py`/
  `user_service.py` and `pricing_engine.py`/`recommendation_engine.py`
  precedent of splitting orchestration (I/O, provider fan-out) from pure
  computation. `basket_from_items()` lets manually entered items reuse
  the exact same `Basket`/`BasketItem` dataclasses bill-derived baskets
  already use — no separate "manual basket" type.
- **Provider construction centralized in `providers/registry.py`** —
  previously a private `_build_price_providers()` inside
  `bill_processing_service.py`; pulled out because basket comparison now
  needs the same provider list, and a second caller duplicating (or
  reaching into) a private function would be worse than naming it
  properly. This has no behavioral effect (same three providers: CSV,
  Mock, BigBasket).
- **No new provider abstraction.** The engine only ever consumes
  `NormalizedListing` objects already produced by existing
  `PriceProvider` implementations — CSV, mock, and BigBasket today. A
  future live provider plugs in exactly the way BigBasket already does;
  nothing in the optimization engine or comparison service changes.
- **Location awareness threaded through, not yet exploited.**
  `compare_basket()`/`build_recommendations_for_basket()` take the same
  `location_key` parameter PR #4 added to `search_providers()`. A new
  `Basket.location_key` column persists which location a saved
  comparison applies to. No provider is location-aware yet — same
  status as the rest of the codebase since PR #4.
- **Persistence schema**: `Basket.source` (`"manual"` default,
  `"bill_upload"` for bill-derived baskets, backfilled by migration for
  existing rows) makes the input source explicit and queryable, rather
  than inferring it from whether `bill_upload_id` is null. A new
  `BasketOptimization` table (`basket_id` FK, unique; `optimization_json`
  JSON; `created_at`) persists the basket-level result, following the
  exact precedent `BasketRecommendation.recommendation_json` set for
  per-item results — one row per basket, overwritten on re-comparison
  rather than accumulated, since basket *history* is already the list of
  `Basket` rows.
- **Manual baskets are only persisted when the caller is authenticated**
  — the same anonymous-by-default pattern as bill upload
  (`get_current_user_optional`). An anonymous manual comparison still
  returns a full result; it's just not saved, so there's no
  orphaned-data cleanup concern.
- **New routes**: `POST /api/v1/baskets/compare` (manual basket
  comparison, optionally persisted) and `GET
  /api/v1/baskets/{basket_id}/comparison` (retrieve a previously
  persisted comparison, ownership-checked when authenticated). Bill
  upload's existing routes (`/bills/upload`, `/bills/upload-async`) now
  also surface `optimization` in their response, computed via the same
  engine, instead of leaving basket-level optimization as a feature only
  the new manual-basket route has.

## Consequences
- `bill_processing_service.process_bill()`'s return type changes from
  `BillUploadResponse` to `BillProcessingResult` (a dataclass wrapping
  `response`, `basket`, `item_recommendations`, `optimization`) — the
  dead `BillProcessingResult` stub this codebase already had is now the
  real return type. Both callers (`routes_bill_upload.py`,
  `worker.py`) were updated to unwrap `.response` instead of using the
  return value directly; this is an internal service-layer signature
  change, not a public API change — `/bills/upload`'s response body is
  unchanged, `/bills/upload-async`'s polling response gains a new
  optional `optimization` field (additive, not breaking).
- `BillProcessingResult`/`BasketItemRecommendationOut` conversion logic
  (provider listings → `ProviderListingOut`, etc.) was extracted from
  `bill_processing_service.py` into
  `basket_comparison_service.item_recommendations_to_out()` so the new
  manual-basket route doesn't duplicate it — `bill_processing_service.py`
  is now strictly shorter, not longer, despite gaining a new return
  field.
- New `BasketOptimization` table and two new `Basket` columns
  (`source`, `location_key`) require an Alembic migration
  (`e7a1c9d3f456_basket_comparison_and_optimization.py`), including a
  data backfill (`source = 'bill_upload' WHERE bill_upload_id IS NOT
  NULL`) for rows created before this migration — the same
  backfill-via-`UPDATE` pattern ADR-005's migration used for `is_active`.
- Synchronous `/bills/upload` still doesn't persist anything (pre-
  existing gap, unchanged) — `optimization` is computed and returned in
  the response body, but a `Basket`/`BasketOptimization` row is only
  written by the async worker path and the new manual-basket route.
- No new external dependency.

## Future Data Compatibility (explicit callout per milestone requirement)
The optimization engine's only input is `list[BasketItemRecommendation]`,
itself built from `list[NormalizedListing]` — the same contract every
`PriceProvider` already implements. Mock, CSV, and BigBasket providers
all work today with zero engine-side changes; a future live provider
(e.g. a Blinkit/Zepto partnership feed) requires only a new
`PriceProvider` subclass registered in `providers/registry.py`, exactly
as adding BigBasket required no recommendation-engine change in PR #2.
