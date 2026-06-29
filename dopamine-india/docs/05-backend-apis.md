# Backend APIs (FastAPI, REST, `/api/v1`)

Auth: Bearer JWT issued by Supabase Auth, validated on every authenticated
route. Public/anonymous browsing allowed for catalog read endpoints.

## Auth & profile

```
POST   /auth/session/exchange        # exchange Supabase token for app session
GET    /me                           # profile + settings
PATCH  /me                           # update name/city/state/language/interests
GET    /me/stats                     # savings/streak/achievement stats
DELETE /me                           # account deletion (store-policy requirement)
```

## Catalog

```
GET /categories
GET /categories/{slug}/brands
GET /brands/{slug}
GET /listings?category=&brand=&q=&filters=&sort=&page=
GET /listings/{id}
GET /listings/{id}/reviews
POST /search                         # text search across categories
POST /search/voice                   # audio -> transcript -> search
POST /search/ai                      # NL query -> curated cross-category result set
```

## Wishlist / moodboards

```
GET/POST          /wishlists
GET/PATCH/DELETE  /wishlists/{id}
POST/DELETE       /wishlists/{id}/items
GET/POST          /moodboards
GET/PATCH/DELETE  /moodboards/{id}
POST/DELETE       /moodboards/{id}/items
POST              /ai/generate-moodboard   # theme + budget -> suggested items
```

## Cart & checkout (simulation core)

```
GET/POST    /carts/{category}            # get-or-create open cart for category
POST/DELETE /carts/{id}/items
POST        /carts/{id}/apply-offer
POST        /carts/{id}/checkout         # -> creates order, always "succeeds"
GET         /orders/{id}                 # includes tracking_stage
POST        /orders/{id}/advance         # dev/testing: force-advance tracking stage
GET         /orders/{id}/savings-summary # money/calories/carbon saved breakdown
GET         /orders                      # history, paginated
```

## Social

```
GET/POST    /follows
GET         /users/{id}/public-profile
GET         /challenges
GET         /challenges/{id}
POST        /challenges/{id}/entries
GET         /challenges/{id}/leaderboard
POST        /wishlists/{id}/share        # -> shareable link/image
```

## Achievements & analytics

```
GET  /achievements
GET  /me/achievements
POST /events                              # client-side analytics event ingest (batched)
```

## Admin (separate router, role-gated)

```
CRUD /admin/categories
CRUD /admin/brands
CRUD /admin/listings
CRUD /admin/offers
CRUD /admin/challenges
GET  /admin/analytics/overview
GET  /admin/analytics/funnels
GET  /admin/users (search/filter, no PII export beyond support need)
```

## Conventions

- All money fields transmitted as integer paise; client formats as ₹.
- Pagination: `page`/`page_size`, response envelope `{ data, meta }`.
- Idempotency-Key header required on `/checkout` and `/entries` to avoid
  duplicate simulated orders on retry.
- Background jobs (arq/Redis) for: AI moodboard generation, leaderboard
  recomputation, achievement unlock evaluation after each order.
