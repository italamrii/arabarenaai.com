import logging
import time

import httpx
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.observability.logging_config import api_key_log_fields, log_event, log_exception_event
from app.providers.base import CompletionResult, HealthResult
from app.providers.errors import ProviderCallError, extract_provider_error
from app.domain.attachments import AttachmentInput
from app.providers.multimodal import (
    anthropic_user_content,
    google_user_parts,
    openai_user_content,
)
from app.providers.openai_utils import build_chat_completion_kwargs, normalize_prompt

logger = logging.getLogger(__name__)


class OpenAIAdapter:
    key = "openai"
    name_ar = "OpenAI"

    def __init__(self) -> None:
        self._cached_key: str | None = None
        self._client: AsyncOpenAI | None = None

    def _api_key(self) -> str | None:
        return get_settings().openai_api_key

    def _get_client(self) -> AsyncOpenAI | None:
        key = self._api_key()
        if not key:
            self._cached_key = None
            self._client = None
            return None
        if self._cached_key != key:
            self._cached_key = key
            self._client = AsyncOpenAI(api_key=key)
        return self._client

    def is_configured(self) -> bool:
        return bool(self._api_key())

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
        attachment: AttachmentInput | None = None,
    ) -> CompletionResult:
        client = self._get_client()
        if not client:
            raise RuntimeError("OpenAI API key not configured")

        try:
            completion_kwargs = build_chat_completion_kwargs(
                model_key=model_key,
                prompt=prompt,
                max_tokens=max_tokens,
                user_content=openai_user_content(prompt, attachment),
            )
        except ValueError as exc:
            details = extract_provider_error(
                exc, provider_key=self.key, model_key=model_key
            )
            log_exception_event(
                logger,
                "openai.complete.invalid_model",
                exc,
                **details.to_log_fields(),
            )
            raise ProviderCallError(details, cause=exc) from exc

        api_key = self._api_key()
        normalized_prompt = normalize_prompt(prompt)
        log_event(
            logger,
            "openai.request.starting",
            provider_key=self.key,
            model_key=model_key,
            prompt_length=len(normalized_prompt),
            max_tokens=max_tokens,
            timeout_ms=timeout_ms,
            **api_key_log_fields(api_key),
        )

        start = time.perf_counter()
        try:
            response = await client.chat.completions.create(
                **completion_kwargs,
                timeout=max(1.0, timeout_ms / 1000),
            )
        except Exception as exc:
            details = extract_provider_error(
                exc, provider_key=self.key, model_key=model_key
            )
            log_exception_event(
                logger,
                "openai.complete.failed",
                exc,
                **details.to_log_fields(),
                prompt_length=len(normalized_prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                **api_key_log_fields(api_key),
            )
            raise ProviderCallError(details, cause=exc) from exc

        elapsed = int((time.perf_counter() - start) * 1000)
        if not response.choices:
            err = RuntimeError("OpenAI returned no choices")
            details = extract_provider_error(
                err, provider_key=self.key, model_key=model_key
            )
            log_event(
                logger,
                "openai.complete.empty_choices",
                level=logging.ERROR,
                **details.to_log_fields(),
            )
            raise ProviderCallError(details, cause=err) from err

        content = response.choices[0].message.content or ""
        usage = response.usage
        log_event(
            logger,
            "openai.complete.success",
            provider_key=self.key,
            model_key=model_key,
            response_time_ms=elapsed,
            prompt_chars=len(normalize_prompt(prompt)),
            output_chars=len(content),
        )
        return CompletionResult(
            content=content,
            response_time_ms=elapsed,
            input_tokens=usage.prompt_tokens if usage else None,
            output_tokens=usage.completion_tokens if usage else None,
        )

    async def health_check(self) -> HealthResult:
        if not self.is_configured():
            return HealthResult(status="unavailable", message_ar="مفتاح API غير مُعد")
        client = self._get_client()
        start = time.perf_counter()
        try:
            await client.models.list(timeout=10.0)
            latency = int((time.perf_counter() - start) * 1000)
            return HealthResult(status="healthy", latency_ms=latency)
        except Exception as exc:
            log_exception_event(
                logger,
                "openai.health.failed",
                exc,
                provider_key=self.key,
                **api_key_log_fields(self._api_key()),
            )
            return HealthResult(status="degraded", message_ar="تعذر التحقق من الحالة")


class OpenAICompatibleAdapter:
    """Shared client for DeepSeek, Qwen, and xAI (Grok)."""

    def __init__(
        self,
        *,
        provider_key: str,
        name_ar: str,
        api_key_attr: str,
        base_url_attr: str,
    ) -> None:
        self.key = provider_key
        self.name_ar = name_ar
        self._api_key_attr = api_key_attr
        self._base_url_attr = base_url_attr
        self._cached_key: str | None = None
        self._client: AsyncOpenAI | None = None

    def _api_key(self) -> str | None:
        return getattr(get_settings(), self._api_key_attr)

    def _base_url(self) -> str:
        return getattr(get_settings(), self._base_url_attr)

    def _get_client(self) -> AsyncOpenAI | None:
        key = self._api_key()
        base_url = self._base_url()
        if not key:
            self._cached_key = None
            self._client = None
            return None
        if self._cached_key != key:
            self._cached_key = key
            self._client = AsyncOpenAI(api_key=key, base_url=base_url)
        return self._client

    def is_configured(self) -> bool:
        return bool(self._api_key())

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
        attachment: AttachmentInput | None = None,
    ) -> CompletionResult:
        client = self._get_client()
        if not client:
            raise RuntimeError(f"{self.key} API key not configured")
        api_key = self._api_key()
        user_content = openai_user_content(prompt, attachment) if attachment else prompt
        log_event(
            logger,
            "provider.request.starting",
            provider_key=self.key,
            model_key=model_key,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            timeout_ms=timeout_ms,
            **api_key_log_fields(api_key),
        )
        start = time.perf_counter()
        try:
            response = await client.chat.completions.create(
                model=model_key,
                messages=[{"role": "user", "content": user_content}],
                max_tokens=max_tokens,
                timeout=timeout_ms / 1000,
            )
        except Exception as exc:
            details = extract_provider_error(
                exc, provider_key=self.key, model_key=model_key
            )
            log_exception_event(
                logger,
                "provider.complete.failed",
                exc,
                **details.to_log_fields(),
                prompt_length=len(prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                **api_key_log_fields(api_key),
            )
            raise ProviderCallError(details, cause=exc) from exc
        elapsed = int((time.perf_counter() - start) * 1000)
        content = response.choices[0].message.content or ""
        usage = response.usage
        return CompletionResult(
            content=content,
            response_time_ms=elapsed,
            input_tokens=usage.prompt_tokens if usage else None,
            output_tokens=usage.completion_tokens if usage else None,
        )

    async def health_check(self) -> HealthResult:
        if not self.is_configured():
            return HealthResult(status="unavailable", message_ar="مفتاح API غير مُعد")
        return HealthResult(status="healthy", latency_ms=0)


class AnthropicAdapter:
    key = "anthropic"
    name_ar = "Anthropic"

    def _api_key(self) -> str | None:
        return get_settings().anthropic_api_key

    def is_configured(self) -> bool:
        return bool(self._api_key())

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
        attachment: AttachmentInput | None = None,
    ) -> CompletionResult:
        api_key = self._api_key()
        if not api_key:
            raise RuntimeError("Anthropic API key not configured")
        user_content = anthropic_user_content(prompt, attachment)
        log_event(
            logger,
            "provider.request.starting",
            provider_key=self.key,
            model_key=model_key,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            timeout_ms=timeout_ms,
            **api_key_log_fields(api_key),
        )
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=timeout_ms / 1000) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model_key,
                        "max_tokens": max_tokens,
                        "messages": [{"role": "user", "content": user_content}],
                    },
                )
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            details = extract_provider_error(
                exc, provider_key=self.key, model_key=model_key
            )
            log_exception_event(
                logger,
                "provider.complete.failed",
                exc,
                **details.to_log_fields(),
                prompt_length=len(prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                **api_key_log_fields(api_key),
            )
            raise
        elapsed = int((time.perf_counter() - start) * 1000)
        content_blocks = data.get("content", [])
        content = "".join(block.get("text", "") for block in content_blocks)
        usage = data.get("usage", {})
        return CompletionResult(
            content=content,
            response_time_ms=elapsed,
            input_tokens=usage.get("input_tokens"),
            output_tokens=usage.get("output_tokens"),
        )

    async def health_check(self) -> HealthResult:
        if not self.is_configured():
            return HealthResult(status="unavailable", message_ar="مفتاح API غير مُعد")
        return HealthResult(status="healthy", latency_ms=0)


class GoogleAdapter:
    key = "google"
    name_ar = "Google"

    def _api_key(self) -> str | None:
        return get_settings().google_api_key

    def is_configured(self) -> bool:
        return bool(self._api_key())

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
        attachment: AttachmentInput | None = None,
    ) -> CompletionResult:
        api_key = self._api_key()
        if not api_key:
            raise RuntimeError("Google API key not configured")
        parts = google_user_parts(prompt, attachment)
        log_event(
            logger,
            "provider.request.starting",
            provider_key=self.key,
            model_key=model_key,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            timeout_ms=timeout_ms,
            **api_key_log_fields(api_key),
        )
        start = time.perf_counter()
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_key}:generateContent"
        )
        try:
            async with httpx.AsyncClient(timeout=timeout_ms / 1000) as client:
                response = await client.post(
                    url,
                    params={"key": api_key},
                    json={
                        "contents": [{"parts": parts}],
                        "generationConfig": {
                            "maxOutputTokens": max_tokens,
                            "thinkingConfig": {"thinkingBudget": 0},
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            details = extract_provider_error(
                exc, provider_key=self.key, model_key=model_key
            )
            log_exception_event(
                logger,
                "provider.complete.failed",
                exc,
                **details.to_log_fields(),
                prompt_length=len(prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                **api_key_log_fields(api_key),
            )
            raise
        elapsed = int((time.perf_counter() - start) * 1000)
        candidates = data.get("candidates", [])
        content = ""
        finish_reason = None
        safety_ratings = None
        if candidates:
            candidate = candidates[0]
            finish_reason = candidate.get("finishReason")
            safety_ratings = candidate.get("safetyRatings")
            parts = candidate.get("content", {}).get("parts", [])
            content = "".join(part.get("text", "") for part in parts)
        usage = data.get("usageMetadata", {})
        prompt_feedback = data.get("promptFeedback")
        prompt_token_count = usage.get("promptTokenCount")
        candidates_token_count = usage.get("candidatesTokenCount")
        total_token_count = usage.get("totalTokenCount")
        thoughts_token_count = usage.get("thoughtsTokenCount")
        response_text_length = len(content)
        response_preview = content[:200]
        log_event(
            logger,
            "google.complete.diagnostic",
            provider_key=self.key,
            model=model_key,
            finish_reason=finish_reason,
            prompt_token_count=prompt_token_count,
            candidates_token_count=candidates_token_count,
            total_token_count=total_token_count,
            thoughts_token_count=thoughts_token_count,
            response_text_length=response_text_length,
            response_preview=response_preview,
            safety_ratings=safety_ratings,
            prompt_feedback=prompt_feedback,
            max_output_tokens=max_tokens,
            thinking_budget=0,
            response_time_ms=elapsed,
        )
        return CompletionResult(
            content=content,
            response_time_ms=elapsed,
            input_tokens=usage.get("promptTokenCount"),
            output_tokens=usage.get("candidatesTokenCount"),
        )

    async def health_check(self) -> HealthResult:
        if not self.is_configured():
            return HealthResult(status="unavailable", message_ar="مفتاح API غير مُعد")
        return HealthResult(status="healthy", latency_ms=0)


class AllamPlaceholderAdapter:
    key = "allam"
    name_ar = "علّام"

    def is_configured(self) -> bool:
        return False

    async def complete(
        self,
        prompt: str,
        model_key: str,
        *,
        max_tokens: int,
        timeout_ms: int,
        attachment: AttachmentInput | None = None,
    ) -> CompletionResult:
        raise RuntimeError("ALLaM provider is not yet available")

    async def health_check(self) -> HealthResult:
        return HealthResult(status="unavailable", message_ar="قريباً")
