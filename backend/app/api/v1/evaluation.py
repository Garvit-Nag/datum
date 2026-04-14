from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.dependencies import (
    get_admin_user,
    get_db_client,
    get_embedding_adapter,
    get_judge_adapter,
    get_llm_adapter,
    get_vector_store,
)
from app.models.auth import AuthUserType
from app.models.evaluation import EvaluationRequest, EvaluationRunResponse
from app.repositories.document_repo import DocumentRepository
from app.repositories.evaluation_repo import EvaluationRepository
from app.services.evaluation_service import EvaluationService
from app.services.query_service import QueryService

router = APIRouter()


@router.post("/run")
async def run_evaluation(
    body: EvaluationRequest,
    user: AuthUserType = Depends(get_admin_user),
    vector_store: VectorStoreAdapterBase = Depends(get_vector_store),
    embedding: EmbeddingAdapterBase = Depends(get_embedding_adapter),
    llm: LlmAdapterBase = Depends(get_llm_adapter),
    judge: LlmAdapterBase = Depends(get_judge_adapter),
    db=Depends(get_db_client),
) -> StreamingResponse:
    """Stream evaluation progress as newline-delimited JSON events.

    Event shapes:
        {"type":"start","total":N}
        {"type":"progress","completed":C,"remaining":R,"row":{...EvaluationResultRow...}}
        {"type":"done","run":{...EvaluationRunResponse...}}
    """
    query_svc = QueryService(
        embedding=embedding,
        vector_store=vector_store,
        llm=llm,
        document_repo=DocumentRepository(db),
    )
    eval_svc = EvaluationService(
        query_service=query_svc,
        judge_llm=judge,
        evaluation_repo=EvaluationRepository(db),
    )

    stream = eval_svc.run_evaluation_stream(
        user.user_id, body.document_id, body.ground_truth_text
    )
    return StreamingResponse(stream, media_type="application/x-ndjson")


@router.get("/results", response_model=list[EvaluationRunResponse])
async def get_evaluation_results(
    _user: AuthUserType = Depends(get_admin_user),
    db=Depends(get_db_client),
) -> list[EvaluationRunResponse]:
    rows = await EvaluationRepository(db).list_runs()
    return [
        EvaluationRunResponse(
            id=row["id"],
            run_at=row["run_at"],
            results=row["results"],
            match_count=sum(1 for r in row["results"] if r["verdict"] == "Match"),
            partial_count=sum(1 for r in row["results"] if r["verdict"] == "Partial Match"),
            no_match_count=sum(1 for r in row["results"] if r["verdict"] == "No Match"),
            accuracy_pct=round(
                sum(1 for r in row["results"] if r["verdict"] == "Match")
                / len(row["results"])
                * 100,
                1,
            ) if row["results"] else 0.0,
        )
        for row in rows
    ]
