import asyncio

from sentence_transformers import SentenceTransformer

from app.adapters.base.embedding import EmbeddingAdapterBase
from app.core.exceptions import EmbeddingFailedException


class SentenceTransformerEmbeddingAdapter(EmbeddingAdapterBase):
    """Loads the SentenceTransformer model once at startup and runs encoding
    in a thread pool to avoid blocking the event loop."""

    def __init__(self, model_name: str) -> None:
        self._model = SentenceTransformer(model_name)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            embeddings = await asyncio.to_thread(self._model.encode, texts)
            return embeddings.tolist()
        except Exception as exc:
            raise EmbeddingFailedException() from exc
