from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.pdf_parser import PdfParserAdapterBase
from app.adapters.base.storage import StorageAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.models.document import EmbeddedChunk
from app.repositories.document_repo import DocumentRepository
from app.utils.text_processing import chunk_pages
from app.core.config import settings


class DocumentService:
    def __init__(
        self,
        pdf_parser: PdfParserAdapterBase,
        embedding: EmbeddingAdapterBase,
        vector_store: VectorStoreAdapterBase,
        storage: StorageAdapterBase,
        document_repo: DocumentRepository,
    ) -> None:
        self._pdf_parser = pdf_parser
        self._embedding = embedding
        self._vector_store = vector_store
        self._storage = storage
        self._document_repo = document_repo

    async def ingest(
        self,
        user_id: str,
        doc_id: str,
        filename: str,
        content: bytes,
        namespace: str,
    ) -> None:
        """Full ingestion pipeline: parse → chunk → embed → upsert → store.
        On any failure the document status is set to 'failed'."""
        try:
            pages = self._pdf_parser.parse(content)
            raw_chunks = chunk_pages(pages, settings.MAX_CHUNK_SIZE, settings.CHUNK_OVERLAP)

            texts = [c.text for c in raw_chunks]
            vectors = await self._embedding.embed(texts)

            embedded_chunks = [
                EmbeddedChunk(
                    chunk_index=raw.chunk_index,
                    page=raw.page,
                    paragraph=raw.paragraph,
                    text=raw.text,
                    vector=vectors[i],
                )
                for i, raw in enumerate(raw_chunks)
            ]

            await self._vector_store.upsert(namespace, embedded_chunks)
            await self._storage.upload(user_id, doc_id, content, filename)
            await self._document_repo.update_status(doc_id, "ready", len(raw_chunks))
        except Exception:
            await self._document_repo.update_status(doc_id, "failed")
            raise

    async def delete(self, user_id: str, doc_id: str) -> None:
        """Remove document vectors, stored file, and metadata row."""
        doc = await self._document_repo.get_by_id_or_raise(doc_id, user_id)
        await self._vector_store.delete_namespace(doc["namespace"])
        await self._storage.delete(f"{user_id}/{doc_id}/{doc['filename']}")
        await self._document_repo.delete(doc_id, user_id)
