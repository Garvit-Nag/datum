import time

import pytest
from jose import jwt
from unittest.mock import patch

from app.core.exceptions import UnauthorizedException
from app.core.security import verify_supabase_jwt

_SECRET = "test-secret"


def _mint(payload: dict, secret: str = _SECRET) -> str:
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def patch_secret():
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = _SECRET
        yield


def test_valid_token_returns_auth_user():
    token = _mint({"sub": "user-abc", "user_metadata": {"role": "user"}})
    user = verify_supabase_jwt(token)
    assert user.user_id == "user-abc"
    assert user.role == "user"


def test_admin_role_extracted():
    token = _mint({"sub": "admin-1", "user_metadata": {"role": "admin"}})
    user = verify_supabase_jwt(token)
    assert user.role == "admin"


def test_missing_role_defaults_to_user():
    token = _mint({"sub": "user-2", "user_metadata": {}})
    user = verify_supabase_jwt(token)
    assert user.role == "user"


def test_missing_sub_raises_unauthorized():
    token = _mint({"user_metadata": {"role": "user"}})
    with pytest.raises(UnauthorizedException):
        verify_supabase_jwt(token)


def test_wrong_secret_raises_unauthorized():
    token = _mint({"sub": "user-1"}, secret="wrong-secret")
    with pytest.raises(UnauthorizedException):
        verify_supabase_jwt(token)


def test_malformed_token_raises_unauthorized():
    with pytest.raises(UnauthorizedException):
        verify_supabase_jwt("not.a.valid.token")
