# Household Intelligence Platform — Redesign

Supersedes the "bill upload first" model. Triggered by hard evidence, not
speculation: real D-Mart/restaurant bills tested through the live pipeline
this session returned OCR confidence of 36.5% and 70% with 0 and 0 usable
line items respectively (see `PHASE1_BETA_LAUNCH_PLAN.md` for the
instrumentation that produced these numbers). Receipt OCR on real Indian
thermal-printed receipts is not reliable enough to be the front door. This
document redesigns the product so a user gets value before OCR ever has to
work.

---

## 0. The one decision I need from you before building

The spec asks for benchmark claims like *"households similar to yours
spend ₹8,000–14,000/month"* and says **"create real benchmark logic, do
not fabricate numbers."** At zero real users, there is no real cohort to
compare against — any number I write today would be fabricated, which
violates the project's own standing rule (`BETA_READINESS_AUDIT.md`:
"never show fabricated data as if it were real").

Three honest options, ranked by how fast they let us ship without lying:

| Option | What it is | Honesty | Effort |
|---|---|---|---|
| **A. Defer the claim** | Show "We don't have enough households yet to compare you to others" until N≥30 real households exist in the DB | Fully honest | None — just an empty state |
| **B. Cite public statistics** | Use a real, named, linkable source (e.g. NSSO Household Consumption Expenditure Survey, CPI-Food weights) with an explicit citation and "general statistic, not measured against you" label | Honest if cited correctly | Low — one-time research + a `benchmark_sources` table |
| **C. Build a synthetic prior from CPI weights** | Derive category split (dairy/staples/snacks %) from published CPI basket weights, scaled to the user's stated budget | Honest, labeled as "modeled estimate" | Medium |

**My recommendation: A for "compare to other households," B for category
splits (CPI weights are public, real, citable data).** Never C dressed up
as A. I've used this assumption in the rest of the document — flag if you
want a different call before I build it.

---

## 1. Product Architecture

```
                        ┌─────────────────────────┐
                        │   Household Profile      │  ← core entity, replaces
                        │   (size, city, budget)    │    "user" as the unit of
                        └────────────┬──────────────┘    intelligence
                                     │
        ┌───────────────┬───────────┼───────────┬────────────────┐
        ▼               ▼           ▼           ▼                ▼
  Household        Shopping     Shopping     Frequent        Shopping
  Assessment        Behavior     Style      Categories       Snapshot
  (Step 1)         (Step 2)     (Step 3)    (Step 4)         (Step 5)
        │               │           │           │                │
        └───────────────┴─────┬─────┴───────────┴────────────────┘
                               ▼
                     ┌──────────────────┐
                     │  Scoring Engine    │  Household Efficiency,
                     │  (rules-based)     │  Planning, Shopping
                     │                    │  Efficiency, Savings Range
                     └─────────┬──────────┘
                               ▼
                     ┌──────────────────┐
                     │ Personalized       │  ← user sees this BEFORE
                     │ Dashboard           │    any data-improvement step
                     └─────────┬──────────┘
                               ▼
        ┌──────────────┬──────────────┬──────────────┬───────────────┐
        ▼              ▼              ▼              ▼               ▼
   Bill Upload    Shopping List   Pantry Track   Manual Spend   Order Import
   (existing,     (new)           (new)          Entry (new)    (future —
   now optional)                                                 Blinkit/Zepto/
                                                                  BigBasket APIs)
        └──────────────┴──────────────┴──────────────┴───────────────┘
                               │
                               ▼
                  Each data source improves the Scoring
                  Engine's confidence — never gates access to it.
```

**Key architectural shift:** today, `Basket`/`BasketItem` (bill-upload
output) is the only thing the recommendation engine reads. Going forward,
the Scoring Engine reads from a `household_signals` aggregation that bill
upload is just one contributor to — pantry, shopping lists, and manual
entries feed the same downstream scores. No code path should require a
`Basket` row to exist.

---

## 2. Data Model

New tables (additive — nothing existing changes shape, `BillUpload`/
`Basket`/`BasketItem` stay exactly as they are and become one tributary
into this model):

