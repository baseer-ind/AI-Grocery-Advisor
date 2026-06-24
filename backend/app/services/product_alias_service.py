"""The product-intelligence learning system: matches a raw OCR'd product
string to a canonical `Product`, scores confidence, and — critically —
records every match and every user correction permanently in
`product_aliases`. That table is the data moat this module exists to grow:
every bill processed makes the next bill's matching cheaper and more
accurate, with zero AI cost.

Confidence tiers (per product requirements):
    >= AUTO_MATCH_THRESHOLD (0.95)    -> auto-map, no user action needed
    SUGGEST_THRESHOLD..AUTO (0.70-0.95) -> show top 3 suggestions
    < SUGGEST_THRESHOLD (0.70)        -> require user confirmation / manual search
"""

from dataclasses import dataclass

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Product, ProductAlias

AUTO_MATCH_THRESHOLD = 0.95
SUGGEST_THRESHOLD = 0.70
_MAX_SUGGESTIONS = 3
# Confidence assigned to a fuzzy alias-table hit before scaling by similarity.
_ALIAS_BASE_CONFIDENCE = 1.0
# Fuzzy matches against the raw product catalog (no alias history yet) are
# capped below auto-match — a first-time guess should never silently
# auto-apply, only a *learned* alias should.
_CATALOG_FUZZY_CAP = 0.90


@dataclass
class MatchCandidate:
    product_id: int
    product_name: str
    confidence: float
    source: str  # 'alias' | 'catalog'


@dataclass
class MatchResult:
    tier: str  # 'auto' | 'suggest' | 'manual'
    best: MatchCandidate | None
    suggestions: list[MatchCandidate]


def _tier_for(confidence: float) -> str:
    if confidence >= AUTO_MATCH_THRESHOLD:
        return "auto"
    if confidence >= SUGGEST_THRESHOLD:
        return "suggest"
    return "manual"


async def match_product(session: AsyncSession, raw_text: str) -> MatchResult:
    """Never raises. An empty/unmatchable raw_text just yields tier='manual'
    with no candidates — the verification UI's "Not Sure" / manual search
    path, not a crash.
    """
    normalized = raw_text.strip().lower()
    if not normalized:
        return MatchResult(tier="manual", best=None, suggestions=[])

    candidates: dict[int, MatchCandidate] = {}

    alias_rows = (await session.execute(select(ProductAlias))).scalars().all()
    for alias in alias_rows:
        similarity = fuzz.WRatio(normalized, alias.raw_text.strip().lower()) / 100.0
        if similarity < 0.5:
            continue
        confidence = min(_ALIAS_BASE_CONFIDENCE, similarity * float(alias.confidence_score))
        if alias.user_confirmed and similarity > 0.97:
            confidence = max(confidence, 0.96)  # an exact hit on a user-confirmed alias is as good as it gets
        existing = candidates.get(alias.canonical_product_id)
        if existing is None or confidence > existing.confidence:
            candidates[alias.canonical_product_id] = MatchCandidate(
                product_id=alias.canonical_product_id,
                product_name="",  # filled in below once we know which products to load
                confidence=confidence,
                source="alias",
            )

    product_rows = (await session.execute(select(Product))).scalars().all()
    for product in product_rows:
        target = f"{product.brand} {product.name}".strip().lower()
        similarity = max(
            fuzz.WRatio(normalized, target) / 100.0,
            fuzz.WRatio(normalized, product.name.strip().lower()) / 100.0,
        )
        if similarity < 0.5:
            continue
        confidence = min(_CATALOG_FUZZY_CAP, similarity)
        existing = candidates.get(product.id)
        if existing is None or confidence > existing.confidence:
            candidates[product.id] = MatchCandidate(
                product_id=product.id,
                product_name=product.name,
                confidence=confidence,
                source="catalog" if existing is None else existing.source,
            )
        elif existing is not None and not existing.product_name:
            existing.product_name = product.name

    # Backfill product names for alias-sourced candidates that never got a
    # direct catalog hit in the loop above.
    missing_name_ids = [c.product_id for c in candidates.values() if not c.product_name]
    if missing_name_ids:
        name_rows = (
            await session.execute(select(Product).where(Product.id.in_(missing_name_ids)))
        ).scalars().all()
        names_by_id = {p.id: p.name for p in name_rows}
        for candidate in candidates.values():
            if not candidate.product_name:
                candidate.product_name = names_by_id.get(candidate.product_id, "Unknown product")

    ranked = sorted(candidates.values(), key=lambda c: c.confidence, reverse=True)[:_MAX_SUGGESTIONS]
    best = ranked[0] if ranked else None
    tier = _tier_for(best.confidence) if best else "manual"
    return MatchResult(tier=tier, best=best, suggestions=ranked)


async def record_correction(
    session: AsyncSession,
    raw_text: str,
    product_id: int | None,
    source_bill_id: int | None,
    user_confirmed: bool = True,
) -> None:
    """Permanently records a user's confirmation/edit as a learned alias.
    `product_id=None` (the "Not Sure" / rejected case) records nothing —
    there is nothing correct to learn from a non-match.
    """
    normalized = raw_text.strip()
    if not normalized or product_id is None:
        return

    existing = (
        await session.execute(
            select(ProductAlias).where(
                ProductAlias.raw_text == normalized,
                ProductAlias.canonical_product_id == product_id,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        existing.times_seen += 1
        existing.user_confirmed = existing.user_confirmed or user_confirmed
        existing.confidence_score = min(1.0, float(existing.confidence_score) + 0.05)
        return

    session.add(
        ProductAlias(
            raw_text=normalized,
            canonical_product_id=product_id,
            confidence_score=0.9 if user_confirmed else 0.6,
            source_bill_id=source_bill_id,
            user_confirmed=user_confirmed,
        )
    )
