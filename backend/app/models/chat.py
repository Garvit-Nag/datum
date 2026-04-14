from datetime import datetime

from pydantic import BaseModel, Field

from app.models.document import SimilarityChunk


class CreateChatRequest(BaseModel):
    document_id: str
    title: str = Field(default="New Chat", max_length=200)


class UpdateChatTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ChatResponse(BaseModel):
    id: str
    document_id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ChatDetailResponse(ChatResponse):
    document_filename: str
    document_status: str


class MessageResponse(BaseModel):
    id: str
    question: str
    answer: str
    chunks: list[SimilarityChunk]
    created_at: datetime
