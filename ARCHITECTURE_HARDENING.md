# Architecture Hardening (Future Scalability)

This PR addresses the highest-risk architectural issues flagged in the
founder review, before any new product features are built on top of them.
No user-facing behavior changes — every change here is about what the
system can absorb later without a rewrite.

## 1. Updated architecture diagram

```
                         ┌────────────────────┐
                         │   Next.js frontend │
                         └─────────┬──────────┘
                                   │ HTTP
                                   ▼
                         ┌────────────────────┐
                         │   FastAPI backend  │
                         │  (app/main.py)     │
                         └───┬──────────┬─────┘
              ┌──────────────┘          └───────────────┐
              ▼                                          ▼
  ┌─────────────────────┐                  ┌───────────────────────────┐
  │ /search, /providers/ │                  │ /bills/upload (sync)      │
  │ search — provider_   │                  │ /bills/upload-async       │
  │ aggregator.py         │                  │  (enqueue, return 202)    │
  └──────────┬───────────┘                  └────────────┬──────────────┘
             │ asyncio.gather                              │ arq.enqueue_job
             ▼                                              ▼
  ┌────────────────────────┐                    ┌────────────────────────┐
  │ PriceProvider (async)  │                    │   Redis (queue +       │
  │ - CSVProvider          │◄──── cache ────────┤   provider/rec cache)  │
  │ - MockProvider         │                    └───────────┬────────────┘
  │ - BigBasketProvider    │                                │
  │   (httpx.AsyncClient)  │                                ▼
  └────────────────────────┘                    ┌────────────────────────┐
                                                  │   arq worker process   │
                                                  │  (app/worker.py)       │
                                                  │  OCR → basket →        │
                                                  │  recommendations       │
                                                  └───────────┬────────────┘
                                                              ▼
                                                  ┌────────────────────────┐
                                                  │  Postgres              │
                                                  │  users, bill_uploads,  │
                                                  │  baskets, basket_items,│
                                                  │  basket_recommendations│
                                                  │  products (+ GIN trgm),│
                                                  │  product_listings      │
                                                  │  (+ location_key)      │
                                                  └────────────────────────┘
```

Key shift from the original vertical slice: the backend is no longer a
single request → response path. There are now two independent consumers of
Postgres/Redis (the API process and the worker process), and the API
process itself no longer blocks its event loop on any external I/O
(provider HTTP calls, CSV file reads, OCR).

## 2. Database migration scripts

Alembic is now initialized (`backend/alembic/`), configured for the async
engine and pointed at `app.domain.models.Base.metadata` for autogenerate.
One migration is included:

`backend/alembic/versions/cf367f1b212d_location_aware_pricing_user_foundation_.py`

- `CREATE EXTENSION IF NOT EXISTS pg_trgm` (required by the new indexes below)
- `users`, `bill_uploads`, `baskets`, `basket_items`, `basket_recommendations` tables
- `product_listings.location_key` column + `(product_id, location_key)` index
- GIN trigram indexes on `products.name` and `products.brand`

Run with `alembic upgrade head` (the existing `app/db/seed.py`'s
`create_all` still works for a from-scratch dev database; the migration is
the path for any database that already has data in it).

## 3. Performance impact analysis

| Change | Before | After | Effect |
|---|---|---|---|
| Provider fan-out | Sequential, sync `httpx.get` per provider; BigBasket's worst case (network timeout) serialized behind every other provider | `asyncio.gather` over async `fetch()`; CSV file read via `asyncio.to_thread` | Total latency ≈ slowest single provider instead of the sum of all providers; event loop stays free to serve other requests while BigBasket's 8s timeout elapses |
| Repeated identical search | Re-ran every provider + rebuilt recommendation set every time | Provider results cached 60s, recommendation sets cached 60s (keyed by provider slugs + query + location) | Repeat searches for the same query/location become a single Redis GET instead of N provider calls + ranking computation |
| CSV provider | Parsed `curated_prices.csv` from disk on every single search | In-memory cache keyed by file mtime; re-parses only when the file actually changes | O(1) after first load instead of O(file size) per request |
| Bill upload (OCR) | OCR (Tesseract, CPU-bound, can take seconds for larger images) ran synchronously inside the request handler, on the same event loop serving every other concurrent request | `/bills/upload` unchanged (still synchronous, for callers that want an immediate result on small bills); `/bills/upload-async` hands the same pipeline to an arq worker process and returns 202 immediately | Large/slow OCR jobs no longer compete with concurrent API requests for the single event loop; throughput of the API process under bill-upload load is decoupled from OCR cost |
| Product name/brand search | `ILIKE '%query%'` with no supporting index — necessarily a sequential scan on `products` regardless of table size | `ILIKE` left as-is for correctness (substring matches `%term%` can't use a plain B-tree), but `pg_trgm` + GIN indexes on `name`/`brand` let Postgres use the index for both `ILIKE` and similarity search | Search stays fast as `products` grows past the point a sequential scan is viable; also opens a path to full-text/similarity ranking without another migration |

Caching is deliberately short-TTL (60s) and fails open (`app/core/cache.py`
never raises — a Redis outage degrades to "slower," not "down," matching
the existing `ProviderStatus`-never-raises convention used everywhere
else in this codebase).

## 4. Technical debt reduction summary

Addressed in this PR:

- **Single global event loop blocking on provider I/O** — was the #1 risk
  identified in the founder review (a single slow/hung BigBasket request
  would have stalled every concurrent user's search). Now async end-to-end.
- **No caching layer at all** — every search re-did full provider fan-out
  and recommendation ranking. Redis caching now in place for the
  highest-traffic path (plain search); intentionally *not* applied to the
  bill-upload path, since a bill's own price makes that result
  caller-specific and unsafe to share.
- **No schema path for multi-location pricing** — `location_key` exists
  now on `ProductListing`/`NormalizedListing`/the API layer, even though no
  current provider uses it. Adding a location-aware provider later is a
  data change, not a schema migration.
- **No ownership model** — `User`, and nullable ownership FKs on
  `BillUpload`/`Basket`, exist now so bill uploads/baskets don't need a
  retrofit migration once an auth flow exists. Still anonymous-by-default
  (no auth in this PR — out of scope).
- **OCR on the request thread** — `bills/upload-async` + the arq worker
  give a real (not theoretical) path to move expensive OCR off the
  request/response cycle; `bills/upload` is kept as-is for callers that
  want a synchronous result on small bills.
- **Unindexed substring search** — `pg_trgm` GIN indexes added; `ILIKE`
  itself is left in place (it's still the correct operator for `%term%`
  matching) but now has index support, and the same indexes are a
  prerequisite for a later move to Postgres full-text search
  (`tsvector`/`to_tsquery`) or a dedicated search engine if/when ranking
  quality (not just speed) becomes the bottleneck.
- **No migration tooling at all** — Alembic existed in `requirements.txt`
  unused since the initial scaffold; it's now actually wired up, so future
  schema changes don't depend on `create_all` against a fresh database.

Explicitly **not** done in this PR (flagged, not actioned, to keep scope to
infrastructure rather than new product surface):

- No auth/login flow — `User.id` exists as an attachment point only.
- No location-aware *provider* — only the schema/API plumbing exists.
- No full-text search migration — trigram indexing is the stepping stone;
  switching `ILIKE` to `tsvector` ranking is a follow-up once relevance
  (not just speed) becomes the problem.
- No persistence for the *synchronous* `/bills/upload` path — only the
  async path writes `Basket`/`BasketItem`/`BasketRecommendation` rows.
  Bringing the sync path to parity (or retiring it in favor of the async
  one) is a follow-up decision, not made here.
