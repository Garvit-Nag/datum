from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str

    OPENROUTER_API_KEY: str
    OPENROUTER_ANSWER_MODEL: str = "minimax/minimax-m2.5"
    OPENROUTER_JUDGE_MODEL: str = "google/gemma-4-27b-it:free"

    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MAX_CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    TOP_K_RESULTS: int = 5

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    VECTOR_STORE_TYPE: Literal["pinecone"] = "pinecone"
    LLM_PROVIDER: Literal["openrouter"] = "openrouter"


settings = Settings()
