# Admin Dashboard

Internal web app (separate from the consumer mobile app), role-gated
(`admin`, `content_editor`, `support`).

## Modules

1. **Catalog management** — CRUD for categories, brands (with palette
   contrast-checker built into the colour picker), listings, offers.
   Bulk-import via CSV/JSON for seeding listings.
2. **Brand safety review queue** — flags new brand names against a
   trademark-keyword blocklist before publish (see
   `legal-and-branding-safety.md`); requires second-reviewer approval.
3. **Challenges & social** — create/schedule challenges, set budget caps,
   moderate reported public profiles/wishlists.
4. **User support** — search users (minimal PII surface), view order/
   stats history for support tickets, manual stat correction (e.g. revert
   a mis-fired achievement), account deletion processing.
5. **Analytics overview** — funnels (browse → cart → checkout →
   completion → savings-screen), retention cohorts, category popularity,
   challenge participation — backed by `10-analytics-events.md` event
   taxonomy.
6. **Feature flags / config** — toggle categories on/off, control AI
   feature rollout %, manage savings-calculation parameters (e.g. average
   delivery fee assumptions per category used to compute "money saved").
7. **Content/asset manager** — upload original illustrations/animations
   to Cloudflare R2, manage CDN-served brand logos/icons.

## Access & audit

- All admin actions logged to an `admin_audit_log` table (actor, action,
  entity, before/after diff, timestamp).
- Admin auth via Supabase Auth with a separate `role` claim; no admin
  route reachable from the consumer JWT audience.
