from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PageText(BaseModel):
    page: int
    text: str


class RawChunk(BaseModel):
    chunk_index: int
    page: int
    paragraph: int
    text: str


class EmbeddedChunk(BaseModel):
    chunk_index: int
    page: int
    paragraph: int
    text: str
    vector: list[float]


class SimilarityChunk(BaseModel):
    rank: int
    page: int
    paragraph: int
    score: float
    signal: Literal["Strong", "Good", "Weak", "Poor"]
    text: str
    preview: str


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    namespace: str
    created_at: datetime


class DocumentListResponse(BaseModel):
    documents: list[DocumentUploadResponse]
