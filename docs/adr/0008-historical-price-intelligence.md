# ADR-008: Historical Price Intelligence

## Status
Proposed — architecture/design review only, per explicit instruction.
**No schema, migration, or code in this ADR has been implemented.**

## Context
The Competitive Analysis (`docs/COMPETITIVE_ANALYSIS.md`) found that no
reviewed competitor (QuickCompare, Comparify, BuyHatke) does whole-basket
optimization — that's our current lead, already built (ADR-006) — but
flagged that the hardest-to-copy asset in the category is BuyHatke's
*accumulated* price history (3-month graphs), because history cannot be
backfilled by a later entrant. The report ranked Historical Price
Intelligence as a top defensibility priority, ahead of further
comparison features, and the user has asked for this design **before**
further Basket Comparison work (note: Basket Comparison itself — the
engine and routes — is already built per ADR-006; what's being
sequenced here is *additional* roadmap work, not that feature).

This ADR also responds to the user's reframing of the product vision:
the product is not a comparison tool but a **household purchase
advisor**, whose core promise is "buy better," not "buy cheaper." That
reframing changes what this schema must support — not just "what did
this item cost on date X" but "is this a normal price, a good time to
buy, and does it fit this household's known buying pattern" — and it
directly motivates §6 below (interaction with Household Intelligence).

The existing `PriceHistory` model (`backend/app/domain/models.py:84`) is
a minimal `(listing_id, selling_price, recorded_at)` table tied to one
`ProductListing` row — adequate for "this listing's price changed" but
not for any of the seven future capabilities listed in Requirement 2
below, and not source/confidence-aware, which ADR-007 (Community Price
Intelligence) already requires. **This ADR proposes evolving, not
replacing, `PriceHistory`** — see §1 — and is written to be consistent
with ADR-007's confidence model rather than inventing a second one.

## Decision

### 1. Historical Price Storage

Generalize `PriceHistory` into a model that can record a price
observation from *any* source — not just polling an existing
`ProductListing` — while keeping today's behavior (one row per listing
price-change) as the default, zero-behavior-change case.

```
PriceObservation
  id                  PK
  product_id          FK -> products.id            (always required)
  listing_id           FK -> product_listings.id, nullable
                        (set when sourced from a live provider listing;
                         null for community/kirana observations that have
                         no ProductListing row — same nullable-FK pattern
                         ADR-007 already uses for CommunityPriceObservation)
  platform_id          FK -> platforms.id, nullable
                        (nullable for kirana/independent-website sources
                         that aren't a registered Platform row)
  location_key         String(64), nullable          (pincode / city / dark-store id — see §4)
  price                Numeric(10,2)
  confidence_tier      Enum(VERIFIED, COMMUNITY)      (ADR-007's tier, reused verbatim)
  confidence_level      Enum(LOW, MEDIUM, HIGH), nullable  (ADR-007's level; null when tier=VERIFIED)
  source_type           Enum(PROVIDER_POLL, OCR_ITEMIZED_BILL,
                              OCR_HANDWRITTEN_BILL, MANUAL_ENTRY,
                              SHELF_TAG_PHOTO, PRODUCT_PRICE_PHOTO,
                              INDEPENDENT_WEBSITE)
                        (ADR-007's source_type enum + one new value,
                         PROVIDER_POLL, for today's existing snapshot path)
  recorded_at           DateTime
```

- This **is** `PriceHistory`, renamed and extended — not a new, third
  table alongside `PriceHistory` and ADR-007's `CommunityPriceHistory`.
  Today's call site (a snapshot job recording `selling_price` for a
  `ProductListing`) becomes: `product_id` = the listing's product,
  `listing_id` = the listing, `platform_id` = the listing's platform,
  `confidence_tier` = `VERIFIED`, `confidence_level` = null,
  `source_type` = `PROVIDER_POLL`. Zero behavior change for existing
  callers once the migration backfills these columns.
