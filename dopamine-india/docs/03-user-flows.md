# Core User Flows

## 1. First-run flow

Splash → Login (pick provider) → Onboarding (name, city, state, language,
interests) → Legal disclaimer (must accept to continue) → Home Dashboard
(category grid pre-sorted by selected interests).

## 2. Generic simulated-commerce flow (applies to Food/Shopping/Grocery/
Beauty/Electronics)

1. Home → tap category → Category Home (pick fictional brand/style).
2. Browse listing → filter/sort → tap item → Detail screen (images,
   reviews, offers).
3. Add to cart (or wishlist).
4. Cart review → apply coupon (fictional, always "valid") → Checkout.
5. Fake payment method picker (UPI-style / card-style / COD-style — no
   real fields ever submitted, no real payment gateway involved).
6. "Processing payment" animation (2–3s) → Order confirmed.
7. Live fake tracking (map pin or progress bar moving through stages:
   Packed → Out for delivery → Arriving → Delivered) with a
   skip/fast-forward control.
8. Completion animation.
9. **Savings Summary**: "You saved ₹540 by not ordering" + running totals
   updated (money saved, calories saved if food, impulse-purchases-avoided
   counter +1).
10. CTA: Share savings / Add to Moodboard / Browse more / Back to Home.

## 3. Travel booking flow

Travel → mode (Flight/Train/Bus/Cab/Bike/Metro/Cruise/Holiday Package) →
search (origin/destination/date) → results list → select option → seat
map → meal/baggage/insurance add-ons → coupon → checkout (fake payment) →
boarding-pass-style animation → "Trip completed" animation (triggered
either instantly via "simulate trip" button or after a simulated
countdown) → Savings Summary.

## 4. Hotel flow

Hotels → style (Luxury/Budget/Hostel/Resort/Staycation) → search
(city/dates/guests) → results with map + reviews → room selection →
add-ons (breakfast, late checkout) → checkout → confirmation animation →
Savings Summary.

## 5. Movies flow

Movies → city → movie → theatre → showtime → seat map → snacks add-on →
checkout → ticket animation (QR-style mock ticket) → Savings Summary.

## 6. Services flow (Urban-Company style)

Services → category (Cleaning/AC/Electrician/...) → sub-service → slot
picker → technician profile (fictional) → checkout → "technician en
route" tracking (map pin moving) → "Service completed" animation →
Savings Summary.

## 7. Configurator flows (Cars / Real Estate / Electronics setup)

Category → base model/listing → configurator (colour, variant,
accessories, EMI calculator for cars; furniture/interior packages for real
estate; component picker for electronics) → "dream build" saved to
Moodboard → optional checkout flow identical to generic commerce flow →
Savings Summary reflects full configured price.

## 8. Social challenge flow

Social → Challenges → pick challenge (e.g. Luxury Challenge) → build a
dream cart within the challenge's category constraints → submit →
leaderboard/comparison view with friends → share card (image export, no
real purchase implied).

## 9. AI-assisted flow

Discover → AI Search ("plan my dream kitchen under ₹5L") → AI proposes a
cross-category moodboard/cart → user edits/accepts → flows into the
relevant category cart(s) → standard checkout flow per item or as a
bundle.