```python
class Household(Base):
    id, user_id (FK, nullable=False, the household owner)
    size: int
    adults: int
    children: int
    seniors: int
    city: str
    monthly_grocery_budget: Decimal | None
    created_at, updated_at

class ShoppingBehavior(Base):
    id, household_id (FK)
    stores: list[str]          # ["dmart", "reliance", "bigbasket", "blinkit", "zepto", "kirana"]
    frequency: str             # "weekly" | "biweekly" | "monthly" | "as-needed"

class ShoppingStyle(Base):
    id, household_id (FK)
    priorities: list[str]      # multi-select from the fixed enum in the spec

class FrequentCategory(Base):
    id, household_id (FK)
    category: str              # "dairy" | "staples" | "snacks" | ...

class ShoppingSnapshot(Base):
    id, household_id (FK)
    last_store: str | None
    last_spend: Decimal | None
    approx_item_count: int | None
    recorded_at: datetime

class PantryItem(Base):
    id, household_id (FK)
    product_name: str
    matched_product_id: int | None (FK -> Product, reuses existing matching)
    quantity_on_hand: Decimal | None
    last_restocked_at: datetime | None

class ShoppingListItem(Base):
    id, household_id (FK)
    product_name: str
    matched_product_id: int | None (FK -> Product)
    quantity: Decimal | None
    status: str                # "planned" | "purchased" | "skipped"

class ManualSpendEntry(Base):
    id, household_id (FK)
    store_name: str | None
    category: str | None
    amount: Decimal
    spent_on: date
    note: str | None

class BenchmarkSource(Base):
    """Option B from §0 — every comparative claim must cite one of these,
    never an inline magic number."""
    id, name: str               # "NSSO Household Consumption Expenditure Survey 2022-23"
    url: str | None
    category_weights_json: dict # CPI-style basket weights, sourced not invented

class HouseholdScoreSnapshot(Base):
    id, household_id (FK)
    household_efficiency_score: int   # 0-100
    planning_score: int               # 0-100
    shopping_efficiency_score: int    # 0-100
    savings_low: Decimal              # range, never a point estimate
    savings_high: Decimal
    confidence: str                   # "low" | "medium" | "high" — see §3
    methodology_version: str          # so old snapshots stay explainable
    computed_at: datetime
```

`BillUpload` gains one field: `household_id: int | None (FK)` — so an
upload still attaches to a household's signal pool but is never required
to create one.

---

## 3. Scoring Framework — methodology, not magic numbers

