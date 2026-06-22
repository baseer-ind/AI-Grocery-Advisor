# Architecture Readiness Report

Scope: an assessment of the current codebase against long-term
multi-channel, AI-assisted-development, and domain-modularity goals,
produced **before** any repository-wide refactor, per explicit
direction to review documentation first and approve a refactor
afterward. No code structure changes are included in this report.

Status note: Alembic migrations, the background-job framework (`arq`),
and search scalability (`pg_trgm` GIN indexes) — all referenced below
as still-needed infrastructure in the original founder review — are
**already implemented and delivered in open PR #4**
(`claude/architecture-hardening`). This report evaluates what's left
after that work, not before it.

## 1. Current Architecture Diagram

```
                    ┌────────────────────┐
                    │  Next.js frontend  │
                    └─────────┬──────────┘
                              │ HTTP (JSON)
                              ▼
                    ┌────────────────────────────┐
                    │     FastAPI backend        │
                    │       (app/main.py)        │
                    └──┬───────────┬──────────┬───┘
        ┌──────────────┘           │          └───────────────┐
        ▼                          ▼                          ▼
┌───────────────┐      ┌─────────────────────┐    ┌─────────────────────┐
│ /search        │      │ /providers/search   │    │ /bills/upload(-async)│
│ product_search_│      │ provider_aggregator │    │ bill_processing_     │
│ service.py      │      │ .py (asyncio.gather)│    │ service.py            │
└──────┬─────────┘      └──────────┬──────────┘    └──────────┬──────────┘
       │                            │  cache (Redis)            │ enqueue (Redis/arq)
       ▼                            ▼                            ▼
┌────────────────┐        ┌──────────────────┐        ┌─────────────────────┐
│ pricing_engine,  │       │ PriceProvider     │       │  arq worker process  │
│ recommendation_  │       │ - CSVProvider     │       │  (app/worker.py)     │
│ engine.py         │       │ - MockProvider    │       │  OCR → basket →      │
└──────┬───────────┘        │ - BigBasketProvider│      │  recommendations     │
       │                    └──────────┬─────────┘      └──────────┬──────────┘
       ▼                               ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Postgres                                    │
│  products, product_listings (+location_key), price_history,             │
│  users, bill_uploads, baskets, basket_items, basket_recommendations       │
└─────────────────────────────────────────────────────────────────────────┘
```

All business logic (pricing, recommendation, OCR, basket-building) is
already framework-agnostic Python under `app/services` and
`app/domain` — none of it imports FastAPI, Pydantic request/response
types, or anything HTTP-specific. The HTTP layer (`app/api/v1/routes_*.py`)
is a thin adapter that does only request parsing and response shaping.

## 2. Proposed Future Architecture Diagram

```
                ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
                │   Web   │ │ Mobile  │ │ Browser  │ │ WhatsApp / │
                │  (Next) │ │ iOS/And │ │Extension │ │   Voice    │
                └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘
                     └───────────┴────────────┴─────────────┘
                                   │  (all channels call the same API contract)
                                   ▼
                       ┌─────────────────────┐
                       │   API Gateway layer  │   (FastAPI today; could
                       │  (HTTP/REST today,   │    add gRPC/GraphQL per
                       │   GraphQL/gRPC later)│    channel without
                       └──────────┬───────────┘    touching domain code)
                                  ▼
        ┌───────────────────────────────────────────────────────┐
        │                  Domain Service Layer                  │
        │  Product | Pricing | Recommendation | Bill Processing  │
        │  User | Offers (planned) | Analytics (planned)         │
        │  — each domain exposes a small contract (functions/    │
        │  dataclasses), no domain imports another domain's      │
        │  internals, only its public contract                   │
        └───────────────────────┬─────────────────────────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │   Event Bus (future) │  Bill Uploaded,
                       │  (Redis Streams/     │  Basket Generated,
                       │   Kafka/SNS later)   │  Recommendation Generated,
                       └──────────┬───────────┘  Price Updated, etc.
                                  ▼
                  ┌────────────────────────────────┐
                  │  Postgres + Redis + arq workers  │
                  └────────────────────────────────┘
```

