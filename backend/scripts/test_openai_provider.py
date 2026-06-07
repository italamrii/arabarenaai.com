#!/usr/bin/env python3
"""Manual OpenAI provider smoke test. Does not print API keys."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# backend/scripts/ → backend/
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings
from app.providers.adapters import OpenAIAdapter
from app.providers.errors import ProviderCallError


async def _test_model(adapter: OpenAIAdapter, model_key: str, prompt: str) -> None:
    print(f"\n=== Testing model: {model_key} ===")
    try:
        result = await adapter.complete(
            prompt,
            model_key,
            max_tokens=512,
            timeout_ms=60_000,
        )
        preview = (result.content or "")[:200].replace("\n", " ")
        print("status: success")
        print(f"response_time_ms: {result.response_time_ms}")
        print(f"input_tokens: {result.input_tokens}")
        print(f"output_tokens: {result.output_tokens}")
        print(f"content_preview: {preview!r}")
    except ProviderCallError as exc:
        d = exc.details
        print("status: error (ProviderCallError)")
        print(f"error_code: {d.error_code}")
        print(f"exception_class: {d.exception_class}")
        print(f"status_code: {d.status_code}")
        print(f"request_id: {d.request_id}")
        print(f"error_message_debug: {d.error_message_debug}")
    except Exception as exc:
        print("status: error")
        print(f"exception_class: {type(exc).__name__}")
        print(f"error_message: {exc}")


async def main() -> int:
    settings = get_settings()
    configured = settings.openai_api_key_configured
    prefix = (settings.openai_api_key or "")[:8] + "..." if configured else None

    print("openai_api_key_configured:", configured)
    print("openai_api_key_prefix:", prefix)

    if not configured:
        print("ERROR: OPENAI_API_KEY is not configured in backend/.env")
        return 1

    adapter = OpenAIAdapter()
    prompt = "اشرح الذكاء الاصطناعي"

    for model_key in ("gpt-4o-mini", "gpt-4o"):
        await _test_model(adapter, model_key, prompt)

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
