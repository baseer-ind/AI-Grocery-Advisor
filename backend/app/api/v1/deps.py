"""Shared FastAPI dependencies for resolving the current user from a
session token. Two variants: `get_current_user` (401s if missing/invalid)
for routes that require auth, `get_current_user_optional` (returns None)
for routes — like bill upload — that must keep working anonymously but
attach ownership when a session is present.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain.models import User
from app.services.auth_service import get_user_for_session_token


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    token = _extract_token(authorization)
    if token is None:
        return None
    return await get_user_for_session_token(session, token)


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
