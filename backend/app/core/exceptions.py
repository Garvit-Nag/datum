from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, status_code: int, code: str, detail: str) -> None:
        super().__init__(status_code=status_code, detail={"code": code, "message": detail})


class DocumentNotFoundException(AppException):
    def __init__(self, document_id: str) -> None:
        super().__init__(404, "DOCUMENT_NOT_FOUND", f"Document {document_id} not found")


class DocumentNotReadyException(AppException):
    def __init__(self, document_id: str) -> None:
        super().__init__(409, "DOCUMENT_NOT_READY", f"Document {document_id} is not ready for querying")


class DocumentProcessingException(AppException):
    def __init__(self, detail: str = "Failed to process document") -> None:
        super().__init__(500, "DOCUMENT_PROCESSING_FAILED", detail)


class EmbeddingFailedException(AppException):
    def __init__(self) -> None:
        super().__init__(500, "EMBEDDING_FAILED", "Failed to generate embeddings")


class VectorStoreException(AppException):
    def __init__(self, detail: str = "Vector store operation failed") -> None:
        super().__init__(500, "VECTOR_STORE_ERROR", detail)


class LlmException(AppException):
    def __init__(self, detail: str = "LLM request failed") -> None:
        super().__init__(502, "LLM_ERROR", detail)


class StorageException(AppException):
    def __init__(self, detail: str = "Storage operation failed") -> None:
        super().__init__(500, "STORAGE_ERROR", detail)


class UnauthorizedException(AppException):
    def __init__(self) -> None:
        super().__init__(401, "UNAUTHORIZED", "Invalid or missing authentication token")
