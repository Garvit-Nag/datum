from jose import jwt, JWTError

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.models.auth import AuthUserType


def verify_supabase_jwt(token: str) -> AuthUserType:
    """Decode and validate a Supabase-issued JWT, returning the authenticated user."""
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        raise UnauthorizedException()

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise UnauthorizedException()

    user_metadata: dict = payload.get("user_metadata") or {}
    role: str = user_metadata.get("role", "user")

    return AuthUserType(user_id=user_id, role=role)
