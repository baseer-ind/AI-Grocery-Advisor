# ADR-004: Recommendation Engine

## Status
Accepted

## Context
The product's actual differentiator is turning a list of platform
listings into an actionable verdict ("buy here, here's why"), not just
showing a price table. This logic needs to be reusable across both
direct product search and bill-derived basket recommendations, and
needs to be trustworthy enough to unit-test without a database.

## Decision
Implement `recommendation_engine.py` as a pure function
(`build_recommendations(listings: list[ListingView]) -> RecommendationSet`)
with no I/O and no framework dependency. It takes `ListingView` value
objects (already pricing-resolved) rather than ORM rows, decoupling it
from both the database layer and the pricing engine's internals. It
produces five labeled recommendations — Best Overall (weighted score:
cost 40%, product rating 25%, delivery rating 20%, speed 15%),
Cheapest, Fastest, Highest Rated, Best Value (rating-per-rupee) — each
with a plain-English reason string.

Both `product_search_service.py` (live search) and
`bill_recommendation_service.py` (bill-derived basket items) call this
same function, rather than each having their own ranking logic.

## Consequences
- Fully unit-testable without a database
  (`tests/test_recommendation_engine.py`) — verified by the existing
  test suite, no DB fixture needed.
- Single source of truth for "what counts as the best option" — a
  future change to the scoring weights or to add a sixth
  recommendation type only needs to change this one file and its
  tests, not the search or bill-processing call sites.
- Decoupling via `ListingView` (rather than ORM models) is what
  currently keeps this engine free of any dependency on `domain.models`'s
  database-specific fields, beyond the two it actually needs
  (`Platform`, `ProductListing` are still imported for type
  references — flagged in the dependency map as a minor coupling that
  doesn't cross a domain boundary in practice, since both are read-only
  data shapes, not behavior).
