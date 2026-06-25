# Beta Readiness Audit — Prototype → Public Beta

Prepared for the transition from Prototype Mode to Public Beta Mode. Goal: never show a real household fabricated data.

---

## PART 1 — Fake Data Inventory

| # | Location | Current Behavior | Trust Risk | Recommended Replacement |
|---|---|---|---|---|
| 1 | `frontend-v2/src/lib/sample-data.ts` (entire file) | Exports `household`, `metrics`, `monthlyTrend`, `categories`, `basketOptions`, `aiFindings`, `products`, `topProducts`, `stores`, `samplePriceList` — all invented numbers for a fictional household "Baseer" | **Critical.** This is the single source feeding most of the dashboard with numbers that look like the logged-in user's real spending. | Keep the file, but rename exports to `SAMPLE_*` and only render them behind an explicit "Sample Household" mode with a persistent banner. Real screens must source from a real API call and render an empty state when that call returns nothing. |
| 2 | `today.tsx` lines ~34–106 (`runningLow`, `buyNowOps`, `canWait`, `inflation`, `inflationTrend`, `cumulativeSavings`, `milestones`, `fiveredAlert`) | Entire dashboard — pantry alerts, buy-now-vs-wait calls, inflation %, savings trend, milestones — is hardcoded and rendered unconditionally for every visitor | **Critical.** A first-time real user sees a fully "lived-in" household history that isn't theirs. | Each section must check for real backing data (basket history, confirmed items, price-tracked products) and independently fall back to "Not enough data yet — upload your first bill" / "Add a few items to unlock this." No section should render sample numbers without a `SAMPLE` badge. |
| 3 | `bill-check.tsx` (`storeCards`, "Top 3 actions", "Good decisions", `samplePriceList` table) | Shows a specific ₹9,250 last-month spend, 3 store price comparisons, and "good decisions you made" — all fictional | **Critical.** Reads as a personalized financial review for a bill that was never uploaded. | Gate this entire page behind "do you have at least one processed bill?" If not, show the sample explicitly labeled, with a single CTA to upload a real one. |
| 4 | `upload.tsx` lines 60–70, 185–196 | When `VITE_API_URL` is unset, `start()` fakes a 1.4s "processing" delay then shows `productsFound: 42`, `categories: 6`, `totalSpend: ₹9,250` labeled "Sample analysis — demo mode" | **High.** The disclaimer is small and appears *after* a real-feeling progress bar; a user who genuinely uploaded a bill could believe these are their results if the backend is briefly misconfigured. | This fallback should never exist on a production build — if `API_BASE` is missing, show a hard error ("Upload is temporarily unavailable"), not invented numbers. Demo mode should be its own explicit route/toggle, never a silent fallback. |
| 5 | `discovery.tsx` `estimateMonthlySpend` / `estimateSavingsPct` (the savings I just built in the last change) | Computes a savings % from 4 questionnaire answers with no real spending data and displays it as "You could save about ₹X/month" | **High** — this is exactly the kind of fabricated insight the audit is meant to catch, and it's the screen I just shipped. | Replace with the transparent rules engine in Part 2 below, and keep the estimate clearly framed as a *pre-bill estimate*, never as a fact. |
| 6 | `ask-ai-widget.tsx` `sampleReply()` | Keyword-matches the user's question and returns a canned paragraph with fabricated confidence percentages (78–92%) and exact ₹ savings, presented as a live AI answer | **Critical.** This is the most deceptive item in the audit — it impersonates a working AI feature with specific, fake numbers. | Either wire it to a real backend recommendation/Q&A endpoint, or disable the widget entirely and replace with "Coming soon" until real AI backing exists. Never ship canned replies as if generated live. |
| 7 | `backend/app/services/providers/mock_provider.py`, wired into `build_price_providers()` (`registry.py`) | A fake "Demo Mart" catalog is included in the **default, production** price-provider list alongside BigBasket/CSV — reachable from the live search/recommendation endpoints | **Critical (backend).** Real users could see a fictional store's prices mixed into real comparisons with no indication it's fake. | Remove `MockProvider` from the default registry; only include it in test fixtures or behind an explicit `ENVIRONMENT=test` check. |
| 8 | `backend/app/services/ocr/mock_ocr_provider.py`, selected via `OCR_ENGINE=mock` env var | Returns identical canned OCR text for any uploaded image | **High (backend).** If this env var is ever set in production (e.g. copy-pasted from a test config), every real user's bill gets the same canned 3-item result, with no error or label. | Guard at startup: refuse to boot with `OCR_ENGINE=mock` when `ENVIRONMENT=production`. |