The key structural change implied here is not a rewrite — it's
formalizing domain boundaries that mostly already exist as separate
files/modules into explicit packages with a contract surface, and
inserting an event bus only when a second consumer of an event
actually exists (see Event-Driven Readiness, below).

## 3. Domain Boundaries

| Domain | Current home | Status |
|---|---|---|
| Product | `domain/models.py` (`Product`, `ProductListing`), `services/product_search_service.py` | Implemented, isolated |
| Pricing | `services/pricing_engine.py` | Implemented, isolated, pure functions |
| Recommendation | `services/recommendation_engine.py` | Implemented, isolated, pure functions |
| Bill Processing | `services/bill_processing_service.py`, `bill_parsing_service.py`, `basket_service.py`, `bill_recommendation_service.py`, `services/ocr/*` | Implemented; OCR is provider-pattern; coordinator module (`bill_processing_service.py`) ties pricing/recommendation/OCR together |
| User | `domain/models.py` (`User`), nullable ownership FKs on `BillUpload`/`Basket` | Schema only — no auth, no service layer yet |
| Offers | Not built | Planned (`ARCHITECTURE.md` feature 4) |
| Analytics | Not built | Planned (no current spec beyond `PriceHistory` model) |

Each implemented domain already lives in its own file(s) with no
domain reaching into another domain's internals — e.g.
`recommendation_engine.py` takes `ListingView` value objects, not
`ProductListing` ORM rows or pricing-engine internals. This is closer
to domain isolation than the file layout (flat `services/` directory)
suggests.

## 4. Dependency Map

Full intra-`app` import graph (every `from app.X import Y` / `import app.X`
across `backend/app`), verified by direct grep — no abbreviation:

```
main.py            → api.v1.routes_bill_upload, api.v1.routes_bill_upload_async,
                      api.v1.routes_providers_search, api.v1.routes_search,
                      core.config

worker.py          → core.config, db.session, domain.models,
                      services.bill_processing_service

queue.py           → core.config

api/v1/routes_search.py
                   → db.session, domain.schemas, services.product_search_service

api/v1/routes_providers_search.py
                   → core.config, domain.schemas, domain.schemas_providers,
                      services.provider_aggregator,
                      services.providers.{bigbasket_provider,csv_provider,mock_provider}

api/v1/routes_bill_upload.py
                   → domain.schemas_bills, services.bill_processing_service

api/v1/routes_bill_upload_async.py
                   → db.session, domain.models, domain.schemas_bills,
                      domain.schemas_bills_async, queue

services/bill_processing_service.py
                   → core.config, domain.schemas, domain.schemas_bills,
                      domain.schemas_providers, services.basket_service,
                      services.bill_parsing_service,
                      services.bill_recommendation_service,
                      services.ocr.{base,mock_ocr_provider,tesseract_provider},
                      services.providers.{bigbasket_provider,csv_provider,mock_provider}

services/bill_recommendation_service.py
                   → services.basket_service, services.provider_aggregator,
                      services.providers.base

services/basket_service.py
                   → services.bill_parsing_service

services/provider_aggregator.py
                   → core.cache, services.pricing_engine, services.providers.base,
                      services.recommendation_engine

services/product_search_service.py
                   → domain.models, domain.schemas, services.pricing_engine,
                      services.recommendation_engine

services/recommendation_engine.py
                   → domain.models, services.pricing_engine

services/pricing_engine.py
                   → domain.models

services/providers/{bigbasket_provider,mock_provider,csv_provider}.py
                   → services.providers.base

services/ocr/{tesseract_provider,mock_ocr_provider}.py
                   → services.ocr.base

domain/schemas_bills.py     → domain.schemas, domain.schemas_providers
domain/schemas_providers.py → domain.schemas
domain/schemas_bills_async.py → domain.schemas_bills
domain/models.py            → (none — leaf)
domain/schemas.py           → (none — leaf)

core/cache.py    → core.config
core/config.py   → (none — leaf)
db/session.py    → core.config
db/seed.py       → db.session, domain.models
```

