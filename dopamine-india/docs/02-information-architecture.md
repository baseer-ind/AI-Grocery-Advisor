# Information Architecture

```
App Root
├── Auth Stack
│   ├── Splash
│   ├── Login (Google / Apple / Mobile OTP / Email)
│   └── Onboarding
│       ├── Name / City / State / Language
│       ├── Interests (multi-select category chips)
│       └── Legal disclaimer acceptance
│
├── Main Shell (bottom nav)
│   ├── Home Dashboard
│   │   ├── Category grid (Food, Shopping, Travel, Hotels, Movies,
│   │   │   Gaming, Vehicles, Real Estate, Beauty, Electronics,
│   │   │   Healthcare, Books, Music, Jewellery, Services, Grocery,
│   │   │   Fashion, Kids, Pets, Gifts, ...)
│   │   ├── Trending strip
│   │   ├── Continue browsing (recently viewed)
│   │   └── Savings ticker ("₹X saved this week")
│   │
│   ├── Discover (search hub)
│   │   ├── Text search
│   │   ├── AI search (NL query → cross-category results)
│   │   └── Voice search
│   │
│   ├── Wishlist / Moodboards
│   │   ├── Dream Wishlist (cross-category)
│   │   ├── Moodboards (Dream Room, Dream Office, Dream Wardrobe...)
│   │   └── Shared/collaborative boards
│   │
│   ├── Social
│   │   ├── Public profile
│   │   ├── Friends feed
│   │   ├── Challenges (Luxury / Budget / Room Setup / Wedding /
│   │   │   Vacation / Dream Kitchen / Dream Office)
│   │   └── Shared dream carts
│   │
│   └── Profile
│       ├── Stats (money/calories/carbon saved, streaks, orders avoided)
│       ├── Achievements
│       ├── Order/booking history (simulated)
│       └── Settings (language, notifications, legal, account)
│
└── Category Experience Stack (pushed from Home/Discover)
    ├── Category Home (brand picker, e.g. Food → Zwigato/Swaggie/...)
    ├── Listing / Browse (search, filters, sort)
    ├── Detail (product/restaurant/hotel/listing detail)
    ├── Configurator (where relevant: car, electronics setup, interiors)
    ├── Cart / Builder
    ├── Checkout (fake payment selection)
    ├── Tracking / Status (order tracking, boarding pass, ticket, technician
    │   ETA — category-specific)
    ├── Completion animation (delivered / boarded / ticket issued / job
    │   done)
    └── Savings Summary ("You saved ₹X by not ordering")
```

## Navigation model

- Bottom tab bar: Home · Discover · Wishlist · Social · Profile.
- Each category opens as a full-screen stack pushed on top of the shell
  (not a tab) so users can go arbitrarily deep (e.g. Food → Zwigato →
  Restaurant → Menu → Cart → Checkout) and back-swipe out cleanly.
- Cross-category global elements: search (always reachable via top app
  bar), wishlist FAB on any detail screen, savings ticker persists in
  Home app bar.
