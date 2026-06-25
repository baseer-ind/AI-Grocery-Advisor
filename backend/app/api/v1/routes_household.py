"""Household onboarding: Steps 1-3 (Profile, Shopping Behavior, Shopping
Style). Each step persists immediately and returns an insight computed
purely from the user's own input — see household_insight_service for why
no cross-household comparisons are generated here.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user_optional
from app.db.session import get_session
from app.domain.models import Household, ShoppingBehavior, ShoppingEvent, ShoppingStyle, User
from app.domain.schemas_household import (
    HouseholdProfileIn,
    HouseholdProfileOut,
    ShoppingBehaviorIn,
    ShoppingBehaviorOut,
    ShoppingStyleIn,
    ShoppingStyleOut,
)
from app.domain.schemas_shopping_intelligence import PredictedPantryOut, ShoppingEventSummaryOut
from app.services import household_insight_service
from app.services.pantry_prediction_service import predict_pantry

router = APIRouter(prefix="/api/v1/household", tags=["household"])


async def _get_household_or_404(household_id: int, session: AsyncSession) -> Household:
    household = await session.get(Household, household_id)
    if household is None:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


@router.post("", response_model=HouseholdProfileOut)
async def create_household_profile(
    payload: HouseholdProfileIn,
    user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session),
) -> HouseholdProfileOut:
    household = Household(user_id=user.id if user else None, **payload.model_dump())
    session.add(household)
    await session.commit()

    return HouseholdProfileOut(
        household_id=household.id,
        size=household.size,
        adults=household.adults,
        children=household.children,
        seniors=household.seniors,
        city=household.city,
        monthly_grocery_budget=(
            float(household.monthly_grocery_budget) if household.monthly_grocery_budget is not None else None
        ),
        insight=household_insight_service.household_profile_insight(household),
    )


@router.post("/{household_id}/shopping-behavior", response_model=ShoppingBehaviorOut)
async def set_shopping_behavior(
    household_id: int,
    payload: ShoppingBehaviorIn,
    session: AsyncSession = Depends(get_session),
) -> ShoppingBehaviorOut:
    await _get_household_or_404(household_id, session)

    behavior = (
        await session.execute(select(ShoppingBehavior).where(ShoppingBehavior.household_id == household_id))
    ).scalar_one_or_none()
    if behavior is None:
        behavior = ShoppingBehavior(household_id=household_id, stores=payload.stores, frequency=payload.frequency)
        session.add(behavior)
    else:
        behavior.stores = payload.stores
        behavior.frequency = payload.frequency
    await session.commit()

    return ShoppingBehaviorOut(
        household_id=household_id,
        stores=behavior.stores,
        frequency=behavior.frequency,
        insight=household_insight_service.shopping_behavior_insight(behavior),
    )


@router.post("/{household_id}/shopping-style", response_model=ShoppingStyleOut)
async def set_shopping_style(
    household_id: int,
    payload: ShoppingStyleIn,
    session: AsyncSession = Depends(get_session),
) -> ShoppingStyleOut:
    await _get_household_or_404(household_id, session)

    style = (
        await session.execute(select(ShoppingStyle).where(ShoppingStyle.household_id == household_id))
    ).scalar_one_or_none()
    if style is None:
        style = ShoppingStyle(household_id=household_id, priorities=payload.priorities)
        session.add(style)
    else:
        style.priorities = payload.priorities
    await session.commit()

    return ShoppingStyleOut(
        household_id=household_id,
        priorities=style.priorities,
        insight=household_insight_service.shopping_style_insight(style),
    )


@router.get("/{household_id}/pantry/predicted", response_model=PredictedPantryOut)
async def get_predicted_pantry(household_id: int, session: AsyncSession = Depends(get_session)) -> PredictedPantryOut:
    await _get_household_or_404(household_id, session)
    return await predict_pantry(session, household_id)


@router.get("/{household_id}/shopping-events", response_model=list[ShoppingEventSummaryOut])
async def list_shopping_events(
    household_id: int, session: AsyncSession = Depends(get_session)
) -> list[ShoppingEventSummaryOut]:
    await _get_household_or_404(household_id, session)
    events = (
        (
            await session.execute(
                select(ShoppingEvent)
                .where(ShoppingEvent.household_id == household_id)
                .order_by(ShoppingEvent.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [
        ShoppingEventSummaryOut(
            shopping_event_id=e.id,
            bill_date=e.bill_date,
            store_name=e.store_name,
            total_spend=float(e.total_spend) if e.total_spend is not None else None,
            purchase_method=e.purchase_method,
        )
        for e in events
    ]
