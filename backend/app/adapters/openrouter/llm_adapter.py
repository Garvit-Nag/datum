import httpx

from app.adapters.base.llm import LlmAdapterBase
from app.core.exceptions import LlmException


class OpenRouterLlmAdapter(LlmAdapterBase):
    """Calls the OpenRouter chat completions endpoint using the OpenAI-compatible API."""

    _BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, api_key: str, model: str) -> None:
        self._model = model
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Garvit-Nag/datum",
            "X-Title": "Datum MiniRAG",
        }

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self._BASE_URL, headers=self._headers, json=payload)

        if response.status_code != 200:
            raise LlmException(f"OpenRouter returned {response.status_code}: {response.text[:200]}")

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise LlmException(f"Unexpected OpenRouter response shape: {exc}") from exc
