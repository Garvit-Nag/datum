import asyncio

import httpx

from app.adapters.base.llm import LlmAdapterBase
from app.core.exceptions import LlmException

# Gemini exposes an OpenAI-compatible endpoint so the request shape is identical
# to the Groq adapter.
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
_MAX_RETRIES = 3
_BASE_BACKOFF_SECONDS = 4.0


class GeminiLlmAdapter(LlmAdapterBase):
    """Calls the Gemini API via its OpenAI-compatible endpoint.

    Uses exponential backoff on 429/5xx so bursts (e.g. a 10-question batch
    judge call) stay within the free-tier RPM limit without crashing."""

    def __init__(self, api_key: str, model: str) -> None:
        self._model = model
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})

        payload = {"model": self._model, "messages": messages}

        last_error: str = ""
        for attempt in range(_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        _GEMINI_URL, headers=self._headers, json=payload
                    )
            except httpx.RequestError as exc:
                last_error = f"network error: {exc}"
                await asyncio.sleep(_BASE_BACKOFF_SECONDS * (2 ** attempt))
                continue

            if response.status_code == 200:
                data = response.json()
                try:
                    return data["choices"][0]["message"]["content"]
                except (KeyError, IndexError) as exc:
                    raise LlmException(f"Unexpected Gemini response shape: {exc}") from exc

            if response.status_code == 429 or 500 <= response.status_code < 600:
                retry_after_header = response.headers.get("retry-after")
                try:
                    wait_seconds = float(retry_after_header) if retry_after_header else 0.0
                except ValueError:
                    wait_seconds = 0.0
                if wait_seconds <= 0:
                    wait_seconds = _BASE_BACKOFF_SECONDS * (2 ** attempt)
                last_error = f"{response.status_code}: {response.text[:200]}"
                await asyncio.sleep(wait_seconds)
                continue

            raise LlmException(
                f"Gemini returned {response.status_code}: {response.text[:200]}"
            )

        raise LlmException(f"Gemini request failed after {_MAX_RETRIES} retries: {last_error}")
