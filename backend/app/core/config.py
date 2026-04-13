from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str

    GROQ_API_KEY: str
    GROQ_ANSWER_MODEL: str = "llama-3.3-70b-versatile"

    GEMINI_API_KEY: str = ""
    GEMINI_JUDGE_MODEL: str = "gemini-2.5-flash"

    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"
    EMBEDDING_QUERY_PREFIX: str = "Represent this sentence for searching relevant passages: "
    MAX_CHUNK_SIZE: int = 350
    CHUNK_OVERLAP: int = 120
    TOP_K_RESULTS: int = 5

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    VECTOR_STORE_TYPE: Literal["pinecone"] = "pinecone"


settings = Settings()
