# ADR-007: Local Kirana & Community Price Intelligence (Design Only — Not Implemented)

## Status
Proposed — architecture/design review, per explicit instruction not to build
this yet. This ADR exists to let the Basket Comparison milestone (ADR-006)
and this feature be evaluated for sequencing, not to commit to either order.

## Context
Every price in the system today comes from a `PriceProvider` whose data is
implicitly treated as equally trustworthy — `CSVProvider` (curated seed
data), `MockProvider` (synthetic), and `BigBasketProvider` (a real platform
scrape) all produce `NormalizedListing`s that flow into
`recommendation_engine.py`/`basket_optimization_engine.py` with no notion of
"how sure are we this price is real." That's tolerable while every source
is either fully synthetic or a single official platform. It stops being
tolerable the moment local kirana prices, handwritten-bill OCR, and
self-reported community submissions enter the same pipeline — a single
unverified ₹50 typo could currently make a recommendation engine call a
kirana store "cheapest" with the same confidence as a verified platform
listing. This ADR's core principle, stated directly in the request driving
it: **community-sourced prices must never be presented with the same trust
level as official/verified prices.**

## 1. Architecture Proposal

Two structural additions, both additive — no existing provider, engine, or
route changes shape:

1. **A `confidence` dimension threaded through the same path
   `location_key` already travels.** `location_key` (added in PR #4) proved
   the pattern: add an optional field to `NormalizedListing`, thread it
   through `PriceProvider.fetch()` → `provider_aggregator.search_providers()`
   → `recommendation_engine`/`basket_optimization_engine`, and let every
   existing provider default it harmlessly. Confidence follows the same
   shape: `NormalizedListing.confidence: ConfidenceLevel` (new enum,
   default `VERIFIED` for all current providers, since CSV/Mock/BigBasket
   data is already either curated or an official source).
2. **A new ingestion path, parallel to (not replacing) `PriceProvider`.**
   Today, data flows *into* the app one way: a `PriceProvider.fetch()` call
   pulls from an external source on demand. Community pricing is the
   opposite direction — data is *submitted* by users, persisted, then
   aggregated into something a provider-like interface can serve back out.
   This needs a write path (`POST /api/v1/community-prices`, a new
   `CommunityPriceObservation` table) feeding a new `CommunityPriceProvider`
   that reads aggregated, confidence-scored observations and returns them as
   ordinary `NormalizedListing`s — so the recommendation engine doesn't need
   a second code path to *consume* community data, only confidence-aware
   logic to *weigh* it.

```
        ┌─────────────────────────────┐
        │ POST /community-prices       │  (new write path)
        │ (bill OCR / manual / photo /  │
        │  independent-site submission) │
        └──────────────┬───────────────┘
                        ▼
        ┌─────────────────────────────┐
        │ CommunityPriceObservation     │  (raw, per-submission)
        │ table — one row per submit    │
        └──────────────┬───────────────┘
                        ▼
        ┌─────────────────────────────┐
        │ aggregation step (sync, on     │
        │ read — no new background job   │
        │ needed at current scale)        │
        │ groups by (product, store/      │
        │ location), computes range +      │
        │ confidence from observation count│
        └──────────────┬───────────────┘
                        ▼
        ┌─────────────────────────────┐
        │ CommunityPriceProvider        │  (implements PriceProvider,
        │ .fetch() returns aggregated   │   same interface as CSV/Mock/
        │ NormalizedListings, confidence │   BigBasket — no special-casing
        │ field populated per ADR §2     │   in provider_aggregator.py)
        └──────────────┬───────────────┘
                        ▼
        ┌─────────────────────────────┐
        │ provider_aggregator.py        │  (unchanged interface; existing
        │ search_providers()            │   fan-out already treats every
        └──────────────┬───────────────┘   provider uniformly)
                        ▼
        ┌─────────────────────────────┐
        │ recommendation_engine.py /     │  (confidence-aware: see §2
        │ basket_optimization_engine.py  │   for the rule changes)
        └─────────────────────────────┘
```

This keeps the existing "fan out across all `PriceProvider`s, rank the
results" architecture intact. `CommunityPriceProvider` is just one more
provider in the list `providers/registry.py` already centralizes (added
this PR's predecessor) — the only new architectural concept is that one
provider's listings carry a *lower* confidence than the others, and the
ranking logic needs to know what to do with that.

## 2. Database Schema Proposal

```
CommunityPriceObservation
  id                  PK
  product_id          FK -> products.id          (nullable: see note below)
  product_name_raw    string                      (as typed/OCR'd, before product matching)
  store_name           string, nullable            ("Ravi Kirana")
  source_type          enum: OCR_ITEMIZED_BILL | OCR_HANDWRITTEN_BILL |
                              MANUAL_ENTRY | SHELF_TAG_PHOTO |
                              PRODUCT_PRICE_PHOTO | INDEPENDENT_WEBSITE
  price                 numeric(10,2)
  location_key          string, nullable           (pincode/area — same shape as
                                                      ProductListing.location_key)
  submitted_by_user_id  FK -> users.id, nullable    (anonymous submission allowed,
                                                       same pattern as anonymous bill upload)
  submitted_at          datetime
  raw_image_url         string, nullable            (shelf-tag/receipt photo, if any)
  status                 enum: PENDING | ACCEPTED | REJECTED   (see §3)

CommunityPriceAggregate
  id                    PK
  product_id            FK -> products.id
  location_key          string, nullable
  observation_count      integer
  min_price              numeric(10,2)
  max_price              numeric(10,2)
  median_price            numeric(10,2)
  confidence              enum: LOW | MEDIUM | HIGH    (derived, see §3 formula)
  last_observation_at      datetime
  updated_at                datetime

  -- one row per (product_id, location_key); recomputed whenever a new
  -- ACCEPTED observation lands for that pair, not a per-observation log
```

**Why two tables, not one.** `CommunityPriceObservation` is the
append-only, per-submission audit log — never edited, needed for §4's
reputation model (which submissions came from which user) and for
re-deriving the aggregate if the scoring formula changes later.
`CommunityPriceAggregate` is the derived, queryable "current state" a
provider reads from — recomputing a median/range over potentially
thousands of raw observations on every search request would be wasteful;
this is the same "computed result persisted separately from the raw
input" shape `BasketRecommendation.recommendation_json` and the new
`BasketOptimization.optimization_json` (ADR-006) already use, just as a
relational rollup instead of JSON because this one *does* need to be
queried/joined (by product + location) rather than fetched whole.

**Product matching note**: `product_id` is nullable on the observation
table because a community submission ("Aashirvaad Atta 5kg" typed by a
user) may not match an existing `Product` row at submission time —
matching against the canonical catalog (likely fuzzy, given the existing
`pg_trgm` search index on `products.name`) is a separate, already-flagged
problem (`PROJECT_STATE.md`'s "Bill Upload Intelligence" pending feature:
"product-matching against a real catalog beyond the seed data"). This ADR
does not solve that matching problem, only ensures the schema doesn't
block on it — an unmatched observation is stored and can be matched
retroactively once that capability exists.

## 3. Confidence Model

**Two-tier confidence, not a single score**, because the request's
principle ("never the same trust level") needs a hard category boundary,
not just a number that could drift close to a verified one:

- **Tier (categorical, on `NormalizedListing.confidence` /
  `CommunityPriceObservation.source_type`)** — `VERIFIED` vs. `COMMUNITY`.
  `VERIFIED` = official API, official platform data, official retailer
  website (today: `CSVProvider`'s curated data, `BigBasketProvider`).
  `COMMUNITY` = every source_type in the enum above (OCR bills, manual
  entry, photos, independent-website submissions) — all community-tier
  regardless of which specific source_type, because the *request* is
  explicit that none of these should be conflated with verified data, even
  if some (e.g. an itemized OCR bill) are more reliable than others
  (handwritten OCR).
- **Level (within `COMMUNITY` only, on `CommunityPriceAggregate.confidence`)**
  — `LOW` / `MEDIUM` / `HIGH`, derived from `observation_count` and price
  consistency (tight range = more trustworthy than a wide one even at the
  same count). Proposed formula (tunable, not load-bearing for the schema):
  - `LOW`: 1 observation, or coefficient of variation > 15%.
  - `MEDIUM`: 2+ matching observations (same product+location), CoV ≤ 15%.
  - `HIGH`: 3+ matching observations, CoV ≤ 10%.
  (Matches the worked example: ₹310/₹315/₹312 → 3 observations, ~0.8% CoV
  → `HIGH`, range ₹310–315.)
  `VERIFIED`-tier listings don't get a Level — they're not aggregated from
  multiple uncertain observations, so a Level would be a meaningless label
  on them.

**Recommendation-engine rule changes implied (design only, not built this
ADR)**: `_overall_score()` in both `recommendation_engine.py` and
`basket_optimization_engine.py` would need a confidence-penalty term —
e.g. a `COMMUNITY`-tier listing's effective score is multiplied down
(proposed: ×0.9 at `HIGH`, ×0.75 at `MEDIUM`, ×0.5 at `LOW`) before
competing for "Cheapest"/"Best Overall", so a single unverified ₹50 typo
cannot out-rank a verified listing. `Recommendation.reason` strings must
state the tier and, for community data, the observation count and range
explicitly (Requirement 8: "never present unverified community data as
fact") — e.g. "Lowest *community-reported* price (₹310–315 from 3
shoppers near 110034) — not yet verified against an official source."
`RecommendationSet`/`BasketOptimizationResult` would gain a
`has_unverified_data: bool` flag so the UI can render a visible disclaimer
without needing to inspect every listing's tier itself.

## 4. Trust/Reputation Model (future — schema-only now)

Per the request ("design support... do not implement fully yet"), the
only commitment now is that `CommunityPriceObservation.submitted_by_user_id`
exists (nullable FK to `User`, same nullable-ownership pattern
`BillUpload.user_id`/`Basket.user_id` already use). That's sufficient to
attach a future `ContributorReputation` table without a migration to the
observation table itself:

```
ContributorReputation   (future, not in this ADR's migration)
  id                 PK
  user_id             FK -> users.id, unique
  valid_submissions    integer
  rejected_submissions  integer
  accuracy_score        float          (e.g. % of submissions later
                                         confirmed by ≥2 independent
                                         matching observations)
  updated_at             datetime
```

`CommunityPriceObservation.status` (`PENDING`/`ACCEPTED`/`REJECTED`,
already in §2's schema) is the hook a future reputation job would read —
"valid submission" = one that reached `ACCEPTED` (i.e., corroborated by
the aggregate logic in §3), "rejected" = contradicted by a tight cluster
of other observations. No reputation *computation* code is proposed here;
only that the observation table already carries everything such a job
would need to join against, so adding `ContributorReputation` later is a
new table + a batch job, not a schema change to anything existing.

## 5. Independent Website / Provider Model Changes

**Today**: `PriceProvider` is a flat ABC; `providers/registry.py` lists
three concrete implementations with no further structure.

**Proposed**: introduce one intermediate distinction —
`OfficialProvider(PriceProvider)` vs. `CommunityProvider(PriceProvider)` as
two abstract subclasses, *not* five new concrete classes up front. The
request's example list (`OfficialProvider`, `CommunityProvider`,
`KiranaProvider`, `IndependentWebsiteProvider`, `PartnerProvider`) names
five types, but only two structural behaviors actually differ: "fetches
from a single external system the app doesn't control" (Official) vs.
"reads from data users submitted into our own database" (Community).
`KiranaProvider` and `IndependentWebsiteProvider` are not separate code
paths — both are `CommunityPriceObservation.source_type` values (the
*submission* differs, e.g. "submitted via a link to a regional retailer's
site" vs. "submitted as a kirana shelf-tag photo"), but both end up as
rows the same `CommunityPriceProvider` aggregates and serves. A future
`PartnerProvider` (an actual data-sharing agreement, not a scrape or
community submission) would be a genuine third `OfficialProvider` subclass
once one exists — not built now, no current partner.

```
PriceProvider (existing ABC, unchanged)
  ├── OfficialProvider (new, abstract — no new abstract methods,
  │     purely a type-level marker so registry.py / confidence
  │     assignment can branch on isinstance() without a string flag)
  │     ├── CSVProvider        (existing, reparented)
  │     └── BigBasketProvider  (existing, reparented)
  └── CommunityProvider (new, abstract — same marker role)
        └── CommunityPriceProvider (new, this ADR's only new concrete class;
              reads CommunityPriceAggregate, returns NormalizedListings
              with confidence=COMMUNITY and the aggregate's Level attached)
```

`MockProvider` stays a direct `PriceProvider` subclass (it's test/dev
scaffolding, not a real trust-tier claim either way).
`providers/registry.py`'s `build_price_providers()` becomes the one place
that decides whether `CommunityPriceProvider` is included at all — e.g.
gated by a `settings.community_pricing_enabled` flag, so the feature can
ship dark and be turned on per-environment without a code change.

## 6. Price History Foundation

`PriceHistory` already exists (`listing_id` FK → `ProductListing`,
`selling_price`, `recorded_at`) but only models *verified* listings — it
has no `confidence` and no path for a community price to land in history
at all, since community prices don't have a `ProductListing` row (they're
not tied to a specific platform's catalog entry).

**Proposed**: rather than overload `PriceHistory` to mean two different
things, give community price history its own table that mirrors the same
four required fields (Product, Provider/source, Location, Date, Price)
plus Confidence, since `PriceHistory` already encodes "Provider" via
`listing_id → ProductListing → platform_id` implicitly:

```
CommunityPriceHistory     (new — distinct from PriceHistory)
  id                PK
  product_id         FK -> products.id
  location_key        string, nullable
  price                numeric(10,2)
  confidence_level      enum: LOW | MEDIUM | HIGH
  recorded_at            datetime    (= CommunityPriceAggregate.updated_at
                                       at the time of this snapshot)
```

A row is appended whenever `CommunityPriceAggregate` changes meaningfully
(new observation shifts the median or confidence level) — not on every
single raw observation, mirroring how `PriceHistory` already snapshots
selling-price *changes*, not every provider fetch. Both `PriceHistory` and
`CommunityPriceHistory` share the same four-field shape the request asks
for (Product, Provider, Location, Date, Price) with Confidence added —
this uniformity is intentional: Feature 7 (Price History & Buy-Now-or-Wait,
already in `PROJECT_STATE.md`'s pending list) and a future trend
classifier can query both with near-identical logic, just filtering or
weighting by confidence differently per source.

## 7. Buy-Time Intelligence (design support only — no forecasting now)

The request asks the *data model* to support "should I buy now," "normal
price," "lowest observed price," and "best month to buy" — explicitly not
asking for the prediction logic itself. Given §6's two history tables,
every one of these is a query, not a new schema concept:

- **"Normal price"** = a window-averaged `selling_price` (verified) or
  `median_price` (community) over e.g. the trailing 90 days from
  `PriceHistory`/`CommunityPriceHistory`.
- **"Lowest observed price"** = `MIN(price)` over the same tables,
  optionally filtered to `confidence != LOW` so a single bad community
  data point can't claim a false record low.
- **"Best month to buy"** = `GROUP BY EXTRACT(MONTH FROM recorded_at)`
  over multiple years of the same history tables — needs enough historical
  depth to be meaningful (not available yet; the schema just needs to
  start accumulating now so it eventually is).
- **"Should I buy now vs. wait"** = comparing current price against the
  rolling "normal price" window above; this is the only one that implies
  *logic*, not just storage, but that logic (a future trend
  classifier/forecaster, explicitly out of scope here) would consume
  exactly these two history tables as its only inputs — no additional
  schema is anticipated for it once it's eventually built, which is the
  concrete sense in which "the data model supports it."

## 8. Dependency Impact Analysis

**New nodes** (none built yet — this is the *future* graph this ADR
proposes, for evaluation):
- `CommunityPriceObservation`/`CommunityPriceAggregate`/
  `CommunityPriceHistory`/`ContributorReputation` (domain models) — leaves,
  like every other domain model; no internal app dependency.
- `CommunityPriceProvider` (services/providers) — would depend only on
  `services.providers.base` (the existing `OfficialProvider`/
  `CommunityProvider` marker classes) and the DB session, exactly like
  every existing provider depends on nothing else internal. **No new edge
  into `recommendation_engine.py`, `basket_optimization_engine.py`, or
  `provider_aggregator.py`** — they already accept any `PriceProvider`
  uniformly; only `NormalizedListing` gains a field, which every existing
  call site already constructs via keyword arguments (additive, not
  breaking, the same way `location_key` was added in PR #4).
- A new ingestion route (`routes_community_prices.py`) — depends on
  `auth_service`/`deps.py` (`get_current_user_optional`, same anonymous-
  submission-allowed pattern already used) and a new
  `community_price_service.py` (the orchestration/aggregation layer,
  mirroring the existing `auth_service`/`user_service` split convention).

**Existing nodes touched, minimally**:
- `services/providers/base.py`: `NormalizedListing` gains one field
  (`confidence`, defaulted) — every existing provider's listing
  construction keeps working unchanged.
- `services/providers/registry.py`: gains a conditional inclusion of
  `CommunityPriceProvider`.
- `recommendation_engine.py`/`basket_optimization_engine.py`: scoring
  functions gain a confidence-penalty multiplier — a formula change, not a
  structural one; existing tests for both would need new assertions but
  not a rewrite.
- `domain/schemas*.py`: `ProviderListingOut`/`RecommendationOut` etc. gain
  a `confidence` field — additive on response schemas.

**No circular dependency risk identified** — the new modules slot into the
existing layer graph (`docs/DEPENDENCY_MAP.md`) at the same `services/*`
and `domain/*` layers as everything else; nothing in the proposal needs
`api/*` or `services/*` to import from each other in a new direction.

## 9. Effort Estimate

Rough sizing, each assuming the pattern precedent already established
elsewhere in this codebase (auth domain, basket comparison) rather than
novel infrastructure:

| Slice | Estimate | Basis |
|---|---|---|
| Schema + migration (§2, §6) | 0.5–1 day | 4 new tables, all simple FK/enum/numeric columns, no complex constraints — comparable to ADR-005's migration |
| `NormalizedListing.confidence` + provider marker classes (§5) | 0.5 day | Additive field + two empty abstract classes; no behavior change to existing providers |
| `community_price_service.py` (ingestion + aggregation) | 1.5–2 days | New domain logic (median/CoV calculation, status transitions) but no new infra (reuses DB session, no new external dependency) |
| `CommunityPriceProvider` | 0.5 day | Thin adapter, same shape as `CSVProvider` |
| Confidence-aware scoring changes in both engines | 1 day | Formula change + reasoning-string updates in two files, plus test updates |
| Ingestion routes + schemas (manual entry, OCR-bill reuse, photo upload stub) | 1.5–2 days | Manual entry and OCR-bill reuse are straightforward; photo upload (shelf-tag/product photos) needs at minimum a file-storage decision (out of scope to design here) before it can be estimated precisely — flagged as the one open unknown |
| Tests | 1 day | Following existing dataclass/mock-provider test conventions |
| **Total** | **~6.5–8 days** | Excludes reputation system (explicitly deferred), forecasting (explicitly deferred), and photo-upload storage infrastructure (open unknown, not yet designed) |

## 10. Recommended Implementation Order

If/when this is built (sequencing relative to Basket Comparison is the
explicit open question this ADR exists to inform, not decide):

1. `NormalizedListing.confidence` field + `OfficialProvider`/
   `CommunityProvider` marker classes — zero-risk, purely additive,
   unblocks everything else.
2. Schema migration (`CommunityPriceObservation`, `CommunityPriceAggregate`,
   `CommunityPriceHistory`) — no behavior yet, just the tables.
3. `community_price_service.py`: manual-entry ingestion + aggregation
   logic only (skip OCR/photo sources initially) — gets the confidence
   model end-to-end testable fastest.
4. `CommunityPriceProvider` + confidence-aware scoring changes in both
   recommendation engines — this is the point the feature becomes
   user-visible (community prices start influencing recommendations, with
   visible confidence labeling).
5. OCR-sourced submissions (reusing the existing Tesseract/mock OCR
   pipeline from Bill Processing — itemized first, handwritten second,
   since handwritten OCR is inherently lower-confidence and benefits from
   the aggregation model already being proven on cleaner sources).
6. Independent-website / shelf-tag-photo / product-photo submission types
   — these primarily affect the *ingestion* route/schema (new
   `source_type` values, possibly a file-storage dependency for photos),
   not the aggregation or scoring logic, which is already general by step
   4.
7. `ContributorReputation` (future, per explicit instruction) — only once
   there's enough submission volume for "historical accuracy" to be a
   meaningful signal rather than noise.
8. Buy-time intelligence trend/forecast logic (future, per explicit
   instruction) — only once `CommunityPriceHistory`/`PriceHistory` have
   accumulated meaningful depth (months, not days, of data).

**Sequencing relative to Basket Comparison**: Basket Comparison (ADR-006)
has no dependency on this feature and vice versa — they touch different
parts of the engine (basket-level aggregation vs. per-listing trust). They
can ship in either order. The one interaction worth flagging: once
Community Price Intelligence exists, `basket_optimization_engine.py` would
need the same confidence-penalty treatment `recommendation_engine.py`
gets (per §3) — a small follow-up to whichever ships second, not a reason
to block either.
