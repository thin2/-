"""Minimal, vendor-agnostic LLM client for chat completion."""
from __future__ import annotations

import json
from typing import Any, Dict, List

import requests


class LLMClientError(Exception):
    """Raised when calling the upstream LLM API fails."""


class LLMClient:
    """
    Lightweight HTTP client that targets OpenAI-compatible `/chat/completions`
    endpoints. Default configuration points to Zhipu, but callers can change
    the base_url / headers via Config to接入任意大模型服务。
    """

    def __init__(self, api_key: str, base_url: str, timeout: int = 60, chat_path: str = "/chat/completions"):
        self.api_key = (api_key or "").strip()
        self.base_url = (base_url or "https://open.bigmodel.cn/api/paas/v4").rstrip("/")
        self.timeout = timeout
        self.chat_path = chat_path if chat_path.startswith("/") else f"/{chat_path}"

    def _build_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise LLMClientError("未配置 AI API Key")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        extra_params: Dict[str, Any] | None = None,
    ):
        """
        对话补全（流式输出）。
        extra_params 可用于传递不同厂商要求的额外参数，默认 None。
        """
        url = f"{self.base_url}{self.chat_path}"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "thinking": {
                "type": "disabled"
            }
        }
        if extra_params:
            payload.update(extra_params)

        try:
            headers = self._build_headers()
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                stream=True,
                timeout=self.timeout,
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if not line:
                    continue
                line_str = line.decode("utf-8")
                if not line_str.startswith("data: "):
                    continue
                data_str = line_str[6:]
                if data_str.strip() == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                    yield {"success": True, "data": data}
                except json.JSONDecodeError:
                    continue
        except requests.exceptions.RequestException as exc:
            yield {"success": False, "error": str(exc)}

