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
        return response.data if response else None

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
        chat_id: str,
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
                    "chat_id": chat_id,
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
        chat_id: str,
    ) -> str:
        return await asyncio.to_thread(
            self._insert_query_sync,
            user_id,
            document_id,
            question,
            answer,
            chunks_json,
            chat_id,
        )

    # ── Chats ──────────────────────────────────────────────────────────────────

    def _create_chat_sync(self, user_id: str, document_id: str, title: str) -> dict:
        response = (
            self._client.table("chats")
            .insert(
                {
                    "user_id": user_id,
                    "document_id": document_id,
                    "title": title,
                }
            )
            .execute()
        )
        return response.data[0]

    async def create_chat(self, user_id: str, document_id: str, title: str) -> dict:
        return await asyncio.to_thread(self._create_chat_sync, user_id, document_id, title)

    def _list_chats_sync(self, user_id: str) -> list[dict]:
        response = (
            self._client.table("chats")
            .select("*, documents(filename, status)")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return response.data or []

    async def list_chats(self, user_id: str) -> list[dict]:
        return await asyncio.to_thread(self._list_chats_sync, user_id)

    def _get_chat_sync(self, chat_id: str, user_id: str) -> dict | None:
        response = (
            self._client.table("chats")
            .select("*, documents(filename, status)")
            .eq("id", chat_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data if response else None

    async def get_chat(self, chat_id: str, user_id: str) -> dict | None:
        return await asyncio.to_thread(self._get_chat_sync, chat_id, user_id)

    def _list_chat_messages_sync(self, chat_id: str) -> list[dict]:
        response = (
            self._client.table("query_history")
            .select("id, question, answer, chunks, created_at")
            .eq("chat_id", chat_id)
            .order("created_at", desc=False)
            .execute()
        )
        return response.data or []

    async def list_chat_messages(self, chat_id: str) -> list[dict]:
        return await asyncio.to_thread(self._list_chat_messages_sync, chat_id)

    def _update_chat_title_sync(self, chat_id: str, title: str) -> None:
        self._client.table("chats").update({"title": title}).eq("id", chat_id).execute()

    async def update_chat_title(self, chat_id: str, title: str) -> None:
        await asyncio.to_thread(self._update_chat_title_sync, chat_id, title)

    def _update_chat_timestamp_sync(self, chat_id: str) -> None:
        self._client.table("chats").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", chat_id).execute()

    async def update_chat_timestamp(self, chat_id: str) -> None:
        await asyncio.to_thread(self._update_chat_timestamp_sync, chat_id)

    def _count_user_stats_sync(self, user_id: str) -> dict:
        docs = self._client.table("documents").select("id", count="exact").eq("user_id", user_id).execute()
        chats = self._client.table("chats").select("id", count="exact").eq("user_id", user_id).execute()
        queries = self._client.table("query_history").select("id", count="exact").eq("user_id", user_id).execute()
        return {
            "total_documents": docs.count or 0,
            "total_chats": chats.count or 0,
            "total_queries": queries.count or 0,
        }

    async def count_user_stats(self, user_id: str) -> dict:
        return await asyncio.to_thread(self._count_user_stats_sync, user_id)

