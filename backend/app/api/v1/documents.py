from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from app.adapters.base.embedding import EmbeddingAdapterBase
from app.adapters.base.storage import StorageAdapterBase
from app.adapters.base.vector_store import VectorStoreAdapterBase
from app.adapters.pypdf.pdf_parser_adapter import PypdfParserAdapter
from app.core.dependencies import (
    get_current_user,
    get_db_client,
    get_embedding_adapter,
    get_storage_adapter,
    get_vector_store,
)
from app.models.auth import AuthUserType
from app.models.document import DocumentListResponse, DocumentUploadResponse
from app.repositories.document_repo import DocumentRepository
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user: AuthUserType = Depends(get_current_user),
    vector_store: VectorStoreAdapterBase = Depends(get_vector_store),
    embedding: EmbeddingAdapterBase = Depends(get_embedding_adapter),
    storage: StorageAdapterBase = Depends(get_storage_adapter),
    db=Depends(get_db_client),
) -> DocumentUploadResponse:
    import asyncio

    content = await file.read()
    filename = file.filename or "document.pdf"

    repo = DocumentRepository(db)
    doc_row = await repo.insert(user.user_id, filename, "pending")
    doc_id = doc_row["id"]
    namespace = f"{user.user_id}_{doc_id}"

    await asyncio.to_thread(
        lambda: db.table("documents").update({"namespace": namespace}).eq("id", doc_id).execute()
    )

    svc = DocumentService(
        pdf_parser=PypdfParserAdapter(),
        embedding=embedding,
        vector_store=vector_store,
        storage=storage,
        document_repo=repo,
    )
    background_tasks.add_task(svc.ingest, user.user_id, doc_id, filename, content, namespace)

    return DocumentUploadResponse(
        id=doc_id,
        filename=filename,
        status="processing",
        namespace=namespace,
        created_at=doc_row["created_at"],
    )


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    user: AuthUserType = Depends(get_current_user),
    db=Depends(get_db_client),
) -> DocumentListResponse:
    docs = await DocumentRepository(db).list_by_user(user.user_id)
    return DocumentListResponse(documents=[DocumentUploadResponse(**d) for d in docs])


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    user: AuthUserType = Depends(get_current_user),
    vector_store: VectorStoreAdapterBase = Depends(get_vector_store),
    embedding: EmbeddingAdapterBase = Depends(get_embedding_adapter),
    storage: StorageAdapterBase = Depends(get_storage_adapter),
    db=Depends(get_db_client),
) -> None:
    svc = DocumentService(
        pdf_parser=PypdfParserAdapter(),
        embedding=embedding,
        vector_store=vector_store,
        storage=storage,
        document_repo=DocumentRepository(db),
    )
    await svc.delete(user.user_id, doc_id)
