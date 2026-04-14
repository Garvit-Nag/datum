import pytest
from unittest.mock import patch

from tests.conftest import _valid_jwt


def test_query_valid_request_returns_response(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.post(
            "/api/v1/query/",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
            json={"document_id": "doc-123", "question": "What is the liability cap?"},
        )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "chunks" in data
    assert "query_id" in data
    assert len(data["chunks"]) >= 1


def test_query_missing_auth_returns_422(test_client):
    response = test_client.post(
        "/api/v1/query/",
        json={"document_id": "doc-123", "question": "What is the liability cap?"},
    )
    assert response.status_code == 422


def test_query_empty_question_returns_422(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.post(
            "/api/v1/query/",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
            json={"document_id": "doc-123", "question": ""},
        )
    assert response.status_code == 422
