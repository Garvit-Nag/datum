import asyncio

import httpx

from app.adapters.base.llm import LlmAdapterBase
from app.core.exceptions import LlmException

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_MAX_RETRIES = 4
_BASE_BACKOFF_SECONDS = 2.0


class GroqLlmAdapter(LlmAdapterBase):
    """Calls the Groq API (OpenAI-compatible). Retries on 429/5xx with
    exponential backoff so burst workloads (like the 20-call evaluation run)
    stay within free-tier TPM limits without crashing."""

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
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        _GROQ_URL, headers=self._headers, json=payload
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
                    raise LlmException(f"Unexpected Groq response shape: {exc}") from exc

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
                f"Groq returned {response.status_code}: {response.text[:200]}"
            )

        raise LlmException(f"Groq request failed after {_MAX_RETRIES} retries: {last_error}")