**Layering, summarized top-down:**

```
api/*  ──depends on──>  services/*  ──depends on──>  domain/*, core/*
worker.py, queue.py  ──depends on──>  services/*, domain/*, core/*, db/*
domain/* and core/config.py  ──depend on──>  nothing internal (leaves)
```

**Infrastructure dependencies:** Postgres (via `db/session.py`, SQLAlchemy
async engine), Redis (via `core/cache.py` for caching and `queue.py`/`worker.py`
for the arq job queue — same Redis instance, two distinct uses), `httpx`
(BigBasket provider), `pytesseract`/Tesseract binary (OCR provider).

## 5. Circular Dependency Analysis

**No circular dependencies found.** The import graph above is a strict
DAG: `domain/models.py` and `core/config.py` are leaves with zero
internal imports; every `services/*` module imports only `domain/*`
and other `services/*`/`core/*` modules in a consistent direction
(no service imports anything from `api/*`); every `api/v1/routes_*.py`
imports only `services/*`, `domain/*`, `db.session`, `core/*`.
`app.worker` and `app.queue` sit alongside `api/*` as another
consumer of the same `services/*` layer, not introducing a cycle.

The one place worth flagging as a *latent* coupling risk rather than a
cycle: `services/bill_processing_service.py` directly imports concrete
provider classes (`BigBasketProvider`, `CSVProvider`, `MockProvider`)
and concrete OCR classes (`TesseractOCRProvider`, `MockOCRProvider`)
rather than depending only on the `PriceProvider`/`OCRProvider`
interfaces and receiving instances via injection. This doesn't create
a cycle, but it does mean adding a new provider/OCR backend requires
editing this file rather than just registering a new implementation,
and it makes the bill-processing domain harder to unit-test in
isolation from specific vendor integrations. Flagged as a candidate
for Partial Modularization (see Recommendation, below), not urgent.

## 6. Channel-Readiness Evaluation

