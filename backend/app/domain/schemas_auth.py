from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class PasswordResetRequestIn(BaseModel):
    email: EmailStr


class PasswordResetConfirmIn(BaseModel):
    token: str
    new_password: str


class UserPreferencesOut(BaseModel):
    grocery_preferences: dict
    cashback_preferences: dict
    membership_tier: str | None

    class Config:
        from_attributes = True


class UserPreferencesUpdateIn(BaseModel):
    grocery_preferences: dict | None = None
    cashback_preferences: dict | None = None
    membership_tier: str | None = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime
    preferences: UserPreferencesOut | None

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    token: str
    expires_at: datetime
    user: UserOut
