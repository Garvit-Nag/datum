import pytest
from unittest.mock import patch

from tests.conftest import _admin_jwt, _valid_jwt


def test_run_evaluation_non_admin_returns_403(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.post(
            "/api/v1/evaluation/run",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
            json={"document_id": "doc-123"},
        )
    assert response.status_code == 403


def test_get_results_non_admin_returns_403(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.get(
            "/api/v1/evaluation/results",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
        )
    assert response.status_code == 403


def test_get_results_admin_returns_list(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.get(
            "/api/v1/evaluation/results",
            headers={"Authorization": f"Bearer {_admin_jwt()}"},
        )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
