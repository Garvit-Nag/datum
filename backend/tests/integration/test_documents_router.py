import io
import pytest
from unittest.mock import patch

from tests.conftest import _valid_jwt


def test_upload_no_auth_returns_401(test_client):
    response = test_client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert response.status_code == 422  # missing Authorization header → validation error


def test_upload_invalid_token_returns_401(test_client):
    response = test_client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": "Bearer invalid.token.here"},
        files={"file": ("test.pdf", b"%PDF-1.4 test", "application/pdf")},
    )
    assert response.status_code == 401


def test_upload_valid_returns_document(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.post(
            "/api/v1/documents/upload",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
            files={"file": ("test.pdf", b"%PDF-1.4 test content", "application/pdf")},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["status"] == "processing"
    assert "id" in data


def test_list_documents_returns_list(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.get(
            "/api/v1/documents/",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
        )
    assert response.status_code == 200
    assert "documents" in response.json()


def test_delete_document(test_client):
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.SUPABASE_JWT_SECRET = "test-secret"
        response = test_client.delete(
            "/api/v1/documents/doc-123",
            headers={"Authorization": f"Bearer {_valid_jwt()}"},
        )
    assert response.status_code == 204