Every score is **rules-based and shows its inputs**, consistent with the
existing `BasketOptimization` pattern (`backend/app/services/...
optimization` already computes savings as an explainable, capped formula
— this extends that pattern, doesn't replace it).

### 3.1 Household Efficiency Score (0–100)
Inputs: budget vs. CPI-weighted expected range for household size (Option
B), store mix diversity, frequency regularity. Formula is a weighted sum
of normalized sub-scores, each independently visible to the user ("Store
diversity: 60/100 — you shop at 1 store; households using 2+ stores score
higher here").

### 3.2 Planning Score (0–100)
Inputs: has a shopping list been used in the last 14 days? Pantry data
freshness? Ratio of manual/list-driven purchases vs. ad-hoc bill uploads
with no prior list. Zero data → score is **not computed**, shown as "Not
enough data yet" (never defaulted to a fabricated 50/100 midpoint).

### 3.3 Shopping Efficiency Score (0–100)
Inputs: average unit price vs. `ProductListing` price data already in the
DB for the products the household reports buying (this part *is* real
data — `ProductListing`/`PriceHistory` tables already exist and are
populated by the existing provider scrapers). This is the strongest,
most defensible score because it's the one component backed by your own
real price data, not an external survey.

### 3.4 Estimated Savings Range
**Always a range, never a point estimate** (the spec explicitly says
"no fake precision"). Reuses the existing `BasketOptimization`
4-lever methodology (store optimization, pantry planning, purchase
timing, brand alternatives) already specced in `PHASE1_BETA_LAUNCH_PLAN.md`
Phase 2 Task 7, capped at 18%. Confidence label degrades honestly:

| Confidence | Shown when |
|---|---|
| Low | Only Step 1–3 answered, no price-backed data |
| Medium | Shopping snapshot or pantry data present |
| High | Real `ProductListing` price comparisons available for ≥3 of the household's reported frequent categories |

---

## 4. Onboarding Flow — insight after every answer

Each step below: **question → immediate computed insight → next
question.** No insight is shown without backing logic; if logic can't yet
produce one (e.g., budget benchmark with no `BenchmarkSource` row loaded
yet), the UI shows an honest placeholder ("Add this data source to
unlock this insight") rather than skip silently or fabricate.

**Step 1 — Household Profile** → insight: budget vs. Option-B CPI-derived
expected range, labeled "modeled estimate, not measured against other
households" until N≥30 real households exist (then upgrades to a real
percentile claim automatically — the UI string is driven by `confidence`,
not hardcoded).

**Step 2 — Shopping Behaviour** → insight: store-mix-based statements
sourced from the same `BenchmarkSource` table (e.g. a citable, public
stat about quick-commerce convenience premiums — research once, store
once, reuse forever; never invent inline).

**Step 3 — Shopping Style** → insight: derived directly from the
multi-select, zero external data needed — these are reflective statements
("you selected save-money + bulk-buyer → you're price-sensitive"), which
is honest because it's just restating the user's own input back as a
synthesized label, not a comparative claim.

**Step 4 — Frequent Categories** → insight: category-level price
volatility, computed from real `PriceHistory` rows already in the DB —
"X of your selected categories had >15% price variation across stores in
the last 30 days." This is genuinely real data, already collected.

**Step 5 — Shopping Snapshot** → insight: per-item spend vs. the
category benchmarks from Step 1, same confidence-labeling rule.

**Step 6 — Savings Potential Engine** → see §3.4.

**Step 7 — Personalized Dashboard** → composite of all of the above,
rendered before Step 8 is ever offered.

**Step 8 — Data Improvement Options** → bill upload, shopping list,
pantry entry, manual spend — framed as "Help us improve your
recommendations," each with a one-line "why this helps" tied to which
score component it raises.

---

## 5. UI Wireframes (mobile-first, then desktop deltas)

### Mobile (primary)
```
┌─────────────────────────┐
│ ← Step 1 of 7        ●○○○○○○│
│                          │
│  How many people live    │
│  in your household?      │
│                          │
│  [ - ]   4   [ + ]       │
│                          │
│  ┌────────────────────┐ │
│  │ 💡 Households of 4  │ │
│  │ in Hyderabad spend  │ │
│  │ a modeled ₹9,500–   │ │
│  │ ₹13,000/mo (CPI-    │ │
│  │ based estimate)     │ │
│  └────────────────────┘ │
│                          │
│            [ Continue → ]│
└─────────────────────────┘
```
Insight card always appears **between** the answer and the "Continue"
button — never after navigating away, so it can't be missed or feel
like an afterthought.

### Desktop
Same step sequence, but two-column: form on the left (~40%), insight
panel pinned on the right (~60%) and updates live as fields change
(debounced) rather than waiting for "Continue" — desktop users expect to
see the dashboard-like panel react in real time.

---

## 6. Empty States

| Surface | Empty state copy |
|---|---|
| Dashboard, no household data at all | "Tell us about your household to get your first insights — takes 2 minutes." |
| Comparative benchmark, N<30 households | "Not enough households on the platform yet to compare you to others. Showing modeled estimates instead." |
| Shopping Efficiency Score, no price data for selected categories | "We don't have price data for your selected categories yet — score will appear once we do." |
| Bill Upload, OCR failure (existing) | Already shipped — "We read the bill, but couldn't find any items," with debug panel in dev. |
| Pantry, no items added | "Add what's in your pantry to get restocking alerts before you run out." |

---

## 7. Public Beta Recommendations

1. **Ship Steps 1–3 first** (Household Profile, Shopping Behaviour,
   Shopping Style) — zero dependency on price data, fastest to build,
   immediately gives the "system is learning about me" feeling.
2. **Gate the comparative-cohort claims behind Option A** (defer until
   N≥30) for the actual beta cohort — don't pretend you have peers to
   compare against on day 1 with 20-50 households.
3. **Keep bill upload visible but explicitly optional** from day one —
   don't hide it, just don't make it Step 1.
4. **Track which data source actually moves scores** during beta — if
   pantry tracking turns out to be too much friction for too little
   score lift, cut it before general availability rather than after.

---

## 8. Trust-Building Recommendations

- Every score card shows a "How we calculated this" expandable — methodology, not just the number (mirrors the existing debug-panel philosophy already built for bill upload).
- Every comparative claim is traceable to a `BenchmarkSource` row with a real citation — if you can't cite it, don't say it.
- Confidence labels (`low`/`medium`/`high`) are shown next to every score, not just internally — let the user see when we're guessing vs. when we know.

---

## 9. Build Phasing (this is a multi-week effort, not one sitting)

| Phase | Scope | Depends on |
|---|---|---|
| 9a | Data model migration (tables in §2) + `BenchmarkSource` seeded with 2-3 real, cited public statistics | §0 decision |
| 9b | Steps 1–3 onboarding UI + insight cards, no scoring yet | 9a |
| 9c | Scoring Engine (§3) + Steps 4-6 | 9b, existing `ProductListing`/`PriceHistory` data |
| 9d | Personalized Dashboard (Step 7) | 9c |
| 9e | Data Improvement Options screen (Step 8) wiring existing bill upload + new pantry/list/manual-entry flows | 9d |

I'd start on 9a once you confirm the §0 call. Want me to begin there?
