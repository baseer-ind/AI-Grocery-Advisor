# Database Schema (PostgreSQL)

Conventions: `id UUID PK default gen_random_uuid()`, `created_at`/
`updated_at timestamptz default now()` on every table, soft-delete via
`deleted_at timestamptz null` where rows are user-facing history.

## Identity & profile

```sql
users (
  id, auth_provider text, auth_subject text, email text, phone text,
  name text, city text, state text, language text default 'en',
  interests text[], onboarded_at timestamptz, created_at, updated_at
)

user_settings (
  user_id PK/FK -> users, notifications_enabled bool default true,
  voice_search_enabled bool default true, theme text default 'system'
)

user_stats (
  user_id PK/FK -> users,
  money_saved_paise bigint default 0,
  calories_saved bigint default 0,
  carbon_saved_grams bigint default 0,
  orders_avoided int default 0,
  impulse_purchases_avoided int default 0,
  shopping_time_seconds bigint default 0,
  current_streak_days int default 0,
  longest_streak_days int default 0,
  categories_explored text[] default '{}'
)
```

## Catalog (fictional, admin-managed)

```sql
categories (id, slug, name, icon_key, sort_order, parent_id FK -> categories)

brands (
  id, category_id FK, name, slug, tagline, logo_asset_key,
  primary_color, secondary_color, style_tag text, -- e.g. 'fast-food',
  'luxury'
  is_active bool default true
)

listings ( -- products / restaurants / hotels / movies / services / vehicles
  id, brand_id FK, category_id FK, type text, -- 'product'|'menu_item'|
  'hotel_room'|'movie'|'service'|'vehicle_variant'|'flight'|...
  title, description, price_paise bigint, mrp_paise bigint,
  rating numeric(2,1), review_count int, images text[], attributes jsonb,
  -- attributes holds type-specific fields: seat_map, configurator options,
  -- calorie_estimate, location lat/lng, etc.
  is_active bool default true
)

reviews (id, listing_id FK, user_id FK, rating int, body text, photos text[])

offers (id, brand_id FK nullable, listing_id FK nullable, code text,
        description, discount_type text, discount_value numeric)
```

## Commerce simulation

```sql
carts (id, user_id FK, category_id FK, status text default 'open')
cart_items (id, cart_id FK, listing_id FK, quantity int, options jsonb,
            unit_price_paise bigint)

orders ( -- the simulated "purchase" record
  id, user_id FK, category_id FK, brand_id FK, status text,
  -- 'placed'|'tracking'|'completed'|'cancelled'
  total_price_paise bigint, savings_paise bigint, applied_offer_id FK null,
  fake_payment_method text, tracking_stage text, placed_at, completed_at
)
order_items (id, order_id FK, listing_id FK, quantity, unit_price_paise,
             options jsonb)
```

## Wishlist / moodboards / social

```sql
wishlists (id, user_id FK, name, type text default 'dream',
           is_public bool default false)
wishlist_items (id, wishlist_id FK, listing_id FK, note text)

moodboards (id, user_id FK, theme text, -- 'dream_room'|'dream_office'|...
            cover_image text, is_public bool default false)
moodboard_items (id, moodboard_id FK, listing_id FK, position jsonb)

follows (follower_id FK -> users, followee_id FK -> users, PK(follower_id,
         followee_id))

challenges (id, slug, title, description, category_id FK nullable,
            budget_cap_paise bigint nullable, starts_at, ends_at)
challenge_entries (id, challenge_id FK, user_id FK, wishlist_id FK,
                    score numeric, submitted_at)
```

## Achievements & analytics

```sql
achievements (id, slug, title, description, icon_key, criteria jsonb)
user_achievements (user_id FK, achievement_id FK, unlocked_at,
                    PK(user_id, achievement_id))

analytics_events (id, user_id FK nullable, session_id, event_name,
                   properties jsonb, occurred_at timestamptz)
-- high-volume, write-heavy; consider partitioning by month
```

## Indexing notes

- `listings`: GIN trgm index on `title`, btree on `(category_id, brand_id)`,
  GIN on `attributes` for configurator filtering.
- `analytics_events`: btree on `(event_name, occurred_at)`, monthly
  partitions, short retention in hot storage (archive to R2/cold storage
  after 90 days).
- `orders`: btree on `(user_id, status)` for profile/history queries.

## Redis usage

- Session cache (Supabase issues JWT; Redis holds short-lived denylist for
  revoked sessions).
- Hot-path caches: category/brand listing pages (TTL 60–300s), trending
  computations, AI search result cache keyed by normalized query.
- Rate limiting counters (per-user, per-IP) for auth and AI endpoints.
