from abc import ABC, abstractmethod

from app.models.document import EmbeddedChunk, SimilarityChunk


class VectorStoreAdapterBase(ABC):
    @abstractmethod
    async def upsert(self, namespace: str, chunks: list[EmbeddedChunk]) -> None: ...

    @abstractmethod
    async def search(
        self, namespace: str, vector: list[float], top_k: int
    ) -> list[SimilarityChunk]: ...

    @abstractmethod
    async def delete_namespace(self, namespace: str) -> None: ...