**Never mix demo and real data** — the consistent fix across all of the above is the same pattern: every screen needs a binary "do I have real backing data?" check before rendering anything number-shaped, and a shared `<SampleModeBanner />` / `<EmptyState />` pair used everywhere instead of ad hoc fallback content.

---

## PART 2 — Household Savings Potential Engine

### Questionnaire (Step 1 — Household Assessment)

Already partially built in `discovery.tsx`; extend the question set to match exactly:

- **Household:** household size, # adults, # children, # senior citizens
- **Spending:** monthly grocery spend, monthly household-consumables spend
- **Shopping behavior:** shopping frequency, primary stores (multi-select), quick-commerce usage (none/occasional/primary)
- **Shopping style:** convenience-first, price-conscious, bulk buying, premium brands, local brands, offer-seeker (multi-select)
- **Pantry behavior:** overbuying, running out of products, expired products, shopping-list usage (multi-select)
- **Goals:** save money, better quality, healthier choices, reduce waste, better planning (multi-select)

### Calculation Engine — rules-based, no AI, no fabrication

Three 0–100 transparency scores, each built from explicit, inspectable rules (no model, no randomness):

**1. Household Efficiency Score**
- Starts at 70 (neutral baseline)
- −15 if quick-commerce usage = "primary" (known price premium vs. planned shopping)
- −10 if shopping frequency = "daily/near-daily" for a household size ≤4 (fragmented, low-basket-value trips cost more per item)
- +15 if shopping-list usage = "always"
- +10 if shopping style includes "bulk buying"
- Clamped to [0, 100]

**2. Spending Efficiency Score**
- Compare reported monthly grocery spend against a **published per-person benchmark band** (e.g. ₹2,000–3,500/person/month for Indian urban households — sourced from public household-consumption survey data, *not* invented; cite the source in the UI tooltip)
- Score = 100 if spend is within or below the band per household size; subtract proportionally for every % above the band's upper bound, floor at 0
- This is the one score most affected by self-report accuracy — label it "estimate" until real bill data replaces it

**3. Planning Score**
- Starts at 60
- −15 each for "overbuying," "expired products" selected
- −10 for "running out of products" selected
- +20 if shopping-list usage = "always"; +10 if "sometimes"
- Clamped to [0, 100]

### Estimated Savings Range — transparent, capped, lever-based

Each lever has an explicit min–max % of monthly grocery spend, applied **only when its trigger condition is met** — no lever fires "by default":

| Lever | Trigger | Min % | Max % | Methodology |
|---|---|---|---|---|
| Store Optimization | quick-commerce = primary/occasional | 3% | 6% | Published price-premium range of quick-commerce vs. hypermarket/wholesale on identical SKUs |
| Pantry Optimization | overbuying or expired-products selected | 2% | 5% | Industry waste-reduction studies on household food/consumable spoilage from overbuying |
| Brand Substitution | style includes "premium brands" AND goal includes "save money" | 2% | 4% | Average price gap between premium and mid-tier equivalent SKUs in the same category |
| Purchase Timing | shopping-list usage ≠ "always" (i.e. some reactive buying) | 1% | 3% | Price-cycle timing avoided by reactive, off-list purchases |

- **Total estimated %** = sum of triggered levers' min/max (only levers whose trigger fired contribute)
- **Hard cap at 18%** total (max), regardless of how many levers fire, to avoid implausible claims
- **₹ range** = `[monthly_spend × total_min%, monthly_spend × total_max%]`
- Every lever shown in the breakdown UI with its own ₹ sub-range and one-line methodology, exactly as in the user's example:

```
Potential Monthly Savings: ₹800–₹1,700
  Store Optimization     ₹240–480   (quick-commerce premium)
  Pantry Optimization    ₹160–400   (reduces overbuying/waste)
  Brand Substitution     ₹160–320   (mid-tier swaps, premium-brand shoppers)
  Purchase Timing        ₹80–240    (avoids reactive, off-list buying)
```

- Permanent disclaimer, not fine print: *"This is a pre-bill estimate based on patterns from your answers, not your actual spending. Upload a bill or log a few purchases to replace this with real numbers."*
- **Critical product rule:** once a user has ≥1 real processed bill, this screen must switch from the questionnaire-only estimate to a bill-data-informed version (e.g. actual category spend vs. the same benchmark bands) — never keep showing the pre-bill estimate once real data exists.

