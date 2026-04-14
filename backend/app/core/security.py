import asyncio
from functools import lru_cache

from supabase import create_client, Client

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.models.auth import AuthUserType


@lru_cache(maxsize=1)
def _get_verify_client() -> Client:
    """Separate Supabase client used only for token verification.
    Uses the service-role key so it can call auth.get_user() on behalf of any user."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def verify_supabase_jwt(token: str) -> AuthUserType:
    """Verify a Supabase-issued JWT by calling Supabase's own auth.get_user().

    This works regardless of the JWT signing algorithm (HS256 or ECC P-256)
    because Supabase handles the verification server-side."""
    try:
        client = _get_verify_client()
        response = client.auth.get_user(token)
        user = response.user
        if not user:
            raise UnauthorizedException()
    except Exception as exc:
        if isinstance(exc, UnauthorizedException):
            raise
        raise UnauthorizedException()

    user_metadata: dict = user.user_metadata or {}
    role: str = user_metadata.get("role", "user")

    return AuthUserType(user_id=user.id, role=role)
