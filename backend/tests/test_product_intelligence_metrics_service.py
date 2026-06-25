from datetime import datetime, timedelta

from app.domain.models import BillUpload, Product, ProductAlias, ShoppingEvent, ShoppingEventItem
from app.services.product_intelligence_metrics_service import compute_product_intelligence_metrics


async def _seed_product(session) -> Product:
    product = Product(name="Amul Butter", brand="Amul", category="Dairy", canonical_quantity=500, canonical_unit="g")
    session.add(product)
    await session.flush()
    return product


async def test_metrics_are_zero_on_an_empty_database(db_session):
    metrics = await compute_product_intelligence_metrics(db_session)
    assert metrics.bills_processed == 0
    assert metrics.total_basket_items == 0
    assert metrics.alias_coverage_pct == 0.0
    assert metrics.auto_match_rate_pct == 0.0
    assert metrics.user_correction_rate_pct == 0.0


async def test_alias_coverage_and_auto_match_rate_reflect_matched_items(db_session):
    product = await _seed_product(db_session)
    bill = BillUpload(original_filename="x.jpg", content_type="image/jpeg", status="done")
    db_session.add(bill)
    await db_session.flush()
    basket = ShoppingEvent(bill_upload_id=bill.id, source="bill_upload")
    db_session.add(basket)
    await db_session.flush()

    db_session.add(
        ShoppingEventItem(
            basket_id=basket.id, product_name="Amul Butter", quantity=1, unit="unit", total_price=50,
            matched_product_id=product.id, match_tier="auto", review_status="auto_confirmed",
        )
    )
    db_session.add(
        ShoppingEventItem(
            basket_id=basket.id, product_name="Unknown Item", quantity=1, unit="unit", total_price=20,
            matched_product_id=None, match_tier="manual", review_status="pending_review",
        )
    )
    await db_session.flush()

    metrics = await compute_product_intelligence_metrics(db_session)
    assert metrics.bills_processed == 1
    assert metrics.total_basket_items == 2
    assert metrics.alias_coverage_pct == 50.0
    assert metrics.auto_match_rate_pct == 50.0


async def test_user_correction_rate_only_counts_reviewed_items(db_session):
    basket = ShoppingEvent(source="bill_upload")
    db_session.add(basket)
    await db_session.flush()

    db_session.add(
        ShoppingEventItem(
            basket_id=basket.id, product_name="A", quantity=1, unit="unit", total_price=10,
            match_tier="auto", review_status="auto_confirmed",
        )
    )
    db_session.add(
        ShoppingEventItem(
            basket_id=basket.id, product_name="B", quantity=1, unit="unit", total_price=10,
            match_tier="suggest", review_status="user_edited",
        )
    )
    await db_session.flush()

    metrics = await compute_product_intelligence_metrics(db_session)
    # Only the one reviewed item counts toward the denominator; the
    # auto-confirmed item never entered the review queue at all.
    assert metrics.user_correction_rate_pct == 100.0


async def test_new_aliases_last_7_days_excludes_older_aliases(db_session):
    product = await _seed_product(db_session)
    db_session.add(
        ProductAlias(
            raw_text="recent alias", canonical_product_id=product.id,
            created_at=datetime.utcnow() - timedelta(days=1),
        )
    )
    db_session.add(
        ProductAlias(
            raw_text="old alias", canonical_product_id=product.id,
            created_at=datetime.utcnow() - timedelta(days=30),
        )
    )
    await db_session.flush()

    metrics = await compute_product_intelligence_metrics(db_session)
    assert metrics.total_aliases == 2
    assert metrics.new_aliases_last_7_days == 1
