from abc import ABC, abstractmethod


class EmbeddingAdapterBase(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
