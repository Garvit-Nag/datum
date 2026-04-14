from fastapi import Depends, Header, Request

from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.llm import LlmAdapterBase
from app.adapters.base.storage import StorageAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.core.exceptions import UnauthorizedException
from app.core.security import verify_supabase_jwt
from app.models.auth import AuthUserType


def get_current_user(authorization: str = Header(...)) -> AuthUserType:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException()
    token = authorization.removeprefix("Bearer ")
    return verify_supabase_jwt(token)


def get_vector_store(request: Request) -> VectorStoreAdapterBase:
    return request.app.state.vector_store


def get_embedding_adapter(request: Request) -> EmbeddingAdapterBase:
    return request.app.state.embedding


def get_llm_adapter(request: Request) -> LlmAdapterBase:
    return request.app.state.llm


def get_judge_adapter(request: Request) -> LlmAdapterBase:
    return request.app.state.judge


def get_storage_adapter(request: Request) -> StorageAdapterBase:
    return request.app.state.storage


def get_db_client(request: Request):
    return request.app.state.db
