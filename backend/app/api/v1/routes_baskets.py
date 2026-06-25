"""Manual basket comparison: lets a user type/paste a grocery list directly
(no bill upload, no OCR) and run it through the same comparison/optimization
pipeline as bill-derived baskets. Comparison results are persisted only when
the caller is authenticated, the same anonymous-by-default pattern bill
upload already uses via `get_current_user_optional`.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user_optional
from app.db.session import get_session
from app.domain.models import BasketOptimization, BasketRecommendation, User
from app.domain.models import ShoppingEvent as BasketModel
from app.domain.models import ShoppingEventItem as BasketItemModel
from app.domain.schemas_baskets import BasketCompareRequest, BasketCompareResponse, BasketOptimizationOut
from app.services.basket_comparison_service import (
    basket_item_out,
    compare_basket,
    item_recommendations_to_out,
    optimization_to_out,
)
from app.services.basket_service import Basket, BasketItem
from app.services.providers.registry import build_price_providers
from app.services.shopping_event_intelligence_service import compute_shopping_event_intelligence

router = APIRouter(prefix="/api/v1/baskets", tags=["baskets"])


@router.post("/compare", response_model=BasketCompareResponse)
async def compare_manual_basket(
    body: BasketCompareRequest,
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session),
) -> BasketCompareResponse:
    if not body.items:
        raise HTTPException(status_code=400, detail="Basket must have at least one item")

    basket = Basket(items=[BasketItem(**item.model_dump()) for item in body.items])
    result = await compare_basket(build_price_providers(), basket, location_key=body.location_key)

    basket_id: int | None = None
    if user is not None:
        basket_row = BasketModel(
            user_id=user.id,
            household_id=user.household.id if user.household else None,
            source="manual",
            receipt_source="manual",
            purchase_method=body.purchase_method or "in_store",
            location_key=body.location_key,
            total_spend=sum(item.total_price for item in basket.items),
        )
        session.add(basket_row)
        await session.flush()

        basket_item_rows: list[BasketItemModel] = []
        for item, item_rec_out in zip(basket.items, item_recommendations_to_out(result.item_recommendations)):
            basket_item_row = BasketItemModel(
                basket_id=basket_row.id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit=item.unit,
                total_price=item.total_price,
            )
            session.add(basket_item_row)
            await session.flush()
            basket_item_rows.append(basket_item_row)
            session.add(
                BasketRecommendation(
                    basket_item_id=basket_item_row.id,
                    recommendation_json=item_rec_out.model_dump(),
                )
            )

        session.add(
            BasketOptimization(
                basket_id=basket_row.id,
                optimization_json=optimization_to_out(result.optimization).model_dump(),
            )
        )
        await session.commit()
        basket_id = basket_row.id

        intelligence = await compute_shopping_event_intelligence(session, basket_row, basket_item_rows)
        return BasketCompareResponse(
            basket_id=basket_id,
            basket=[basket_item_out(item) for item in basket.items],
            item_recommendations=item_recommendations_to_out(result.item_recommendations),
            optimization=optimization_to_out(result.optimization),
            intelligence=intelligence,
        )

    return BasketCompareResponse(
        basket_id=basket_id,
        basket=[basket_item_out(item) for item in basket.items],
        item_recommendations=item_recommendations_to_out(result.item_recommendations),
        optimization=optimization_to_out(result.optimization),
    )


@router.get("/{basket_id}/comparison", response_model=BasketOptimizationOut)
async def get_basket_comparison(
    basket_id: int,
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session),
) -> BasketOptimizationOut:
    basket_row = await session.get(BasketModel, basket_id)
    if basket_row is None or (user is not None and basket_row.user_id != user.id):
        raise HTTPException(status_code=404, detail="Basket not found")

    optimization_row = (
        await session.execute(
            BasketOptimization.__table__.select().where(BasketOptimization.basket_id == basket_id)
        )
    ).first()
    if optimization_row is None:
        raise HTTPException(status_code=404, detail="No comparison stored for this basket")

    return BasketOptimizationOut(**optimization_row.optimization_json)
