from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from app.adapters.gemini.llm_adapter import GeminiLlmAdapter
from app.adapters.groq.llm_adapter import GroqLlmAdapter
from app.adapters.pinecone.vector_store_adapter import PineconeVectorStoreAdapter
from app.adapters.sentence_transformers.embedding_adapter import (
    SentenceTransformerEmbeddingAdapter,
)
from app.adapters.supabase.storage_adapter import SupabaseStorageAdapter
from app.api.v1 import chats, documents, evaluation, query
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    app.state.embedding = SentenceTransformerEmbeddingAdapter(settings.EMBEDDING_MODEL)
    # Pre-warm: force the first encode() call during startup so that the first
    # document upload doesn't pay the model cold-start penalty.
    await app.state.embedding.embed(["warmup"])

    app.state.vector_store = PineconeVectorStoreAdapter(
        settings.PINECONE_API_KEY, settings.PINECONE_INDEX_NAME
    )
    app.state.llm = GroqLlmAdapter(settings.GROQ_API_KEY, settings.GROQ_ANSWER_MODEL)
    app.state.judge = GeminiLlmAdapter(settings.GEMINI_API_KEY, settings.GEMINI_JUDGE_MODEL)
    app.state.storage = SupabaseStorageAdapter(db_client)
    app.state.db = db_client

    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Datum API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
    app.include_router(query.router, prefix="/api/v1/query", tags=["query"])
    app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["evaluation"])
    app.include_router(chats.router, prefix="/api/v1/chats", tags=["chats"])

    return app


app = create_app()
