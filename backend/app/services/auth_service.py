"""Email/password + Google Sign-In authentication, and session issuance.

Sessions are opaque random tokens stored server-side (`UserSession`), not
self-describing JWTs — this lets logout revoke a session immediately
rather than waiting for token expiry, matching how `BillUpload`'s job
tracking already favors a DB row over an encoded payload.
"""

import secrets
from datetime import datetime, timedelta

import bcrypt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.domain.models import PasswordResetToken, User, UserSession

SESSION_TTL = timedelta(days=30)
PASSWORD_RESET_TTL = timedelta(hours=1)


class AuthError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(
        select(User).options(selectinload(User.preferences)).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def register_user(session: AsyncSession, email: str, password: str, full_name: str | None) -> User:
    existing = await get_user_by_email(session, email)
    if existing is not None:
        raise AuthError(409, "An account with this email already exists")

    user = User(email=email, full_name=full_name, hashed_password=hash_password(password))
    session.add(user)
    await session.commit()
    await session.refresh(user, attribute_names=["preferences"])
    return user


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if user is None or user.hashed_password is None or not verify_password(password, user.hashed_password):
        raise AuthError(401, "Invalid email or password")
    if not user.is_active:
        raise AuthError(403, "Account is disabled")
    return user


async def authenticate_with_google(session: AsyncSession, google_id_token_value: str) -> User:
    try:
        payload = google_id_token.verify_oauth2_token(
            google_id_token_value, google_requests.Request(), audience=settings.google_client_id
        )
    except ValueError as exc:
        raise AuthError(401, "Invalid Google ID token") from exc

    google_sub = payload["sub"]
    email = payload.get("email")
    full_name = payload.get("name")

    result = await session.execute(
        select(User).options(selectinload(User.preferences)).where(User.google_sub == google_sub)
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user

    if email is not None:
        user = await get_user_by_email(session, email)
        if user is not None:
            user.google_sub = google_sub
            await session.commit()
            return user

    user = User(email=email, full_name=full_name, google_sub=google_sub)
    session.add(user)
    await session.commit()
    await session.refresh(user, attribute_names=["preferences"])
    return user


async def create_session(session: AsyncSession, user: User) -> UserSession:
    user_session = UserSession(
        user_id=user.id,
        token=secrets.token_urlsafe(48),
        expires_at=datetime.utcnow() + SESSION_TTL,
    )
    session.add(user_session)
    await session.commit()
    return user_session


async def revoke_session(session: AsyncSession, token: str) -> None:
    result = await session.execute(select(UserSession).where(UserSession.token == token))
    user_session = result.scalar_one_or_none()
    if user_session is not None and user_session.revoked_at is None:
        user_session.revoked_at = datetime.utcnow()
        await session.commit()


async def get_user_for_session_token(session: AsyncSession, token: str) -> User | None:
    result = await session.execute(select(UserSession).where(UserSession.token == token))
    user_session = result.scalar_one_or_none()
    if user_session is None:
        return None
    if user_session.revoked_at is not None or user_session.expires_at < datetime.utcnow():
        return None
    result = await session.execute(
        select(User).options(selectinload(User.preferences)).where(User.id == user_session.user_id)
    )
    return result.scalar_one_or_none()


async def request_password_reset(session: AsyncSession, email: str) -> str | None:
    """Returns the raw reset token, or None if no account exists for this
    email. The caller decides whether to email it (out of scope here — no
    email-sending infra exists yet) or, in dev/test, return it directly.
    Always doing the same amount of work regardless of whether the email
    exists would be the production-hardening follow-up to avoid leaking
    account existence via response timing/shape; not addressed here since
    no email transport exists yet to make that distinction meaningful.
    """
    user = await get_user_by_email(session, email)
    if user is None:
        return None

    token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id, token=token, expires_at=datetime.utcnow() + PASSWORD_RESET_TTL
    )
    session.add(reset_token)
    await session.commit()
    return token


async def confirm_password_reset(session: AsyncSession, token: str, new_password: str) -> None:
    result = await session.execute(select(PasswordResetToken).where(PasswordResetToken.token == token))
    reset_token = result.scalar_one_or_none()
    if reset_token is None or reset_token.used_at is not None or reset_token.expires_at < datetime.utcnow():
        raise AuthError(400, "Invalid or expired reset token")

    user = await session.get(User, reset_token.user_id)
    if user is None:
        raise AuthError(400, "Invalid or expired reset token")

    user.hashed_password = hash_password(new_password)
    reset_token.used_at = datetime.utcnow()
    await session.commit()
