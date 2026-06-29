# Component Library

Shared widgets in `lib/core/widgets/` and `lib/shared_flows/`. Each entry:
purpose, key props, used by.

## Navigation & shell

- `AppBottomNav` — 5-tab bar (Home/Discover/Wishlist/Social/Profile).
- `CategoryAppBar` — brand-themed app bar with back, title, share, search
  icons; accepts `brandColor` override.
- `SavingsTicker` — persistent small counter widget showing running ₹
  saved, tappable to open full stats.

## Browse & discovery

- `CategoryGridCard` — large icon + label tile for Home dashboard grid.
- `BrandPickerCard` — brand logo + tagline card for Category Home.
- `ListingCard` — image, title, rating, price, wishlist-heart toggle;
  variants for restaurant/product/hotel/movie/service.
- `FilterSheet` — bottom sheet with chips/sliders, generic across
  categories, configured via a `FilterSchema` passed per category.
- `SearchBar` — text + mic icon + AI-sparkle icon, opens respective
  search mode.
- `ReviewTile` — avatar, rating stars, text, photo strip.

## Cart & checkout

- `CartLineItem` — quantity stepper, options summary, remove action.
- `CouponInputField` — code entry + "Apply" with always-success fake
  validation and celebratory micro-animation.
- `FakePaymentMethodPicker` — UPI-style / Card-style / COD-style radio
  cards; explicitly labeled "Simulated — no real payment" in fine print.
- `CheckoutSummaryBar` — sticky bottom bar with total + CTA, shared across
  all category checkouts.

## Tracking & completion

- `TrackingStageRail` — horizontal stage-dot progress indicator
  (Packed → Out for delivery → Delivered, or category-specific labels).
- `MapPinTracker` — abstracted "moving pin" widget (no real maps SDK
  required — stylized path animation) for delivery/cab/technician
  tracking.
- `BoardingPassCard` / `MovieTicketCard` / `ServiceJobCard` — category-
  specific completion artifacts, all built on a shared `TicketCardBase`
  layout (QR placeholder, original styling).
- `CompletionAnimation` — Lottie/Rive celebratory burst, original asset.

## Savings & gamification

- `SavingsSummaryCard` — "You saved ₹X" hero card with breakdown
  (money/calories/carbon) and share button.
- `StreakBadge` — flame-style streak counter, original icon.
- `AchievementToast` — slide-in unlock notification.
- `StatRing` — circular progress used on Profile for category-exploration
  coverage, streak, etc.

## Social

- `DreamCartPreviewCard` — compact shareable card render of a wishlist/
  moodboard for export-as-image.
- `ChallengeCard` — challenge title, budget cap, time remaining, CTA.
- `LeaderboardRow` — rank, avatar, name, score.
- `FollowButton` — follow/unfollow toggle with optimistic state.

## Configurators (Cars / Electronics / Real Estate interiors)

- `OptionSwatchSelector` — colour/variant chip selector.
- `ConfiguratorSummaryPanel` — running price + selected options, sticky.
- `EmiCalculatorWidget` — tenure slider → monthly estimate (illustrative
  math only, clearly labeled non-binding).

All components are theme-aware (consume `BrandColorScheme` via
`InheritedWidget`/Riverpod) so the same widget renders correctly under any
fictional brand's accent without per-brand code forks.
