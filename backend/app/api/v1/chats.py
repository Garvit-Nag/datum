from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_db_client
from app.models.auth import AuthUserType
from app.models.chat import (
    ChatDetailResponse,
    ChatResponse,
    CreateChatRequest,
    MessageResponse,
    UpdateChatTitleRequest,
)
from app.repositories.document_repo import DocumentRepository

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def create_chat(
    body: CreateChatRequest,
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> ChatResponse:
    repo = DocumentRepository(db)
    await repo.get_by_id_or_raise(body.document_id, user.user_id)
    row = await repo.create_chat(user.user_id, body.document_id, body.title)
    return ChatResponse(**row)


@router.get("/", response_model=list[ChatResponse])
async def list_chats(
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> list[ChatResponse]:
    rows = await DocumentRepository(db).list_chats(user.user_id)
    return [
        ChatResponse(
            id=r["id"],
            document_id=r["document_id"],
            title=r["title"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.get("/stats")
async def get_user_stats(
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> dict:
    return await DocumentRepository(db).count_user_stats(user.user_id)


@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat(
    chat_id: str,
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> ChatDetailResponse:
    repo = DocumentRepository(db)
    row = await repo.get_chat(chat_id, user.user_id)
    if row is None:
        from app.core.exceptions import AppException
        raise AppException(404, "CHAT_NOT_FOUND", f"Chat {chat_id} not found")
    doc = row.get("documents", {})
    return ChatDetailResponse(
        id=row["id"],
        document_id=row["document_id"],
        title=row["title"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        document_filename=doc.get("filename", ""),
        document_status=doc.get("status", ""),
    )


@router.patch("/{chat_id}")
async def update_chat_title(
    chat_id: str,
    body: UpdateChatTitleRequest,
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> dict:
    repo = DocumentRepository(db)
    chat = await repo.get_chat(chat_id, user.user_id)
    if chat is None:
        from app.core.exceptions import AppException
        raise AppException(404, "CHAT_NOT_FOUND", f"Chat {chat_id} not found")
    await repo.update_chat_title(chat_id, body.title)
    return {"ok": True}


@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> list[MessageResponse]:
    repo = DocumentRepository(db)
    chat = await repo.get_chat(chat_id, user.user_id)
    if chat is None:
        from app.core.exceptions import AppException
        raise AppException(404, "CHAT_NOT_FOUND", f"Chat {chat_id} not found")
    rows = await repo.list_chat_messages(chat_id)
    return [MessageResponse(**r) for r in rows]
