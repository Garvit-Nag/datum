from fastapi import APIRouter, Depends

from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.dependencies import (
    get_current_user,
    get_db_client,
    get_embedding_adapter,
    get_llm_adapter,
    get_vector_store,
)
from app.models.auth import AuthUserType
from app.models.query import QueryRequest, QueryResponse
from app.repositories.document_repo import DocumentRepository
from app.services.query_service import QueryService

router = APIRouter()


@router.post("/", response_model=QueryResponse)
async def run_query(
    body: QueryRequest,
    user: AuthUserType = Depends(get_current_user),
    vector_store: VectorStoreAdapterBase = Depends(get_vector_store),
    embedding: EmbeddingAdapterBase = Depends(get_embedding_adapter),
    llm: LlmAdapterBase = Depends(get_llm_adapter),
    db=Depends(get_db_client),
) -> QueryResponse:
    svc = QueryService(
        embedding=embedding,
        vector_store=vector_store,
        llm=llm,
        document_repo=DocumentRepository(db),
    )
    return await svc.answer(user.user_id, body.document_id, body.question, body.chat_id)
