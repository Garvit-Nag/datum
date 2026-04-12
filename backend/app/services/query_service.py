from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.config import settings
from app.core.exceptions import DocumentNotReadyException
from app.models.query import QueryResponse
from app.repositories.document_repo import DocumentRepository

_SYSTEM_PROMPT = (
    "You are a contract analysis assistant. "
    "Answer the user's question using only the context excerpts provided. "
    "Do not fabricate information. "
    "If the answer is not present in the context, reply exactly: "
    "'I cannot find this information in the document.'"
)


class QueryService:
    def __init__(
        self,
        embedding: EmbeddingAdapterBase,
        vector_store: VectorStoreAdapterBase,
        llm: LlmAdapterBase,
        document_repo: DocumentRepository,
    ) -> None:
        self._embedding = embedding
        self._vector_store = vector_store
        self._llm = llm
        self._document_repo = document_repo

    async def answer(
        self, user_id: str, document_id: str, question: str
    ) -> QueryResponse:
        doc = await self._document_repo.get_by_id_or_raise(document_id, user_id)

        if doc["status"] != "ready":
            raise DocumentNotReadyException(document_id)

        query_vectors = await self._embedding.embed([question])
        chunks = await self._vector_store.search(
            doc["namespace"], query_vectors[0], settings.TOP_K_RESULTS
        )

        context_block = "\n\n".join(
            f"[Chunk {c.rank} — Page {c.page}, Para {c.paragraph}]\n{c.preview}"
            for c in chunks
        )
        user_prompt = f"Question: {question}\n\nContext:\n{context_block}"

        answer_text = await self._llm.generate(_SYSTEM_PROMPT, user_prompt)

        query_id = await self._document_repo.insert_query(
            user_id=user_id,
            document_id=document_id,
            question=question,
            answer=answer_text,
            chunks_json=[c.model_dump() for c in chunks],
        )

        return QueryResponse(answer=answer_text, chunks=chunks, query_id=query_id)
