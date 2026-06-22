# ADR-001: Domain Architecture

## Status
Accepted

## Context
The product spans multiple logical domains (Product, Pricing,
Recommendation, Bill Processing, User, and eventually Offers and
Analytics). We needed to decide how to organize these domains in code
while the codebase is still small, without over-engineering ahead of
actual need.

## Decision
Keep domains as separate modules/files within a flat `app/services/`
and `app/domain/` layout for now, enforced by convention (one
direction of imports, no domain reaching into another's internals)
rather than by package boundaries. Each domain exposes plain functions
and typed dataclasses/Pydantic models as its contract; no domain
imports another domain's ORM models or internal helpers directly.

A formal move to `app/domains/<name>/` packages with explicit
`__init__.py` contract surfaces is documented as a recommended
follow-up (see `docs/ARCHITECTURE_READINESS_REPORT.md`, Recommendation:
Partial Modularization) but deliberately not done yet, pending
approval.

## Consequences
- Low cost today: no premature package-boundary ceremony for a
  ~12-module codebase.
- Verified via dependency-graph audit (`docs/DEPENDENCY_MAP.md`) that
  the convention is actually being followed — zero circular
  dependencies, strict one-directional layering.
- Risk: convention-based boundaries can erode without packaging to
  enforce them; mitigated by treating the dependency map as a living
  document to re-check before merging future cross-domain PRs.
