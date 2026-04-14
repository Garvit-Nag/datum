import asyncio

from supabase import Client

from app.adapters.base.storage import StorageAdapterBase
from app.core.exceptions import StorageException

_BUCKET = "documents"


class SupabaseStorageAdapter(StorageAdapterBase):
    """Wraps Supabase Storage using the sync supabase-py client dispatched
    to a thread pool."""

    def __init__(self, client: Client) -> None:
        self._client = client

    def _upload_sync(
        self, user_id: str, doc_id: str, content: bytes, filename: str
    ) -> str:
        path = f"{user_id}/{doc_id}/{filename}"
        self._client.storage.from_(_BUCKET).upload(
            path=path,
            file=content,
            file_options={"content-type": "application/octet-stream", "upsert": "true"},
        )
        return path

    def _download_sync(self, path: str) -> bytes:
        return self._client.storage.from_(_BUCKET).download(path)

    def _delete_sync(self, path: str) -> None:
        self._client.storage.from_(_BUCKET).remove([path])

    async def upload(
        self, user_id: str, doc_id: str, content: bytes, filename: str
    ) -> str:
        try:
            return await asyncio.to_thread(
                self._upload_sync, user_id, doc_id, content, filename
            )
        except Exception as exc:
            raise StorageException(f"Upload failed: {exc}") from exc

    async def download(self, path: str) -> bytes:
        try:
            return await asyncio.to_thread(self._download_sync, path)
        except Exception as exc:
            raise StorageException(f"Download failed: {exc}") from exc

    async def delete(self, path: str) -> None:
        try:
            await asyncio.to_thread(self._delete_sync, path)
        except Exception as exc:
            raise StorageException(f"Delete failed: {exc}") from exc
