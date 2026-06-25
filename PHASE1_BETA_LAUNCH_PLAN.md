# Phase-1 Beta Launch Plan

Scope: only tasks that move the needle on beta readiness. Current blocker —
real bill uploads return 0 products / 0 categories / ₹0 spend — is Phase 1,
Task 1, and everything else is sequenced behind it.

## Diagnostic instrumentation shipped this round

Before touching product behavior, instrumentation was added so the next
debugging step is reading evidence, not guessing:

- `OCRResult.confidence` — mean per-word Tesseract confidence (image_to_data),
  `None` for PDFs/mock.
- `LLMExtractionResult.raw_response` — Gemini's raw text on both success and
  failure (previously only failures got a message, successes got nothing).
- `bill_processing_service.process_bill()` now logs one structured line per
  upload: `ocr_confidence`, `detected_lines`, `rule_based_items`,
  `used_llm_fallback`, `matched`, `unmatched`. This fires on **every**
  upload (sync route + async worker), independent of debug mode — so
  Render's logs are now a usable record of real failures, not just 500s.
- `POST /api/v1/bills/upload?debug=1` now returns a `debug` object with: raw
  OCR text, OCR confidence, detected line count, matched/unmatched product
  counts, whether the Gemini fallback fired, which provider is configured,
  and Gemini's message + raw response. `frontend-v2/src/routes/upload.tsx`
  renders this as a panel when `/upload?debug=1` is visited.
- `LLM_FALLBACK_PROVIDER` default changed from `"none"` to `"gemini"` —
  it only actually activates if `GEMINI_API_KEY` is also set, so this is
  safe everywhere, but it means Render's existing `GEMINI_API_KEY` now
  actually gets used without any dashboard change.

This directly produces the evidence needed to tell apart:

| Failure mode | What the debug/log output shows |
|---|---|
| A. OCR failure | `ocr_confidence` very low or `raw_ocr_text` empty/garbled |
| B. Product parsing failure | `raw_ocr_text` looks readable, `rule_based_items` (pre-fallback) is 0 |
| C. Alias matching failure | `matched=0`, `unmatched>0` — items existed, matching didn't |
| D. Gemini fallback disabled | `llm_fallback_triggered=false`, `gemini_message` says "not configured" or "disabled" |
| E. Gemini fallback failure | `llm_fallback_triggered=false`, `gemini_message` shows a vendor/parse error, `gemini_response` shows what it actually said |

No guessing from here — the next real D-Mart/Reliance/Kirana/BigBasket
upload's logs will say which of A-E it is.

---

## Phase 1 — Critical (must complete before any beta user sees the product)

| # | Task | Effort | Dependencies | Risk | Beta-readiness impact |
|---|---|---|---|---|---|
| 1 | Enable Gemini fallback | **Done this round.** Default flipped to `"gemini"`; Render already has `GEMINI_API_KEY` set, so no dashboard change needed. | none | Low — Null provider still gates on missing key | High — likely root cause of 0-product bug |
| 2 | Add OCR/pipeline debug logging + `?debug=1` panel | **Done this round.** | none | Low | High — turns every future bug report into evidence |
| 3 | Verify extraction on D-Mart / Reliance / Kirana / BigBasket bills | 0.5–1 day (needs 4 real sample bills) | Task 1, 2 | Medium — real bills may reveal new regex gaps | Critical — this is the actual go/no-go gate |
| 4 | Build product verification UI | **Mostly done** — `upload.tsx`'s `VerificationPanel`/`VerificationRow` already lets a user confirm/reject/search a match; needs Task 3's findings to know which formats still need it | Task 3 | Low | High — turns "wrong match" into a 10-second fix, not a trust breach |
| 5 | Store user corrections | **Done in existing code** — `/bills/items/{id}/confirm` writes to `product_aliases`, the existing alias-learning system | none | Low | Medium — compounds matching accuracy per correction |

**Phase 1 readiness score: 55/100.** The infrastructure for diagnosis,
fallback, and correction all exists or just landed — the one thing nobody
has verified yet is whether real bills (not the synthetic test fixture)
actually produce items end-to-end. That single unknown is why this isn't
higher.

---

## Phase 2 — High priority (trust and onboarding, once extraction works)

| # | Task | Effort | Dependencies | Risk | Beta-readiness impact |
|---|---|---|---|---|---|
| 6 | Household assessment onboarding | 2–3 days (4-step flow, no AI, deterministic) | none | Low | High — replaces "upload a bill cold" with value-first onboarding |
| 7 | Savings potential engine (rules-based, 4-lever, capped at 18%) | 2–3 days backend + DB migration | Task 6 (needs assessment answers as input) | Medium — wrong methodology erodes trust faster than no estimate at all | High — the audit's centerpiece deliverable |
| 8 | Remove all remaining fake data | 1 day (today.tsx/bill-check.tsx done; sample-data.ts itself and discovery.tsx's heuristic remain) | none | Low | Critical — directly enforces "never show fabricated data" |
| 9 | Replace with empty states | **Mostly done** this session (`/today`, `/bill-check`); discovery.tsx and any remaining dashboards still need the same gate | Task 8 | Low | Critical — same rule, applied everywhere |

**Phase 2 readiness score (if completed): 75/100.** Gets the product to
"every screen tells the truth," but the savings engine and onboarding are
still new surface area that needs real-user feedback before it's trustworthy
at scale.

---

## Phase 3 — Optional (post-beta growth levers)

| # | Task | Effort | Dependencies | Risk | Beta-readiness impact |
|---|---|---|---|---|---|
| 10 | Referral system | 2–3 days | A working core product (Phase 1+2) | Low | Low for readiness — growth, not trust |
| 11 | Community pricing | 1+ week (needs moderation/abuse controls) | Real user base from beta | Medium — bad data poisons price comparisons | Low — nice-to-have, not a launch blocker |
| 12 | Price history | 3–5 days (needs sustained data collection first) | Weeks of real bill uploads | Low | Low — valuable later, meaningless on day 1 (no history yet) |

**Phase 3 readiness score: not gating** — none of these affect whether beta
users can trust what they see today; defer until Phase 1+2 are live and
generating real usage data.

---

## Launch checklist

- [x] Gemini fallback enabled by default (active wherever `GEMINI_API_KEY` is set)
- [x] OCR confidence, line counts, match counts, Gemini trace logged on every upload
- [x] `?debug=1` debug panel on `/upload`
- [ ] Confirm via real D-Mart / Reliance / Kirana / BigBasket bills which of A/B/C/D/E is actually happening today — **next concrete action**
- [x] Verification UI for low-confidence matches (already shipped)
- [x] Corrections persist to `product_aliases` (already shipped)
- [ ] Household assessment onboarding (Phase 2)
- [ ] Rules-based savings engine wired to onboarding answers (Phase 2)
- [ ] Remaining fake-data sources removed (`sample-data.ts` consumers outside `/today`/`/bill-check`, `discovery.tsx`'s heuristic)
- [ ] Referral / community pricing / price history (Phase 3, deferred)

**Overall current readiness: 45/100** — up from the 35/100 baseline in the
original audit, on the strength of shipped diagnostics, fallback enablement,
and two screens' empty-state gating. The score won't move meaningfully again
until a real bill from one of the four target stores produces actual line
items end-to-end — that's the next action, not more architecture.