| Channel | Blocked by current architecture? | Notes |
|---|---|---|
| Web (current Next.js) | No | Already the primary consumer |
| Mobile (iOS/Android) | No | Same REST API; no web-specific assumptions in routes (no cookies/session state, no HTML rendering) |
| Browser Extension | No | Same REST API; CORS config (not yet reviewed) is the only adaptation needed |
| WhatsApp Bot | No | Needs a thin adapter translating WhatsApp messages → existing `/search`, `/bills/upload*` calls; no service-layer change needed |
| Voice Assistant | No | Same as WhatsApp — needs an NLU-to-API adapter, not a backend change |
| Partner APIs | Partially | Needs API-key auth and per-partner rate limiting (no auth exists yet at all — flagged in ARCHITECTURE_HARDENING.md as explicitly out of scope for PR #4) |
| Future AI Agents | No | Already structured as composable services with typed Pydantic schemas in/out — agents can call the same HTTP endpoints or, if colocated, import `services/*` functions directly |

**Conclusion: no current architectural decision blocks any of these
channels.** The absence of an auth/identity layer is the actual
blocker for Partner APIs specifically (need API keys/rate limits), not
the service-layer structure. This is a smaller, well-understood gap,
not a structural rewrite.

## 7. Assessment Against Stated Principles

**Domain-Oriented Modular Architecture** — Partially achieved. Logical
domains (Pricing, Recommendation, Bill Processing) already exist as
separate files with clean one-directional imports (Section 4). What's
missing is the *packaging*: domains are flat files in `services/`
rather than `domain_name/` packages with an explicit `__init__.py`
contract surface, so nothing currently stops a future change from
importing an internal helper from another domain's module instead of
its intended public function.

**Contract-Based Design** — Mostly achieved at the data layer (Pydantic
schemas, dataclasses like `ListingView`/`NormalizedListing` already
decouple domains from each other's ORM models), partially achieved at
the dependency-injection layer (the provider/OCR concrete-class-import
issue noted in Section 5 is the main gap).

**Impact Analysis Framework** — Not yet formalized as a process; this
report includes a template below (Section 9) to apply to future PRs.

**Event-Driven Readiness** — Not implemented, but not blocked either.
See Section 8.

**AI-Assisted Development Readiness** — See Section 10.

**Long-Term Scalability** — See Section 11.

## 8. Event-Driven Readiness

No event bus exists today; all flows are direct function calls
(synchronous in-process, or the existing arq job-queue for bill OCR).
This is fine at current scale — premature event infrastructure adds
operational cost (a broker, schema versioning, dead-letter handling)
with no current second consumer to justify it.

Identified future event types and where they'd naturally originate:

| Event | Natural emission point | First likely consumer |
|---|---|---|
| Bill Uploaded | `routes_bill_upload_async.py` (already enqueues a job — an arq job *is* a primitive event today) | OCR/basket worker (already exists), later: analytics |
| Basket Generated | `app/worker.py` after `process_bill_job` builds the `Basket` row | Recommendation worker (currently the same function, could split), later: notifications |
| Recommendation Generated | `bill_recommendation_service.py` / `provider_aggregator.py` | UI (currently direct response), later: price-alert evaluation (Feature 8) |
| Price Updated | A future scheduled price-snapshot job (Feature 7, not built) | Price-alert worker (Feature 8, not built), trend classifier |
| User Profile Updated | Not built (no user service yet) | Personalization/recommendation re-ranking (future) |

Recommended sequencing: keep using direct function calls / the
existing arq queue until a second independent consumer of one of
these events actually exists (e.g., Feature 8's price-alert worker
needs to react to Price Updated independently of the search request
path). At that point, introduce a lightweight event abstraction
(Redis Streams, since Redis is already a dependency — no new
infrastructure) rather than jumping straight to Kafka/SNS.

## 9. Impact Analysis Template (for future PRs)

To be applied to every future PR going forward:

```
## Impact Analysis
- Files affected:
- Domains/modules affected:
- Dependencies affected (internal services, external APIs, DB schema):
- Breaking changes (API contract, DB schema, function signatures):
- Migration requirements (Alembic migration needed? data backfill?):
- Test impact (new tests needed, existing tests that must change):
- Rollback plan (can this be reverted with a single `git revert` +
  `alembic downgrade`, or does it need a data-fix script?):
```

## 10. AI-Assisted Development Readiness

Strengths already in place:
- Every domain's public surface is typed (Pydantic schemas, dataclasses,
  `Mapped`/`mapped_column` ORM types) — an AI agent editing one module
  can infer correct usage from type signatures without reading the
  implementation of dependent modules.
- Pure-function cores (`pricing_engine.compute_pricing`,
  `recommendation_engine.build_recommendations`) have no I/O, no
  hidden state, and existing unit tests with no DB dependency — safe
  for an agent to modify and verify in isolation.
- One-directional import graph (Section 4) means an agent changing
  `services/pricing_engine.py` only needs to check callers
  (`recommendation_engine.py`, `product_search_service.py`,
  `provider_aggregator.py`), not callees.

Where coupling currently requires broader context to change safely:
- `bill_processing_service.py` (Section 5) — touching provider/OCR
  selection requires understanding all concrete provider classes, not
  just the `PriceProvider`/`OCRProvider` interfaces.
- Flat `services/` directory mixes domains in one directory listing —
  an agent doing a directory listing or grep across `services/*.py`
  gets Pricing, Recommendation, and Bill Processing code interleaved,
  increasing the chance of reading irrelevant context before finding
  the relevant file. (This is a discoverability cost, not a
  correctness risk — the import graph itself is still clean.)
- No formal contract docstrings/interfaces module per domain — an
  agent must currently infer "this is the public API of the Pricing
  domain" by reading the whole file rather than a dedicated
  `__init__.py`/`contracts.py`.

What would most improve this (see Recommendation, Section 12):
moving each domain's files into a `domain_name/` package with an
explicit `__init__.py` re-exporting only the intended public surface,
without changing any internal logic — i.e., Partial Modularization,
not a rewrite.

## 11. Long-Term Scalability Review

| Scale | Cost-to-fix-later | Business impact | Engineering risk | Priority |
|---|---|---|---|---|
| 1,000 users | Low — current stack (single Postgres, single Redis, one worker) handles this comfortably; already async end-to-end (PR #4) | Low | Low | Not urgent |
| 100,000 users | Medium — connection pool sizing, Redis cache hit-rate tuning, provider rate-limit backoff (BigBasket) become real concerns; `pg_trgm` indexing (already done in PR #4) becomes load-bearing, not optional | Medium — search latency directly affects conversion | Medium — needs load testing before this scale, not after | High — should be validated with load tests before next major feature launch |
| 1,000,000 users | High — single Postgres instance likely needs read replicas; arq worker pool needs horizontal scaling (already trivially possible — arq workers are stateless processes); auth/rate-limiting (still entirely missing) becomes mandatory, not optional | High | High if deferred — retrofitting auth and read replicas under live load is much riskier than building them in now while traffic is low | Medium-high — auth/identity is the one item here cheap to build now and expensive to retrofit later; defer replica topology until there's real traffic data to size it against |

The single highest-leverage scalability item, independent of user
count, is building the **User/auth domain** now (schema already exists
per PR #4, only nullable FKs) while it's cheap, rather than retrofitting
ownership onto millions of existing anonymous rows later.

## 12. Recommendation

**B. Partial Modularization.**

**Justification:** The codebase already exhibits clean one-directional
dependencies and domain separation at the *file* level (Section 4) —
there are no circular dependencies to untangle and no God-objects
reaching across domains. A Full Domain-Driven Refactor (Option C)
would mostly be moving already-correct code into different folders at
high effort and regression risk, for a codebase still small enough
(under a dozen service modules) that the navigational cost of a flat
`services/` directory is real but modest. Keeping the current
structure unchanged (Option A) would leave the two genuine,
identifiable risks in place: the bill-processing-service's
direct-concrete-class coupling to providers (Section 5), and the lack
of an explicit per-domain contract surface for future AI-assisted
edits (Section 10).

**Recommended partial-modularization scope** (for the user's approval
before starting):
1. Group `services/pricing_engine.py`, `recommendation_engine.py`,
   `provider_aggregator.py`, `services/providers/*` into a `domains/pricing/`
   package (or similar), each with an `__init__.py` that re-exports
   only the public functions/types currently imported by other
   modules.
2. Same treatment for Bill Processing
   (`bill_processing_service.py`, `bill_parsing_service.py`,
   `basket_service.py`, `bill_recommendation_service.py`, `services/ocr/*`).
3. Convert `bill_processing_service.py`'s direct provider/OCR
   instantiation into a small registry/factory keyed by config, so
   adding a provider doesn't require editing this coordinator file.
4. No change to `domain/models.py`, `domain/schemas*.py`, `api/v1/*`,
   `db/*`, `core/*`, `worker.py`, `queue.py` — these are already
   correctly scoped and don't need to move.

**Tradeoffs:** Real but bounded effort (estimate below) for a
meaningful discoverability and AI-assisted-editing improvement; does
*not* address auth/identity (separate, higher-priority item per
Section 11) or event-driven infrastructure (not yet justified, Section
8) — those remain separate future workstreams regardless of which
option is chosen here.

**Effort estimate:** 1–2 days for the file-move + import-path update +
re-running the full test suite (40 existing tests need their import
paths verified, no logic changes expected); roughly half a day
additionally for the provider/OCR registry refactor in item 3.

**Long-term impact:** Each domain becomes independently
navigable/testable with a clear public contract, directly addressing
the AI-assisted-development goal stated by the user, without the risk
profile of a full rewrite. This sets up cleanly for Offers and
Analytics domains (not yet built) to be added as new sibling packages
from day one, rather than retrofitted later.

**This report recommends Option B but takes no action on it.** Per
explicit instruction, no refactor will begin until this documentation
is reviewed and the user explicitly approves proceeding.
