# ADR-005: User Identity and Authentication

## Status
Accepted

## Context
The readiness report flagged "no auth/identity layer at all" as the
highest-leverage gap: it blocks Personalized Profiles, Price Alerts,
and any future Partner APIs, and is cheap to build now versus expensive
to retrofit once real user data exists. PR #4 had already added a
schema-only `User` model with nullable ownership FKs on
`BillUpload`/`Basket`, but no credentials, no sessions, and no service
layer. This PR builds the actual auth domain on top of that foundation,
per the explicit instruction to defer the Partial Modularization
refactor (Architecture Readiness Report, Section 8, Option B) until
after this milestone.

## Decision
- **Credentials**: email/password (bcrypt-hashed, `User.hashed_password`)
  and Google Sign-In (`User.google_sub`, verified via
  `google.oauth2.id_token.verify_oauth2_token`) are both optional and
  not mutually exclusive on a `User` row — a user may eventually link
  both to one account, so neither is enforced as required.
- **Sessions**: opaque, server-side tokens (`UserSession.token`, a
  random `secrets.token_urlsafe(48)` string) rather than self-describing
  JWTs. This lets logout revoke a session immediately by marking a DB
  row, instead of waiting out a token's expiry — the same DB-row-as-
  source-of-truth pattern `BillUpload.job_id` already uses for job
  tracking, rather than introducing a second pattern (signed/encoded
  tokens) into the codebase.
- **Preferences**: a separate `UserPreferences` table (one row per
  user, `cascade="all, delete-orphan"`), not extra columns on `User`.
  `grocery_preferences`/`cashback_preferences` are JSON columns — open-
  ended, user-editable data that doesn't need to be queried or joined
  on, the same reasoning already applied to
  `BasketRecommendation.recommendation_json`. `membership_tier` is a
  plain string column because it's a small, enumerable value other
  code may eventually filter/branch on (e.g. a membership discount in
  the recommendation engine).
- **Ownership**: `BillUpload.user_id`/`Basket.user_id` (already
  nullable FKs from PR #4) are now populated when a session is present,
  via a new `get_current_user_optional` dependency — anonymous bill
  upload still works, but gets associated with the uploader when
  authenticated. `routes_users.py` exposes bill/basket history by
  querying these FKs directly; no new history tables.
- **Service split**: `auth_service.py` (credentials, sessions, password
  reset) is kept separate from `user_service.py` (profile/preferences),
  so a future admin tool that only needs to edit a membership tier
  doesn't have to pull in password/session handling.
- **Future attachability**: price alerts, saved grocery lists, and
  shopping-habit tracking are all designed to attach as new tables with
  a `user_id` FK plus a `relationship()` back-reference on `User` —
  the same shape as `UserPreferences`/`UserSession` — needing no schema
  change to `User` itself.

## Consequences
- `User.hashed_password`/`google_sub` being both nullable means the
  application layer (not the schema) is responsible for ensuring a user
  ends up with at least one — `register_user`/`authenticate_with_google`
  enforce this at creation time.
- Opaque sessions mean every authenticated request does a DB lookup
  (`get_user_for_session_token`) rather than just verifying a signature
  — an acceptable cost at current scale, revisit only if session lookups
  become a measured bottleneck.
- `request_password_reset` always does the same DB work regardless of
  whether the email exists, but the *response* still differs in dev
  (token echoed) vs. prod (generic message only) — fully closing the
  account-enumeration gap (constant-time response shape) is deferred
  until real email-sending infrastructure exists to make the
  distinction meaningful.
- New dependency on `google-auth` (and its `requests` transitive
  dependency for the default transport) — the first non-`httpx` HTTP
  client in the codebase; acceptable since it's only used for Google's
  token-verification call, not general outbound HTTP.
- Synchronous `/bills/upload` still doesn't persist anything (pre-
  existing gap, unchanged by this PR), so ownership association only
  applies to the async upload path.
