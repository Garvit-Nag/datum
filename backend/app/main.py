from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from app.adapters.openrouter.llm_adapter import OpenRouterLlmAdapter
from app.adapters.pinecone.vector_store_adapter import PineconeVectorStoreAdapter
from app.adapters.sentence_transformers.embedding_adapter import (
    SentenceTransformerEmbeddingAdapter,
)
from app.adapters.supabase.storage_adapter import SupabaseStorageAdapter
from app.api.v1 import documents, evaluation, query
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Shared Supabase client (service role — bypasses RLS for trusted backend ops)
    db_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    app.state.embedding = SentenceTransformerEmbeddingAdapter(settings.EMBEDDING_MODEL)
    app.state.vector_store = PineconeVectorStoreAdapter(
        settings.PINECONE_API_KEY, settings.PINECONE_INDEX_NAME
    )
    app.state.llm = OpenRouterLlmAdapter(
        settings.OPENROUTER_API_KEY, settings.OPENROUTER_ANSWER_MODEL
    )
    app.state.judge = OpenRouterLlmAdapter(
        settings.OPENROUTER_API_KEY, settings.OPENROUTER_JUDGE_MODEL
    )
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

    return app


app = create_app()
