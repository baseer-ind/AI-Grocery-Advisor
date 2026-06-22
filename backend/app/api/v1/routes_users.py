from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.db.session import get_session
from app.domain.models import Basket, BillUpload, User
from app.domain.schemas_auth import UserOut, UserPreferencesOut, UserPreferencesUpdateIn
from app.services.user_service import update_preferences

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_profile(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.put("/me/preferences", response_model=UserPreferencesOut)
async def put_preferences(
    body: UserPreferencesUpdateIn,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserPreferencesOut:
    preferences = await update_preferences(
        session, user, body.grocery_preferences, body.cashback_preferences, body.membership_tier
    )
    return UserPreferencesOut.model_validate(preferences)


@router.get("/me/bills", response_model=list[int])
async def get_bill_history(
    user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)
) -> list[int]:
    result = await session.execute(select(BillUpload.id).where(BillUpload.user_id == user.id))
    return [row[0] for row in result.all()]


@router.get("/me/baskets", response_model=list[int])
async def get_basket_history(
    user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)
) -> list[int]:
    result = await session.execute(select(Basket.id).where(Basket.user_id == user.id))
    return [row[0] for row in result.all()]
