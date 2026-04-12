from pydantic import BaseModel, Field

from app.models.document import SimilarityChunk


class QueryRequest(BaseModel):
    document_id: str
    question: str = Field(..., min_length=1, max_length=500)


class QueryResponse(BaseModel):
    answer: str
    chunks: list[SimilarityChunk]
    query_id: str
