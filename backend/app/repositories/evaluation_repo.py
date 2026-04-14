import asyncio

from supabase import Client


class EvaluationRepository:
    """All Supabase Postgres operations for the evaluation_results table."""

    def __init__(self, client: Client) -> None:
        self._client = client

    def _insert_run_sync(self, document_id: str, results_json: list[dict]) -> dict:
        response = (
            self._client.table("evaluation_results")
            .insert({"document_id": document_id, "results": results_json})
            .execute()
        )
        return response.data[0]

    async def insert_run(self, document_id: str, results_json: list[dict]) -> dict:
        return await asyncio.to_thread(self._insert_run_sync, document_id, results_json)

    def _list_runs_sync(self) -> list[dict]:
        response = (
            self._client.table("evaluation_results")
            .select("*")
            .order("run_at", desc=True)
            .execute()
        )
        return response.data or []

    async def list_runs(self) -> list[dict]:
        return await asyncio.to_thread(self._list_runs_sync)
