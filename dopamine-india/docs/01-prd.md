# Product Requirements Document — Dopamine India

## 1. Problem

Indian consumers (especially urban, online-first, 18–35) experience constant
impulse-spending pressure from food delivery, e-commerce, and travel apps.
There is no safe outlet for the *dopamine hit* of "shopping" without the
financial consequence — and no tool that quantifies money saved by *not*
buying.

## 2. Vision

A single app that simulates the entire Indian consumer app ecosystem —
food, shopping, travel, hotels, movies, services, real estate, and more —
end-to-end (browse → cart → fake checkout → fake tracking → "delivered"),
then shows the user how much money, time, and impulse-control they
preserved by not actually transacting.

## 3. Non-goals

- No real payments, real inventory, real delivery, real booking, or any
  integration with real-world fulfillment.
- Not a price-comparison or deal-aggregation tool (that's the sibling
  `AI-Grocery-Advisor` product).
- Not a gambling or rewards-for-cash product — savings/streaks/badges have
  no monetary redemption value.

## 4. Target users

- Primary: 18–34, urban/semi-urban India, smartphone-first, prone to
  online window-shopping / cart-abandonment as a stress-relief habit.
- Secondary: people on a savings goal or no-spend challenge who want a
  judgment-free way to "shop" without spending.

## 5. Core value props

1. **Catharsis** — full sensory shopping experience (browse, cart, "buy")
   without spending a rupee.
2. **Quantified restraint** — every avoided purchase converts into a
   savings counter (₹ saved, calories "saved" on food orders, impulse
   purchases avoided).
3. **Social/gamified** — streaks, challenges, dream wishlists, shareable
   "dream carts" with friends.

## 6. Key user stories

- As a user, I can browse a fictional food-delivery experience, add items
  to cart, "pay," watch a delivery animation, and see "You saved ₹540 by
  not ordering" at the end.
- As a user, I can build a "Dream Room" or "Dream Wardrobe" moodboard
  across shopping categories without ever leaving the simulation.
- As a user, I can see my cumulative money/calories/carbon saved and
  longest no-spend streak on my profile.
- As a user, I can join a "Luxury Challenge" with friends and compare
  dream carts without spending real money.
- As an admin, I can manage the fictional product catalog, brands, and
  categories without touching app code.

## 7. Success metrics

- D1/D7/D30 retention (target: comparable to habit-loop apps, D7 ≥ 25%).
- Sessions/week per active user.
- "Savings screen" completion rate (% of simulated checkouts that reach
  the savings summary — the core value moment).
- Streak length distribution (proxy for habit formation).
- Challenge participation rate (social virality proxy).

## 8. Constraints

- Must never resemble a real brand closely enough to create
  trademark/trade-dress risk — see `legal-and-branding-safety.md`.
- Must be App Store / Play Store compliant with zero real-money flows.
- India-first: Hindi + English at minimum, INR-only formatting, IST
  scheduling for any time-based content (offers, "delivery" windows).

## 9. Out-of-scope risks explicitly accepted

- Users may try to use the app as a genuine product-discovery tool
  (acceptable side-effect, not a goal — catalog data is illustrative,
  not live pricing).
