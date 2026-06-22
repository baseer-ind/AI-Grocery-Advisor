# Data Acquisition Strategy

This document evaluates how AI Grocery Advisor can obtain product and pricing
data from the six platforms in the spec, and makes a recommendation before
any further engineering investment goes into live data integration.

**Bottom line up front:** none of these six platforms offer a public API for
product/price data. Getting live prices means either (a) scraping apps/sites
that actively detect and block automated access — which is a ToS violation
for all six and a legal grey area beyond that — or (b) going through
affiliate/partner channels, which give monetizable links but not the
structured price data the recommendation engine needs. There is no
no-risk technical shortcut here. This is a business decision, not just an
engineering one, and it should be made deliberately before more code is
written against any of these platforms.

## Per-platform findings

### Blinkit
- **Public API**: None.
- **Unofficial API**: The app's internal endpoints have been reverse-engineered
  by third parties (e.g. a published writeup on scraping dark-store/geofence
  data — see sources). No stable, documented unofficial API exists; anything
  found is a reverse-engineered snapshot that breaks when Blinkit changes its
  app.
- **Scraping feasibility**: Technically possible against the public website,
  but the documented approach required defeating rate limiting (HTTP 429s)
  and TLS/JA3 fingerprinting (using tools like `curl_cffi` to impersonate a
  real browser's TLS handshake) — i.e., active anti-bot evasion, not passive
  scraping.
- **Anti-bot protections**: Rate limiting, TLS fingerprinting, almost
  certainly device/session binding on the app. High sophistication.
- **Location-based pricing**: Prices and availability are dark-store-specific;
  any integration needs a lat/long or pincode per request, and dark store
  coverage itself isn't public information (it had to be reverse-engineered).
- **Maintenance complexity**: High — no contract, breaks on any app/API
  change, anti-bot countermeasures evolve.

### Zepto
- **Public API**: None. (Public "Zepto API" documentation that surfaces in
  search results belongs to an unrelated Australian payments company, Zepto
  Payments — not the Indian grocery app. Worth flagging since it's an easy
  mix-up.)
- **Unofficial API**: Same dark-store reverse-engineering effort referenced
  above covers Zepto alongside Blinkit and Swiggy Instamart.
- **Scraping feasibility / anti-bot**: Same class of problem as Blinkit —
  fingerprinting and rate limiting were both encountered and had to be
  worked around in the published research.
- **Location-based pricing**: Same dark-store-per-location model as Blinkit.
- **Maintenance complexity**: High, same reasons as Blinkit.

### Swiggy Instamart
- **Public API**: None for Instamart specifically. Swiggy does have public
  APIs for its restaurant/delivery partner ecosystem, but nothing covering
  Instamart grocery pricing for third parties.
- **Unofficial API**: Covered by the same reverse-engineering research as
  Blinkit/Zepto.
- **Scraping feasibility / anti-bot**: Same class of problem.
- **Location-based pricing**: Same dark-store model.
- **Maintenance complexity**: High.

### BigBasket
- **Public API**: None for general product/price data.
- **Affiliate program**: BigBasket runs a conventional CPS (cost-per-sale)
  affiliate program (via networks like INRDeals, Cuelinks, EarnKaro — up to
  ~7% commission) and has a partner portal ("BB Sambandh" at
  nucleus.bigbasket.com). Affiliate programs give you trackable outbound
  links and commission on conversions — they do **not** give structured,
  queryable price/catalog data for a recommendation engine.
- **Scraping feasibility**: BigBasket has a desktop website with
  server-rendered search results (lower technical bar than the app-only
  platforms), but third-party "scraping API" vendors (RealDataAPI,
  FoodDataScrape, ProductDataScrape, etc.) selling BigBasket/Blinkit/Zepto
  data exist specifically because this isn't an authorized data source —
  their existence is itself evidence the underlying access is unsanctioned.
- **Anti-bot protections**: Lower-profile than the app-only platforms but
  not zero; not independently verified here.
- **Maintenance complexity**: Medium — website scraping breaks less often
  than app reverse-engineering, but still no contract or SLA.

### Amazon Fresh
- **Public API**: Amazon's Product Advertising API (PA-API 5.0) exists and
  has an India locale, but (a) it's being deprecated in favor of a new
  "Creators API" as of mid-2026, (b) it's designed for affiliate content
  (product data for links you publish), with rate limits tied to your
  affiliate sales volume, not for building a price-comparison product, and
  (c) it's unclear it covers Amazon Fresh's grocery-specific pricing/delivery
  fee structure distinctly from general Amazon.in retail.
- **Unofficial API / scraping**: Amazon is one of the most heavily
  bot-defended e-commerce sites in the world; scraping it at any reliable
  scale is a well-known hard problem independent of this project.
  **Not recommended.**
- **Maintenance complexity**: High if scraped; the PA-API path is more
  stable but likely insufficient for this use case and is being replaced.

### JioMart
- **Public API**: None.
- **Affiliate program**: Yes — JioMart runs an affiliate program (via
  INRDeals etc., up to ~₹150/sale or 10–15% commission depending on
  category), same caveat as BigBasket: affiliate links and commissions, not
  structured price data.
- **Scraping feasibility**: Third-party data vendors (Apify has a published
  "JioMart Grocery Scraper", FoodDataScrape sells a JioMart dataset) confirm
  this is being done today by data-as-a-service companies — again, the
  existence of a market for "someone else does this for you" is a signal
  that doing it yourself carries the same ToS exposure they're pricing into
  their product.
- **Maintenance complexity**: Medium-high.

## Cross-cutting observations

- **No platform offers what we actually need**: structured, queryable,
  location-aware price/catalog data with a sanctioned API contract. The
  closest thing on the market is third-party scraping-as-a-service vendors
  (RealDataAPI, FoodDataScrape, ProductDataScrape, Actowiz, Apify actors) —
  which is just outsourcing the same ToS exposure to someone else, not
  eliminating it.
- **Anti-bot sophistication is real and documented**, not hypothetical: the
  one detailed first-hand account found (Blinkit/Zepto/Instamart dark-store
  reverse-engineering) explicitly describes defeating rate limiting and TLS
  fingerprinting to get the data. Building and operating that kind of
  evasion is itself the activity creating legal/ToS risk — it's not a
  side effect of "scraping," it *is* the scraping.
- **Location-based pricing compounds the problem**: these are dark-store
  / hyperlocal pricing models. Even a successful integration needs
  per-pincode or per-lat/long requests, multiplying request volume and
  anti-bot exposure relative to a simple "get this product's price" call.
- **Affiliate programs are real and usable today** but solve a different
  problem (monetization via outbound links) than the one this document is
  about (sourcing comparable price data).

## Recommendation

**Do not build a scraper against any of these platforms' live, production
systems without a deliberate legal review first.** All six either have no
public API or explicitly limit one (affiliate) to outbound-link use cases.
Scraping in a way that defeats rate-limiting or fingerprinting — which the
one documented real-world attempt needed to do — is materially different
from "reading a public webpage" and outside what I'd build without your
explicit sign-off, given the ToS exposure and the unsettled legal terrain
around automated access in this space.

**Recommended path, in order:**

1. **Affiliate integration first** — wire up BigBasket's and JioMart's
   affiliate programs now. This is zero legal ambiguity, monetizes the
   existing "Buy →" links immediately, and was already on the roadmap
   (`ARCHITECTURE.md` Future Recommendations #5) as a revenue feature — it
   just turns out to also be the lowest-risk place to start.
2. **Manual/semi-automated price curation for an MVP** — for a small,
   curated product catalog (50–200 high-frequency SKUs: atta, rice, oil,
   milk, common staples), have a person check prices daily/weekly across
   platforms and enter them, exactly like the seed data already in this
   repo, just kept fresh by a human instead of invented. This is slow and
   doesn't scale, but it's legally clean, ships a real (if narrow) product,
   and validates whether users actually act on the recommendations before
   any further investment.
3. **Evaluate licensed data providers** — companies like Actowiz, RealDataAPI,
   FoodDataScrape sell exactly this data as a service. Buying data from a
   vendor who has already taken on that legal exposure (and presumably has
   their own risk assessment/insurance/legal basis) is a different risk
   profile than doing it in-house, and worth pricing out before deciding to
   build vs. buy.
4. **Direct partnership conversations** — reaching out to BigBasket/JioMart
   (who already run affiliate/partner programs and clearly work with
   external parties) about a data-sharing or comparison-listing partnership
   is worth pursuing in parallel; quick-commerce players are less likely to
   partner given they compete on price opacity, but it costs nothing to ask.
5. **Scraping the quick-commerce apps (Blinkit/Zepto/Instamart) is the
   path of last resort**, given the documented anti-bot sophistication and
   that it requires active evasion techniques to function at all. If this
   is ever pursued, it should go through actual legal counsel first, not an
   engineering decision made in a PR.

## What this PR does NOT include

Per the above, this PR does not contain a live scraper or live API
integration against any of the six platforms. Building one wasn't
something I was prepared to do without your explicit go-ahead, given the
ToS and anti-bot-evasion concerns documented above.

Instead, this PR demonstrates the **integration pattern** end-to-end —
Product Search → Price Data → Recommendation Engine — using a
**pluggable data source adapter** so that whichever sourcing strategy you
choose (affiliate feed, licensed data vendor, manual curation, or — if you
decide the risk is acceptable after legal review — direct scraping) can be
dropped in behind the same interface without touching the search service or
recommendation engine at all. See "Proof of Concept" below.
