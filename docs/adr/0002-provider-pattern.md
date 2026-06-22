# ADR-002: Provider Pattern

## Status
Accepted

## Context
Live grocery price data must come from multiple sources (curated CSV
seed data, a mock provider for tests/dev, and real platform adapters
like BigBasket), each with different latency, reliability, and data
shape characteristics. Platforms don't offer public APIs, so any given
provider may need to be swapped, retried, or removed independently of
the others.

## Decision
Define a `PriceProvider` interface (`services/providers/base.py`)
with a single async `fetch(query, location_key=None) -> ProviderResult`
contract returning a normalized `NormalizedListing` shape. Each
concrete provider (`CSVProvider`, `MockProvider`, `BigBasketProvider`)
implements only this interface. `provider_aggregator.py` fans out to
all configured providers concurrently via `asyncio.gather`, using
`ProviderStatus` to represent partial failure (a provider timing out
or erroring doesn't fail the whole search) — providers never raise out
of `fetch()`.

## Consequences
- New providers can be added by implementing the interface and
  registering an instance, without changing `provider_aggregator.py`.
- Partial-failure handling is uniform across providers, since it's
  enforced at the interface boundary, not per-provider.
- Known gap: `bill_processing_service.py` currently imports concrete
  provider classes directly instead of receiving them via a registry
  (see `docs/ARCHITECTURE_READINESS_REPORT.md`, Section 5) — flagged
  as a follow-up, not yet fixed, to keep this ADR scoped to the
  pattern itself rather than every call site.
