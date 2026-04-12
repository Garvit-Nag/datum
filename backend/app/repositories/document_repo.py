import asyncio
from datetime import datetime, timezone

from supabase import Client

from app.core.exceptions import DocumentNotFoundException


class DocumentRepository:
    """All Supabase Postgres operations for the documents and query_history tables.
    The supabase-py client is synchronous; every method dispatches to a thread pool."""

    def __init__(self, client: Client) -> None:
        self._client = client

    # ── Documents ────────────────────────────────────────────────────────────

    def _insert_sync(self, user_id: str, filename: str, namespace: str) -> dict:
        response = (
            self._client.table("documents")
            .insert(
                {
                    "user_id": user_id,
                    "filename": filename,
                    "status": "processing",
                    "namespace": namespace,
                }
            )
            .execute()
        )
        return response.data[0]

    async def insert(self, user_id: str, filename: str, namespace: str) -> dict:
        return await asyncio.to_thread(self._insert_sync, user_id, filename, namespace)

    def _get_by_id_sync(self, doc_id: str, user_id: str) -> dict | None:
        response = (
            self._client.table("documents")
            .select("*")
            .eq("id", doc_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data

    async def get_by_id(self, doc_id: str, user_id: str) -> dict | None:
        return await asyncio.to_thread(self._get_by_id_sync, doc_id, user_id)

    async def get_by_id_or_raise(self, doc_id: str, user_id: str) -> dict:
        doc = await self.get_by_id(doc_id, user_id)
        if doc is None:
            raise DocumentNotFoundException(doc_id)
        return doc

    def _list_by_user_sync(self, user_id: str) -> list[dict]:
        response = (
            self._client.table("documents")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []

    async def list_by_user(self, user_id: str) -> list[dict]:
        return await asyncio.to_thread(self._list_by_user_sync, user_id)

    def _update_status_sync(
        self, doc_id: str, status: str, chunk_count: int | None
    ) -> None:
        payload: dict = {"status": status}
        if chunk_count is not None:
            payload["chunk_count"] = chunk_count
        self._client.table("documents").update(payload).eq("id", doc_id).execute()

    async def update_status(
        self, doc_id: str, status: str, chunk_count: int | None = None
    ) -> None:
        await asyncio.to_thread(self._update_status_sync, doc_id, status, chunk_count)

    def _delete_sync(self, doc_id: str, user_id: str) -> None:
        self._client.table("documents").delete().eq("id", doc_id).eq(
            "user_id", user_id
        ).execute()

    async def delete(self, doc_id: str, user_id: str) -> None:
        await asyncio.to_thread(self._delete_sync, doc_id, user_id)

    # ── Query history ─────────────────────────────────────────────────────────

    def _insert_query_sync(
        self,
        user_id: str,
        document_id: str,
        question: str,
        answer: str,
        chunks_json: list[dict],
    ) -> str:
        response = (
            self._client.table("query_history")
            .insert(
                {
                    "user_id": user_id,
                    "document_id": document_id,
                    "question": question,
                    "answer": answer,
                    "chunks": chunks_json,
                }
            )
            .execute()
        )
        return response.data[0]["id"]

    async def insert_query(
        self,
        user_id: str,
        document_id: str,
        question: str,
        answer: str,
        chunks_json: list[dict],
    ) -> str:
        return await asyncio.to_thread(
            self._insert_query_sync,
            user_id,
            document_id,
            question,
            answer,
            chunks_json,
        )
