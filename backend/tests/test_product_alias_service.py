"""Proves the confidence tiers and the learning loop: a never-seen product
must require user confirmation, a previously user-confirmed alias must
auto-map on a future bill, and every correction must permanently strengthen
the alias dictionary rather than being thrown away after one use.
"""

from sqlalchemy import select

from app.domain.models import Product, ProductAlias
from app.services.product_alias_service import (
    AUTO_MATCH_THRESHOLD,
    SUGGEST_THRESHOLD,
    match_product,
    record_correction,
)


async def _seed_product(session, name="Amul Butter", brand="Amul", category="Dairy") -> Product:
    product = Product(name=name, brand=brand, category=category, canonical_quantity=500, canonical_unit="g")
    session.add(product)
    await session.flush()
    return product


async def test_unknown_text_with_no_catalog_match_requires_manual_confirmation(db_session):
    result = await match_product(db_session, "ZXQVWK NONSENSE ITEM 99")
    assert result.tier == "manual"
    assert result.best is None


async def test_catalog_only_fuzzy_match_never_auto_maps(db_session):
    """A first-time guess against the raw catalog (no alias history) is
    capped below auto-match — only a *learned* alias should auto-apply.
    """
    await _seed_product(db_session)

    result = await match_product(db_session, "Amul Butter 500g")
    assert result.best is not None
    assert result.best.confidence < AUTO_MATCH_THRESHOLD
    assert result.tier in ("suggest", "manual")


async def test_user_confirmed_alias_auto_maps_on_future_bill(db_session):
    """The continuous-improvement loop: once a user has confirmed
    "AMUL BTR 500" -> Amul Butter, a *future* bill with the exact same raw
    OCR text should auto-map without asking again.
    """
    product = await _seed_product(db_session)

    await record_correction(db_session, raw_text="AMUL BTR 500", product_id=product.id, source_bill_id=None)
    await db_session.flush()

    result = await match_product(db_session, "AMUL BTR 500")
    assert result.tier == "auto"
    assert result.best.product_id == product.id
    assert result.best.confidence >= AUTO_MATCH_THRESHOLD


async def test_repeated_confirmation_strengthens_existing_alias_instead_of_duplicating(db_session):
    product = await _seed_product(db_session)

    await record_correction(db_session, raw_text="TOOR DAL 1KG", product_id=product.id, source_bill_id=1)
    await db_session.flush()
    first_alias = (
        await db_session.execute(select(ProductAlias))
    ).scalar_one()
    assert first_alias.times_seen == 1

    await record_correction(db_session, raw_text="TOOR DAL 1KG", product_id=product.id, source_bill_id=2)
    await db_session.flush()

    aliases = (await db_session.execute(select(ProductAlias))).scalars().all()
    assert len(aliases) == 1  # reinforced, not duplicated
    assert aliases[0].times_seen == 2


async def test_not_sure_action_records_nothing():
    """A 'Not Sure' rejection (product_id=None) has nothing correct to
    learn from — it must not create a row.
    """
    from unittest.mock import AsyncMock

    session = AsyncMock()
    await record_correction(session, raw_text="081340 KITCHEN KING E-500g", product_id=None, source_bill_id=1)
    session.add.assert_not_called()


async def test_suggestions_are_capped_at_three_and_sorted_by_confidence(db_session):
    for i in range(5):
        await _seed_product(db_session, name=f"Amul Butter Variant {i}")

    result = await match_product(db_session, "Amul Butter")
    assert len(result.suggestions) <= 3
    confidences = [c.confidence for c in result.suggestions]
    assert confidences == sorted(confidences, reverse=True)


async def test_confidence_tier_thresholds_are_consistent():
    assert SUGGEST_THRESHOLD < AUTO_MATCH_THRESHOLD
