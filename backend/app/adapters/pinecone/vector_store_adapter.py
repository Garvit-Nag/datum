import asyncio
from typing import Literal

from pinecone import Pinecone

from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.exceptions import VectorStoreException
from app.models.document import EmbeddedChunk, SimilarityChunk

_SignalType = Literal["Strong", "Good", "Weak", "Poor"]


def _score_signal(score: float) -> _SignalType:
    if score >= 0.85:
        return "Strong"
    if score >= 0.70:
        return "Good"
    if score >= 0.50:
        return "Weak"
    return "Poor"


class PineconeVectorStoreAdapter(VectorStoreAdapterBase):
    """Wraps the Pinecone v3 client. All I/O is dispatched to a thread pool
    because the Pinecone SDK is synchronous."""

    def __init__(self, api_key: str, index_name: str) -> None:
        pc = Pinecone(api_key=api_key)
        self._index = pc.Index(index_name)

    async def upsert(self, namespace: str, chunks: list[EmbeddedChunk]) -> None:
        vectors = [
            {
                "id": f"{namespace}#{chunk.chunk_index}",
                "values": chunk.vector,
                "metadata": {
                    "chunk_index": chunk.chunk_index,
                    "page": chunk.page,
                    "paragraph": chunk.paragraph,
                    "preview": chunk.text[:120],
                },
            }
            for chunk in chunks
        ]
        try:
            await asyncio.to_thread(
                self._index.upsert, vectors=vectors, namespace=namespace
            )
        except Exception as exc:
            raise VectorStoreException(f"Upsert failed: {exc}") from exc

    async def search(
        self, namespace: str, vector: list[float], top_k: int
    ) -> list[SimilarityChunk]:
        try:
            result = await asyncio.to_thread(
                self._index.query,
                vector=vector,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True,
            )
        except Exception as exc:
            raise VectorStoreException(f"Search failed: {exc}") from exc

        chunks: list[SimilarityChunk] = []
        for rank, match in enumerate(result.matches, start=1):
            meta = match.metadata or {}
            chunks.append(
                SimilarityChunk(
                    rank=rank,
                    page=int(meta.get("page", 0)),
                    paragraph=int(meta.get("paragraph", 0)),
                    score=round(float(match.score), 4),
                    signal=_score_signal(float(match.score)),
                    preview=str(meta.get("preview", ""))[:120],
                )
            )
        return chunks

    async def delete_namespace(self, namespace: str) -> None:
        try:
            await asyncio.to_thread(
                self._index.delete, delete_all=True, namespace=namespace
            )
        except Exception as exc:
            raise VectorStoreException(f"Namespace deletion failed: {exc}") from exc
