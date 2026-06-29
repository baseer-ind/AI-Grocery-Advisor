# Flutter Folder Structure

Feature-first, modular architecture so each simulated category is an
independently buildable/testable module.

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app.dart                 # MaterialApp, theming, routing root
│   │   ├── router.dart              # go_router route table
│   │   └── bootstrap.dart           # DI setup, env config
│   │
│   ├── core/
│   │   ├── theme/                   # design tokens, ThemeData
│   │   ├── network/                 # Dio client, interceptors, error mapping
│   │   ├── storage/                 # secure storage, local cache
│   │   ├── analytics/               # event tracking client
│   │   ├── widgets/                 # shared dumb widgets (buttons, cards)
│   │   └── utils/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/                # repositories, DTOs
│   │   │   ├── domain/              # entities, use-cases
│   │   │   └── presentation/        # screens, view-models/cubits
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── discover/                # search, AI search, voice search
│   │   ├── wishlist/
│   │   ├── social/
│   │   ├── profile/
│   │   └── categories/
│   │       ├── food/
│   │       ├── shopping/
│   │       ├── grocery/
│   │       ├── travel/
│   │       ├── hotels/
│   │       ├── movies/
│   │       ├── beauty/
│   │       ├── electronics/
│   │       ├── cars/
│   │       ├── real_estate/
│   │       ├── services/
│   │       ├── fashion/
│   │       ├── kids/
│   │       ├── pets/
│   │       └── gifts/
│   │           ├── data/
│   │           ├── domain/
│   │           └── presentation/
│   │               ├── category_home_screen.dart
│   │               ├── listing_screen.dart
│   │               ├── detail_screen.dart
│   │               ├── cart_screen.dart
│   │               ├── checkout_screen.dart
│   │               ├── tracking_screen.dart
│   │               └── savings_summary_screen.dart
│   │
│   ├── shared_flows/                # cross-category reusable flow widgets
│   │   ├── checkout/                # generic checkout step widgets
│   │   ├── tracking/                # generic tracking animation widget
│   │   └── savings/                 # savings summary widget + calculators
│   │
│   └── l10n/                        # en, hi, + extensible
│
├── test/                            # mirrors lib/ structure
├── integration_test/
├── assets/
│   ├── icons/
│   ├── illustrations/
│   ├── animations/                  # Lottie/Rive files, original only
│   └── fonts/
└── pubspec.yaml
```

## State management

BLoC/Cubit per feature module; shared app-level state (auth session, user
stats) via a top-level `AppCubit` injected through `provider`/`riverpod`.
Each category's cart/checkout flow shares the `shared_flows` widgets but
keeps its own Cubit instance scoped to that category's navigator.

## Navigation

`go_router` with nested routes per category
(`/categories/food/zwigato/menu/123`), enabling deep-linking into any
screen of any simulated flow for shareable links and push notifications.
