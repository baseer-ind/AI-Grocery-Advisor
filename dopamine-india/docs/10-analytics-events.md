# Analytics Event Taxonomy

Naming: `snake_case`, `object_action` order. All events carry
`user_id?`, `session_id`, `category?`, `brand?`, `occurred_at`.

## Lifecycle

- `app_opened`
- `signup_completed` `{provider}`
- `onboarding_completed` `{interests[]}`
- `legal_disclaimer_accepted`
- `session_ended` `{duration_seconds}`

## Discovery

- `category_viewed` `{category}`
- `brand_viewed` `{category, brand}`
- `search_performed` `{mode: text|voice|ai, query}`
- `listing_viewed` `{listing_id}`
- `filter_applied` `{category, filters}`

## Wishlist / moodboard

- `wishlist_item_added` / `wishlist_item_removed`
- `moodboard_created` `{theme}`
- `ai_moodboard_generated` `{theme, budget_cap}`

## Commerce simulation funnel (the core funnel to watch)

- `cart_item_added` `{listing_id, quantity}`
- `cart_viewed`
- `coupon_applied` `{code}`
- `checkout_started`
- `fake_payment_selected` `{method}`
- `order_placed` `{order_id, total_price_paise}`
- `tracking_viewed` `{order_id, stage}`
- `order_completed` `{order_id}`
- `savings_summary_viewed` `{order_id, savings_paise}` — **key activation
  event**
- `savings_shared` `{order_id, channel}`

## Gamification & social

- `streak_incremented` `{streak_days}`
- `achievement_unlocked` `{achievement_slug}`
- `challenge_joined` / `challenge_entry_submitted`
- `dream_cart_shared` `{channel}`
- `user_followed`

## Funnels to build in the analytics dashboard

1. `category_viewed → cart_item_added → checkout_started → order_placed →
   savings_summary_viewed` (per category, drop-off at each step).
2. `signup_completed → onboarding_completed → category_viewed` (D0
   activation).
3. `order_completed → streak_incremented` (habit-loop reinforcement rate).

## Implementation notes

- Client batches events (max 20 or 10s flush) to `POST /events`.
- Server stamps `occurred_at` server-side if absent/clock-skewed.
- PII minimization: no free-text search queries retained beyond 30 days
  in raw form; aggregate before that.
