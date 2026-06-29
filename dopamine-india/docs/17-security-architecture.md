# Security Architecture

## Authentication & authorization

- Supabase Auth for identity (Google/Apple OAuth, email/password, mobile
  OTP). App backend never stores raw passwords.
- JWT validated on every request (signature + expiry + audience claim);
  short-lived access tokens, refresh handled by Supabase client SDK.
- Role claims (`user`/`content_editor`/`admin`) checked server-side per
  route — admin routes live on a separate router with a dedicated
  dependency, never reachable via the consumer-app audience token.
- Session revocation: Redis denylist of revoked token IDs, checked on
  auth middleware (supports immediate logout-everywhere).

## API security

- Rate limiting (Redis token bucket) per-user and per-IP on auth, search,
  and AI endpoints — these are the most abuse-prone (credential stuffing,
  scraping, LLM-cost abuse).
- Idempotency keys required on checkout/entry-creation endpoints to
  prevent duplicate-order race conditions from client retries.
- Input validation via Pydantic schemas on every endpoint; reject unknown
  fields (`extra="forbid"`) to avoid mass-assignment-style bugs.
- Parameterized queries only (SQLAlchemy ORM/Core) — no raw string-
  interpolated SQL, eliminating SQL injection risk by construction.
- CORS locked to known app origins (mobile app via custom scheme/no CORS
  needed; admin dashboard origin allow-listed explicitly).

## Data protection

- PII minimization: phone/email stored, never logged in plaintext in
  application logs; structured logs scrub known PII fields.
- Encryption in transit (TLS everywhere, including Redis/Postgres
  connections in production). Encryption at rest via managed DB/Redis
  provider defaults.
- No real payment data ever collected — eliminates PCI-DSS scope entirely
  by design (fake payment picker never transmits card-like data anywhere,
  not even to the backend; it's purely a UI state).
- Account deletion endpoint performs a real, verifiable hard-delete of
  PII (name/email/phone) and anonymizes historical `orders`/
  `analytics_events` rows rather than cascading-deleting aggregate stats
  needed for product analytics.

## Application security

- Dependency scanning (Dependabot or equivalent) on both backend and
  mobile dependency graphs.
- Secrets via environment/secret manager, never committed — `.env.example`
  only in repo.
- CSRF not applicable to token-based mobile API; admin dashboard (if
  cookie-session based) gets standard CSRF tokens.
- XSS: admin dashboard sanitizes/escapes all user-generated content
  (review text, challenge descriptions) on render; mobile app renders
  text via Flutter widgets (no raw HTML execution surface).

## Abuse-specific to this product

- Fake-checkout endpoints are unauthenticated-write-adjacent risk (no
  real money, but still a DoS/spam vector) — rate-limited per user and
  capped at a sane max orders/hour to prevent automated stat-farming/
  leaderboard abuse.
- Achievement/streak unlock logic runs server-side only (never trust
  client-reported streak state) to prevent client-side tampering.

## Incident response

- Structured logging + alerting on auth failure spikes, rate-limit
  trigger spikes, and abnormal admin-route access patterns.
- Documented runbook for: credential leak, mass account-creation abuse,
  data-deletion request SLA (must complete within statutory window for
  applicable privacy law).
