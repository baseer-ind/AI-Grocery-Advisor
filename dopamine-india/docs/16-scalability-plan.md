# Scalability Plan

## Application tier

- FastAPI behind a load balancer, stateless containers (Docker), horizontal
  autoscaling on CPU/RPS. Kubernetes-ready manifests (Deployment, HPA,
  Service, Ingress) from day one even if MVP runs on a simpler PaaS.
- Async I/O throughout (matches the pattern already used in
  `AI-Grocery-Advisor/backend` — `asyncio.gather` fan-out, no blocking
  calls in request path).

## Data tier

- PostgreSQL: read replicas for catalog browse traffic once read QPS
  outgrows a single primary; `listings`/`brands`/`categories` are
  read-heavy and cache-friendly.
- `analytics_events` partitioned by month; archive to Cloudflare R2 (cold
  storage) past 90 days, query via a separate OLAP path (e.g. periodic
  export to a columnar store) rather than hitting Postgres for historical
  dashboards.
- Redis: cache catalog reads (60–300s TTL), session/rate-limit state.
  Cluster mode once single-node memory becomes a constraint.

## Media/assets

- All brand logos, illustrations, animations served from Cloudflare R2 +
  CDN — never re-generated per-request.

## Background work

- `arq` workers scaled independently from API pods; AI moodboard
  generation and leaderboard recomputation are the most expensive jobs —
  isolate them in their own worker pool so they don't starve lightweight
  jobs (achievement evaluation, event ingestion).

## Growth triggers (when to act, not premature optimization)

- API p95 latency > 300ms sustained → add read replica / cache layer
  before scaling pod count blindly.
- `analytics_events` table > 50M rows → confirm partitioning + archival
  is actually running, not just planned.
- AI search/moodboard request volume > worker throughput → add dedicated
  GPU/inference-optimized worker tier or move to a managed LLM API with
  higher rate limits.

## Multi-region

Not required pre-GA (India-only launch). Plan for a single India-region
deployment (e.g. ap-south-1 equivalent) with CDN edge caching for static
assets globally if the diaspora audience grows.