- ADR-007's `CommunityPriceObservation`/`CommunityPriceHistory` are
  **superseded by this design**, not run in parallel — same row shape,
  one table, distinguished by `confidence_tier`/`source_type`, not a
  second schema. This is corrected from ADR-007's original two-table
  community-only proposal now that the user has asked for the general
  historical-price problem to be solved at the same time; ADR-007's
  confidence-scoring formula (§3 there) is otherwise unchanged and
  reused here verbatim.
- `product_id` is **never** nullable, unlike ADR-007's original
  `CommunityPriceObservation.product_id` — catalog-matching for
  unmatched community submissions still needs to happen (the open
  problem ADR-007 flagged), but it now happens at ingestion time, before
  a `PriceObservation` row is written, rather than being deferred into
  the history table itself. A staging table for *unmatched* raw
  submissions (`UnmatchedPriceSubmission`, out of scope for this ADR,
  belongs to whichever ADR implements ingestion) is the right home for
  "we don't yet know which product this is."

### 2. Future Support

Every listed capability is a **read-only query or batch job over
`PriceObservation`**, not a new table:

| Capability | How it's answered |
|---|---|
| Price trends | `GROUP BY date_trunc('day', recorded_at)` over `(product_id, location_key)`, optionally filtered by `confidence_tier` |
| Buy Now vs Wait | Compare current best `VERIFIED` price to the trailing-N-day moving average/min for the same `(product_id, location_key)` |
| Seasonal analysis | `GROUP BY date_trunc('month', recorded_at)` across multiple years — requires retention (§3) to actually span seasons |
| Lowest observed price | `MIN(price) WHERE product_id=... AND location_key=...`, separately reportable per `confidence_tier` (never blend a `COMMUNITY` low into a `VERIFIED` "lowest price ever" claim — see ADR-007's Recommendation Rules, reused here) |
| Average price | `AVG(price)` over a trailing window, same tier-separation rule |
| Price volatility | Coefficient of variation over a trailing window — reuses the exact CoV calculation ADR-007 §3 already specifies for confidence-leveling, now repurposed as a volatility metric too |
| Household-specific recommendations | Joins `PriceObservation` against a future `HouseholdConsumptionPattern` (Feature 9 / the user's "Household Intelligence" reframing) by `product_id` + the household's purchase-frequency record — see §6 |

No new table is needed for any of these; this is the central design
claim of this ADR — that one well-indexed observation table, plus
query/job logic, covers all seven asks, in line with the existing
codebase convention of pure compute functions (`pricing_engine.py`,
`basket_optimization_engine.py`) operating over already-persisted data
rather than each feature inventing its own storage.

### 3. Data Retention

- **Raw retention**: keep raw `PriceObservation` rows for a fixed
  window — recommend **18 months** (covers more than one full seasonal
  cycle, the minimum needed for "best month to buy" analysis per
  Requirement 7 in ADR-007, without unbounded growth).
- **Aggregation strategy**: a daily batch job rolls each day's
  observations into a `PriceDailyAggregate` table —
  `(product_id, location_key, platform_id, confidence_tier, date,
  min_price, max_price, avg_price, observation_count)` — one row per
  product/location/platform/tier/day instead of N raw rows. This is the
  same "append-only log + queryable rollup" split ADR-007 §2 already
  used (`CommunityPriceObservation` vs. `CommunityPriceAggregate}`),
  generalized to all sources here. Daily aggregates are kept
  indefinitely (small, one row per group per day) and are what trend/
  seasonal queries actually run against — raw rows are only needed for
  re-aggregation or audit, not for serving features.
- **Archival strategy**: raw rows older than the 18-month window are
  exported (e.g. to cold object storage as Parquet/CSV) and deleted from
  Postgres; the daily aggregates they produced are retained forever in
  Postgres since they're already small and are the only thing seasonal/
  multi-year analysis needs. This mirrors a standard time-series
  retention pattern and keeps the hot table bounded regardless of how
  long the product runs.

### 4. Location Awareness

`location_key` is reused verbatim from `ProductListing.location_key` /
`Basket.location_key` (PR #4's precedent) — an opaque string, not a
typed column, so it can represent any of:

- **Pincode** (`"110001"`) — for kirana/community submissions, which is
  the granularity a user can realistically self-report.
- **City** (`"city:bengaluru"`) — a coarser fallback when pincode-level
  density is too sparse to be statistically meaningful (relevant once
  confidence-leveling, ADR-007 §3, needs enough observations per key).
- **Dark-store identifier** (`"darkstore:blr-koramangala-04"`) — for
  quick-commerce platforms that resolve to a specific fulfillment node
  rather than a postal area; matches how `BigBasketProvider` or a future
  Blinkit/Zepto integration would actually report location.
- **Future kirana locations** — same string namespace, no schema change
  needed; a kirana store could eventually get its own
  `"store:<store_id>"` key if store-level (not just pincode-level)
  price differentiation becomes valuable, without touching this table.

No foreign key to a `Location` table is proposed — consistent with the
existing codebase's choice (PR #4) not to model location as a first-
class entity yet, since no provider is location-aware today (per
`PROJECT_STATE.md`'s Open Risks). A typed `Location` table remains a
valid future migration if/when actual geo-resolution (lat/long,
catchment-area logic) is needed; not proposed now since nothing
consumes it yet.

### 5. Community Pricing Compatibility

By construction (§1), community and official prices already coexist in
the same table, distinguished by `confidence_tier`/`confidence_level`/
`source_type` — there is no compatibility problem to solve because this
ADR **is** the unification of ADR-007's community price-history design
with the general one, not a parallel system. Every rule ADR-007 §8
("Recommendation Rules") specified — never blend tiers into one claim,
always state observation count and tier in any community-derived
reason string — applies unchanged to every query in §2 above.

### 6. Competitive Advantage Review

- **Why this becomes defensible over time, not immediately**: a
  historical-price table is worthless on day one (no history exists)
  and increasingly valuable every day after — this is exactly the
  "BuyHatke moat" the competitive analysis identified: a feature a
  competitor can copy in code but not in accumulated data. Recommend
  treating "table exists and is being populated" as the real milestone
  to ship soon, even before the trend/seasonal *features* built on top
  of it are user-facing, because the data-compounding clock should
  start as early as possible.
- **Interaction with Community Pricing (ADR-007)**: now fully merged
  (§1/§5) rather than two systems that need to "interact" — this
  *increases* the moat, because community observations densify the
  history table in locations/products official providers don't cover
  (kirana stores, regional products), which a pure-scraper competitor
  structurally cannot do.
- **Interaction with Household Intelligence (Feature 9, the user's
  "AI Household Purchase Advisor" reframing)**: `PriceObservation` is
  the *price* half of the household advisor's reasoning; the *behavior*
  half is a separate, not-yet-designed `HouseholdConsumptionPattern`
  (derived from bill-upload history — purchase frequency, brand
  preference, basket composition over time). The advisor's most
  differentiated outputs (the report's worked example: "buy oil from
  BigBasket, rice from DMart, keep using Amul, replace Brand X,
  buy staples in week 1") are joins across *both* — "what's the
  household's normal pattern for this product" (consumption side)
  crossed with "what's the best price/timing for it right now" (this
  ADR's side). Neither alone produces that recommendation; this ADR is
  a necessary but not sufficient piece of the household-advisor vision,
  and should be explicitly sequenced as a prerequisite to designing
  Household Intelligence, not built in isolation from it.

### 7. Dependency Impact

- **Schema impact**: `price_history` table is altered (columns added:
  `confidence_tier`, `confidence_level`, `source_type`, `platform_id`
  nullable, `location_key`; `listing_id` becomes nullable; `product_id`
  added as a new NOT NULL FK, backfilled from `listing_id`'s product for
  every existing row in the same migration). New `price_daily_aggregate`
  table. No changes to `ProductListing`, `Basket`, or any engine's
  function signatures — this is purely additive at the model layer per
  `docs/DEPENDENCY_MAP.md`'s leaf-node convention (`domain.models` has
  no internal dependents to break).
- **Storage impact**: at, say, 50 platforms × 10,000 products × 1
  observation/day, raw rows accumulate at ~500K rows/day (~180M/year) —
  manageable for Postgres with the §3 retention window, but the daily-
  aggregate job is not optional at any meaningful product/platform
  count; without it, naive trend queries over raw rows degrade as the
  table grows. Community observations add load proportional to user
  submission volume, which is unpredictable pre-launch — recommend
  sizing this again once ADR-007's ingestion volume is observed in
  practice, not estimated now.
- **Performance impact**: requires a composite index on
  `(product_id, location_key, recorded_at)` for the hot trend/lowest-
  price queries, and `(product_id, location_key, date)` on the
  aggregate table. No impact on existing search/recommendation request
  paths (`pricing_engine.py`, `recommendation_engine.py`,
  `basket_optimization_engine.py` don't read this table at request
  time, only batch/analytical jobs do) — consistent with
  `docs/DEPENDENCY_MAP.md`'s observation that nothing in `services/*`
  should create a new edge into a hot path for an analytical feature.
- **Future migration risks**: the `listing_id`-nullable + `product_id`-
  added migration touches an existing table with production rows once
  any are written (today, in this sandbox, there are none) — same
  backfill-via-`UPDATE` pattern already used twice (ADR-005's
  `is_active`, ADR-006's `Basket.source`), so the *technique* is
  low-risk; the *one* real risk is that this migration should land
  before meaningful `PriceHistory` data accumulates in production,
  since backfilling `product_id` for old rows is trivial via `listing_id`
  today but would only get harder if the table grows large first.
  Recommend doing this migration early for that reason, independent of
  whether the trend/seasonal *features* ship at the same time.

## Effort Estimate

| Slice | Estimate |
|---|---|
| Migration: alter `price_history` → `price_observations` shape, backfill, new `price_daily_aggregate` table | 1 day |
| Daily aggregation batch job (arq, reuses existing worker infra) | 1 day |
| Archival job (export-then-delete, cold storage target TBD) | 0.5–1 day (depends on chosen storage target — open question) |
| Query/service layer: trend, lowest/average price, volatility (pure functions, mirrors `pricing_engine.py` style) | 1.5 days |
| Buy Now vs Wait classifier (rule-based threshold, not ML, per "do not implement forecasting yet" precedent from ADR-007) | 1 day |
| Tests | 1 day |
| **Total** | **~6–6.5 days** |

Excludes: Household Intelligence join logic (§6, separate future ADR),
true ML-based seasonal forecasting (explicitly deferred, same as
ADR-007's stance on forecasting), community-submission ingestion routes
(already scoped in ADR-007's own estimate, unchanged by this merge).

## Recommended Implementation Order

1. Migration: generalize `price_history` into `price_observations` (the
   schema in §1) — do this first and early, per the migration-risk note
   in §7, independent of any feature work.
2. Daily aggregation job + `price_daily_aggregate` table (§3) — needed
   before any trend query is performant, not optional.
3. Query/service layer for lowest/average/volatility/trend (§2) — pure
   functions over the aggregate table, no UI required yet to start
   validating against real data.
4. Buy Now vs Wait rule-based classifier (§2) — first user-facing
   capability, depends on #1–3 having real accumulated data to be
   useful at all (a brand-new table answers "wait" trivially but not
   usefully).
5. **Only then**, revisit ADR-007's community-submission ingestion
   routes — they now write into the same `price_observations` table
   designed here (§1/§5), so building this ADR first means ADR-007's
   implementation gets simpler, not harder, by going second.
6. Household Intelligence (Feature 9) design — a new ADR, explicitly
   the next one to write per §6's "necessary but not sufficient"
   conclusion, once this ADR's table exists to join against.

This supersedes ADR-007's own §10 ("ship in either order") — given the
merge in §1/§5, **this ADR should be implemented before ADR-007's
ingestion routes**, not independently of them, since ADR-007 now writes
into a table this ADR defines. ADR-007's confidence-model design (§3-4
there) is otherwise fully retained and unchanged.
