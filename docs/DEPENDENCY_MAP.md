# Dependency Map

Companion to `docs/ARCHITECTURE_READINESS_REPORT.md` (Section 4 there
has the full annotated import list). This document is the standalone
reference version, kept in sync with the same grep-verified data.

## Layer graph

```
┌──────────────────────────┐   ┌──────────────────────────┐
│  api/v1/routes_*.py       │   │  worker.py, queue.py      │
└─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                                 │
              └───────────────┬─────────────────┘
                               ▼
                   ┌────────────────────────┐
                   │      services/*         │
                   └────────────┬─────────────┘
                                ▼
                   ┌────────────────────────┐
                   │   domain/*, core/*, db/* │
                   └────────────────────────┘
```

Strict one-directional dependency: nothing in `domain/*` or `core/config.py`
imports anything else internal to the app (they are leaves). Nothing in
`services/*` imports from `api/*`. `worker.py`/`queue.py` are a second,
parallel consumer of `services/*`/`domain/*`/`core/*`/`db/*`, not a
new layer.

## Domain-level dependencies

| Domain | Depends on | Depended on by |
|---|---|---|
| Pricing (`pricing_engine.py`) | `domain.models` | `recommendation_engine`, `product_search_service`, `provider_aggregator` |
| Recommendation (`recommendation_engine.py`) | `domain.models`, Pricing | `product_search_service`, `provider_aggregator` |
| Product (`product_search_service.py`, `domain.models.Product/ProductListing`) | Pricing, Recommendation, `domain.schemas` | `routes_search.py` |
| Bill Processing (`bill_processing_service.py` + helpers) | `domain.schemas*`, `core.config`, OCR implementations, `providers.registry`, `basket_service`, `basket_optimization_engine`, `bill_parsing_service`, `bill_recommendation_service`, `basket_comparison_service` (boundary-conversion helpers) | `routes_bill_upload.py`, `worker.py` |
| Providers (`services/providers/*`) | `services.providers.base` only; `providers.registry` additionally depends on the concrete provider classes and `core.config` | `provider_aggregator`, `bill_processing_service`, `bill_recommendation_service`, `basket_comparison_service`, `routes_providers_search.py`, `routes_baskets.py` |
| OCR (`services/ocr/*`) | `services.ocr.base` only | `bill_processing_service` |
| User/Auth (`auth_service.py`, `user_service.py`, `domain.models.User/UserPreferences/UserSession/PasswordResetToken`) | `domain.models`, `core.config`, `google-auth`, `bcrypt` | `routes_auth.py`, `routes_users.py`, `api/v1/deps.py` (current-user resolution), `worker.py`/`routes_bill_upload_async.py`/`routes_baskets.py` (ownership FKs) |
| Basket Comparison (`basket_optimization_engine.py`, `basket_comparison_service.py`, `domain.models.Basket/BasketItem/BasketOptimization`) | `pricing_engine`, `basket_service`, `bill_recommendation_service`, `providers.registry`, `domain.schemas_baskets` | `bill_processing_service.py`, `worker.py`, `routes_baskets.py`, `routes_bill_upload_async.py` (surfacing `BasketOptimizationOut`) |
| Offers | not built | — |
| Analytics | not built | — |

## Infrastructure dependencies

| Infra | Used by | Purpose |
|---|---|---|
| Postgres (asyncpg + SQLAlchemy async) | `db/session.py`, all routes/worker that persist | Primary datastore |
| Redis | `core/cache.py` (search/recommendation cache), `queue.py`/`worker.py` (arq job queue) | Two distinct uses of the same instance — caching and job queue |
| httpx (`AsyncClient`) | `services/providers/bigbasket_provider.py` | External price-provider HTTP calls |
| google-auth (+ `requests` transitive dep) | `auth_service.py` | Google Sign-In ID token verification |
| bcrypt | `auth_service.py` | Password hashing |
| Tesseract (via `pytesseract`) | `services/ocr/tesseract_provider.py` | Bill OCR |
| arq | `worker.py`, `queue.py` | Background job execution |
| Alembic | `backend/alembic/` | Schema migrations |

## Circular dependency analysis

**None found.** Verified by grepping every `from app.` / `import app.`
statement across `backend/app`, re-checked after this PR's new modules
(`basket_optimization_engine.py`, `basket_comparison_service.py`,
`providers/registry.py`, `routes_baskets.py`) — `bill_processing_service.py`
now depends on `basket_comparison_service.py` for boundary-conversion
helpers, and `basket_comparison_service.py` does not depend back on
`bill_processing_service.py`, so the new edge is one-directional (see
Architecture Readiness Report, Section 4/5, for the full per-file listing
and reasoning predating this PR). The only flagged risk is a
*direction-correct but interface-bypassing* coupling:
`bill_processing_service.py` imports concrete OCR classes directly rather
than only their base interface — not a cycle, but a maintenance/
testability cost addressed in the Recommendation section of the
readiness report (Option B, item 3). The equivalent coupling for price
providers was resolved this PR via `providers/registry.py`.

## Future maintenance risks (non-circular)

1. **Concrete-class coupling in `bill_processing_service.py` (OCR only)**
   — adding a new OCR backend still requires editing this coordinator
   file's imports and instantiation logic; price providers no longer
   have this problem (`providers/registry.py`, this PR).
2. **Flat `services/` directory mixes domains** — no import-graph risk,
   but a discoverability cost: listing `services/*.py` interleaves
   Pricing, Recommendation, and Bill Processing files.
3. **User/Auth service layer now exists** (`auth_service.py`,
   `user_service.py`, `api/v1/deps.py`) — resolved the gap previously
   noted here. `api/v1/deps.py` (`get_current_user`/
   `get_current_user_optional`) is now the one place that resolves a
   session token to a `User`; future authenticated routes should depend
   on it rather than re-implementing token parsing.
4. **`google-auth` is the second external HTTP-capable dependency**
   alongside `httpx` (used only for token verification, not general
   HTTP) — acceptable for now, but a third such dependency would be
   worth consolidating.
