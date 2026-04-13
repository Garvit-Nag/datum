from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.config import settings
from app.core.exceptions import DocumentNotReadyException
from app.models.query import QueryResponse
from app.repositories.document_repo import DocumentRepository

_SYSTEM_PROMPT = (
    "You are a contract analysis assistant answering questions about a legal contract. "
    "You will be given relevant excerpts from the contract and a question. "
    "Your job is to read the excerpts carefully and answer the question based on what they say. "
    "The excerpts are retrieved via semantic search, so the information needed to answer is almost always present — "
    "read them thoroughly before concluding otherwise. "
    "Quote or paraphrase the relevant clause and cite the section number when possible. "
    "Only if the excerpts clearly do not contain the information, reply: "
    "This information is not available in the provided document. "
    "Only if the question has nothing to do with contracts at all, reply: "
    "This question is outside the scope of the document."
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
        self, user_id: str, document_id: str, question: str, chat_id: str,
    ) -> QueryResponse:
        doc = await self._document_repo.get_by_id_or_raise(document_id, user_id)

        if doc["status"] != "ready":
            raise DocumentNotReadyException(document_id)

        query_vectors = await self._embedding.embed(
            [settings.EMBEDDING_QUERY_PREFIX + question]
        )
        chunks = await self._vector_store.search(
            doc["namespace"], query_vectors[0], settings.TOP_K_RESULTS
        )

        context_block = "\n\n".join(
            f"[Excerpt {c.rank} — Page {c.page}, Paragraph {c.paragraph}]\n{c.text}"
            for c in chunks
        )
        user_prompt = (
            f"Contract excerpts:\n\n{context_block}\n\n"
            f"Question: {question}\n\n"
            "Answer the question using the excerpts above."
        )

        answer_text = await self._llm.generate(_SYSTEM_PROMPT, user_prompt)

        query_id = await self._document_repo.insert_query(
            user_id=user_id,
            document_id=document_id,
            question=question,
            answer=answer_text,
            chunks_json=[c.model_dump() for c in chunks],
            chat_id=chat_id,
        )

        await self._document_repo.update_chat_timestamp(chat_id)

        return QueryResponse(answer=answer_text, chunks=chunks, query_id=query_id)