---

## Onboarding Flow (updated)

1. **Household Assessment** — the question set above (extends what's already in `discovery.tsx`)
2. **Personalized Savings Estimate** — the 3 scores + lever breakdown above, replacing today's `estimateSavingsPct` heuristic
3. **Product Capabilities** — Bill Analysis, Pantry Assistant, Shopping Lists, Price Intelligence, Buy Now vs. Wait (extends today's 4-card capabilities screen with the 2 missing capabilities)
4. **Actions** — Upload Bill, Add Shopping List, Enter Grocery Spend, Explore Sample Household *(explicitly labeled SAMPLE, not a silent demo)*

---

## Database Changes Required

```sql
-- New table: one row per completed household assessment
household_assessments (
  id, user_id (nullable FK -> users, until auth is mandatory),
  household_size, adults, children, seniors,
  monthly_grocery_spend, monthly_consumables_spend,
  shopping_frequency, primary_stores JSONB, quick_commerce_usage,
  shopping_style JSONB, pantry_behaviors JSONB, goals JSONB,
  created_at
)

-- New table: computed output, versioned so methodology changes don't corrupt history
household_scores (
  id, assessment_id FK, methodology_version,
  household_efficiency_score, spending_efficiency_score, planning_score,
  estimated_savings_low, estimated_savings_high,
  lever_breakdown JSONB,  -- per-lever {name, low, high, methodology}
  computed_at
)
```

Existing `Basket`/`BasketItem` tables are untouched; once a user has real baskets, the savings screen should join against actual category spend instead of the assessment-only estimate (re-uses existing schema, no new tables needed for that path).

---

## Screens Requiring Redesign

| Screen | Required Change |
|---|---|
| `/today` | Real-data branching for every widget; empty states; remove unconditional `sample-data.ts` import |
| `/bill-check` | Gate behind "has ≥1 real bill"; sample path explicitly labeled |
| `/upload` | Remove silent demo-mode fallback; hard error if backend unreachable |
| `/discovery` | Replace client-only heuristic with the rules engine (ideally computed server-side so it's auditable/testable, not duplicated client logic) |
| `ask-ai-widget` | Disable or clearly badge "Sample suggestions" until backed by a real endpoint |
| Backend `providers/registry.py` | Remove `MockProvider` from default production registry |
| Backend `bill_processing_service.py` / startup | Refuse `OCR_ENGINE=mock` when `ENVIRONMENT=production` |

---

## Priority Implementation Roadmap

**P0 — Trust-critical, before more real users (ship first):**
1. Remove `MockProvider` from default production price-provider list
2. Guard against `OCR_ENGINE=mock` in production at startup
3. Remove `upload.tsx`'s silent demo-mode fallback
4. Add empty states to `/today` and `/bill-check` so a first-time real user never sees fabricated history

**P1 — New savings engine (this is the headline beta feature):**
5. `household_assessments` + `household_scores` migrations
6. Backend scoring service implementing the lever-based engine above (pure functions, fully unit-testable, no AI)
7. Endpoint to submit assessment → return scores + savings range
8. Wire `/discovery` to call it instead of the client-only heuristic

**P2 — Onboarding polish:**
9. Extend question set to the full spec (adults/children/seniors split, consumables spend, quick-commerce usage)
10. Add Pantry Assistant / Price Intelligence / Buy Now-vs-Wait cards to capabilities screen
11. Re-run the savings screen against real bill data once a bill exists, replacing the pre-bill estimate

**P3 — Cleanup:**
12. `ask-ai-widget`: real backing or "Coming soon" state
13. Shared `<SampleModeBanner />`/`<EmptyState />` components, applied everywhere `sample-data.ts` is currently used directly

---

## Launch Readiness Score: **35 / 100**

The core pipeline (upload → OCR → parse → match → recommend) now works end-to-end after the CORS and asyncpg `sslmode` fixes. But nearly the entire "insight" surface — the dashboard, bill-check, ask-AI, and the savings screen I just shipped — is fabricated and presented as real, which is precisely the trust failure mode this audit was commissioned to catch. None of it is a quick patch; it requires the empty-state/real-data branching pattern applied consistently plus the new rules engine to replace the questionnaire-only heuristic. P0 items are small and should ship before any more beta invites go out; P1 is the substantial build.
