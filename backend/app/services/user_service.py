"""Profile and preference management for an authenticated user.

Kept separate from `auth_service.py` (which only deals with credentials
and sessions) so a future channel — e.g. an admin tool editing a user's
membership tier — can depend on this module without pulling in
password/session handling.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import User, UserPreferences


async def get_or_create_preferences(session: AsyncSession, user: User) -> UserPreferences:
    if user.preferences is not None:
        return user.preferences

    preferences = UserPreferences(user_id=user.id, grocery_preferences={}, cashback_preferences={})
    session.add(preferences)
    await session.commit()
    await session.refresh(user, attribute_names=["preferences"])
    return user.preferences


async def update_preferences(
    session: AsyncSession,
    user: User,
    grocery_preferences: dict | None,
    cashback_preferences: dict | None,
    membership_tier: str | None,
) -> UserPreferences:
    preferences = await get_or_create_preferences(session, user)

    if grocery_preferences is not None:
        preferences.grocery_preferences = grocery_preferences
    if cashback_preferences is not None:
        preferences.cashback_preferences = cashback_preferences
    if membership_tier is not None:
        preferences.membership_tier = membership_tier

    await session.commit()
    return preferences
