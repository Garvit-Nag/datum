import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

from app.main import create_app
from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.storage import StorageAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.dependencies import (
    get_db_client,
    get_embedding_adapter,
    get_judge_adapter,
    get_llm_adapter,
    get_storage_adapter,
    get_vector_store,
)
from app.models.document import SimilarityChunk


class MockEmbeddingAdapter(EmbeddingAdapterBase):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [[0.1] * 384 for _ in texts]


class MockVectorStoreAdapter(VectorStoreAdapterBase):
    async def upsert(self, namespace: str, chunks) -> None:
        pass

    async def search(self, namespace: str, vector, top_k: int) -> list[SimilarityChunk]:
        return [
            SimilarityChunk(
                rank=1, page=1, paragraph=0, score=0.91, signal="Strong",
                preview="Sample contract clause about payment terms."
            )
        ]

    async def delete_namespace(self, namespace: str) -> None:
        pass


class MockLlmAdapter(LlmAdapterBase):
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        return "This is a mock answer."


class MockStorageAdapter(StorageAdapterBase):
    async def upload(self, user_id, doc_id, content, filename) -> str:
        return f"{user_id}/{doc_id}/{filename}"

    async def download(self, path: str) -> bytes:
        return b""

    async def delete(self, path: str) -> None:
        pass


def _mock_db():
    db = MagicMock()
    # documents.insert
    db.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "doc-123", "filename": "test.pdf", "status": "processing",
         "namespace": "user-1_doc-123", "created_at": "2026-01-01T00:00:00+00:00",
         "user_id": "user-1", "chunk_count": None}
    ]
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
        "id": "doc-123", "filename": "test.pdf", "status": "ready",
        "namespace": "user-1_doc-123", "created_at": "2026-01-01T00:00:00+00:00",
        "user_id": "user-1", "chunk_count": 5
    }
    db.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []
    db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
    db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
    return db


@pytest.fixture
def test_client():
    app = create_app()
    mock_db = _mock_db()

    app.dependency_overrides[get_embedding_adapter] = lambda: MockEmbeddingAdapter()
    app.dependency_overrides[get_vector_store] = lambda: MockVectorStoreAdapter()
    app.dependency_overrides[get_llm_adapter] = lambda: MockLlmAdapter()
    app.dependency_overrides[get_judge_adapter] = lambda: MockLlmAdapter()
    app.dependency_overrides[get_storage_adapter] = lambda: MockStorageAdapter()
    app.dependency_overrides[get_db_client] = lambda: mock_db

    return TestClient(app)


def _valid_jwt() -> str:
    """Mint a test JWT signed with the test secret."""
    from jose import jwt
    return jwt.encode(
        {"sub": "user-1", "user_metadata": {"role": "user"}},
        "test-secret",
        algorithm="HS256",
    )


def _admin_jwt() -> str:
    from jose import jwt
    return jwt.encode(
        {"sub": "user-1", "user_metadata": {"role": "admin"}},
        "test-secret",
        algorithm="HS256",
    )
