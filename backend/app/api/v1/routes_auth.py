from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import _extract_token, get_current_user
from app.core.config import settings
from app.db.session import get_session
from app.domain.models import User
from app.domain.schemas_auth import (
    GoogleAuthRequest,
    LoginRequest,
    PasswordResetConfirmIn,
    PasswordResetRequestIn,
    RegisterRequest,
    SessionOut,
    UserOut,
)
from app.services.auth_service import (
    AuthError,
    authenticate_user,
    authenticate_with_google,
    confirm_password_reset,
    create_session,
    register_user,
    request_password_reset,
    revoke_session,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=SessionOut, status_code=201)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)) -> SessionOut:
    try:
        user = await register_user(session, body.email, body.password, body.full_name)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    user_session = await create_session(session, user)
    return SessionOut(token=user_session.token, expires_at=user_session.expires_at, user=UserOut.model_validate(user))


@router.post("/login", response_model=SessionOut)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)) -> SessionOut:
    try:
        user = await authenticate_user(session, body.email, body.password)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    user_session = await create_session(session, user)
    return SessionOut(token=user_session.token, expires_at=user_session.expires_at, user=UserOut.model_validate(user))


@router.post("/google", response_model=SessionOut)
async def google_login(body: GoogleAuthRequest, session: AsyncSession = Depends(get_session)) -> SessionOut:
    if settings.google_client_id is None:
        raise HTTPException(status_code=503, detail="Google Sign-In is not configured")

    try:
        user = await authenticate_with_google(session, body.id_token)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    user_session = await create_session(session, user)
    return SessionOut(token=user_session.token, expires_at=user_session.expires_at, user=UserOut.model_validate(user))


@router.post("/logout", status_code=204)
async def logout(
    user: User = Depends(get_current_user),
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> None:
    token = _extract_token(authorization)
    if token:
        await revoke_session(session, token)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/password-reset/request", status_code=202)
async def password_reset_request(
    body: PasswordResetRequestIn, session: AsyncSession = Depends(get_session)
) -> dict:
    token = await request_password_reset(session, body.email)
    if settings.environment == "development":
        return {"detail": "If an account exists for this email, a reset link has been issued.", "token": token}
    return {"detail": "If an account exists for this email, a reset link has been issued."}


@router.post("/password-reset/confirm", status_code=204)
async def password_reset_confirm(
    body: PasswordResetConfirmIn, session: AsyncSession = Depends(get_session)
) -> None:
    try:
        await confirm_password_reset(session, body.token, body.new_password)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
