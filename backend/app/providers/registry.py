import logging

from app.core.config import get_settings
from app.observability.logging_config import log_event, log_exception_event
from app.providers.adapters import (
    AllamPlaceholderAdapter,
    AnthropicAdapter,
    GoogleAdapter,
    OpenAIAdapter,
    OpenAICompatibleAdapter,
)
from app.providers.base import ProviderAdapter
from app.providers.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

_circuit_breaker = CircuitBreaker()

# Stateless adapters — read API keys from get_settings() at runtime.
_ADAPTERS: dict[str, ProviderAdapter] = {
    "openai": OpenAIAdapter(),
    "anthropic": AnthropicAdapter(),
    "google": GoogleAdapter(),
    "deepseek": OpenAICompatibleAdapter(
        provider_key="deepseek",
        name_ar="DeepSeek",
        api_key_attr="deepseek_api_key",
        base_url_attr="deepseek_base_url",
    ),
    "qwen": OpenAICompatibleAdapter(
        provider_key="qwen",
        name_ar="Qwen",
        api_key_attr="qwen_api_key",
        base_url_attr="qwen_base_url",
    ),
    "xai": OpenAICompatibleAdapter(
        provider_key="xai",
        name_ar="xAI",
        api_key_attr="xai_api_key",
        base_url_attr="xai_base_url",
    ),
    "allam": AllamPlaceholderAdapter(),
}


class ProviderRegistry:
    """App-wide registry backed by shared stateless adapter instances."""

    def __init__(self) -> None:
        self._circuit_breaker = _circuit_breaker

    def get(self, provider_key: str) -> ProviderAdapter | None:
        return _ADAPTERS.get(provider_key)

    def all_adapters(self) -> list[ProviderAdapter]:
        return list(_ADAPTERS.values())

    def openai_configured(self) -> bool:
        settings = get_settings()
        adapter = self.get("openai")
        return settings.openai_api_key_configured and bool(adapter and adapter.is_configured())

    @property
    def circuit_breaker(self) -> CircuitBreaker:
        return self._circuit_breaker

    def reset_circuit_breakers(self, provider_key: str | None = None) -> dict[str, bool]:
        if provider_key:
            self._circuit_breaker.reset_provider(provider_key)
        else:
            self._circuit_breaker.reset_all()
        return {
            adapter.key: self._circuit_breaker.is_open(adapter.key)
            for adapter in self.all_adapters()
        }

    def circuit_breaker_states(self) -> dict[str, bool]:
        known = {
            adapter.key: self._circuit_breaker.is_open(adapter.key)
            for adapter in self.all_adapters()
        }
        known.update(self._circuit_breaker.snapshot())
        return known

    async def run_inference(
        self,
        *,
        provider_key: str,
        prompt: str,
        model_key: str,
        max_tokens: int,
        timeout_ms: int,
        attachment=None,
    ):
        if self._circuit_breaker.is_open(provider_key):
            from app.providers.errors import ProviderCallError, extract_provider_error

            err = RuntimeError(f"Circuit open for provider {provider_key}")
            details = extract_provider_error(
                err,
                provider_key=provider_key,
                model_key=model_key,
            )
            log_exception_event(
                logger,
                "provider.inference.circuit_breaker_open",
                err,
                **details.to_log_fields(),
                prompt_length=len(prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
            )
            raise ProviderCallError(details, cause=err) from err

        adapter = self.get(provider_key)
        if adapter is None:
            err = RuntimeError(f"Unknown provider: {provider_key}")
            log_exception_event(
                logger,
                "provider.inference.unknown_provider",
                err,
                provider_key=provider_key,
                model_key=model_key,
            )
            raise err

        from app.observability.metrics import get_metrics

        metrics = get_metrics()
        log_event(
            logger,
            "provider.inference.starting",
            provider_key=provider_key,
            model_key=model_key,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            timeout_ms=timeout_ms,
            circuit_open=False,
        )
        try:
            result = await adapter.complete(
                prompt,
                model_key,
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                attachment=attachment,
            )
            self._circuit_breaker.record_success(provider_key)
            metrics.record_provider_success(provider_key, result.response_time_ms)
            log_event(
                logger,
                "provider.inference.success",
                provider_key=provider_key,
                model_key=model_key,
                response_time_ms=result.response_time_ms,
            )
            return result
        except Exception as exc:
            self._circuit_breaker.record_failure(provider_key)
            circuit_open = self._circuit_breaker.is_open(provider_key)
            metrics.record_provider_failure(
                provider_key,
                error_type=type(exc).__name__,
                circuit_open=circuit_open,
            )
            from app.providers.errors import ProviderCallError, extract_provider_error

            details = (
                exc.details.to_log_fields()
                if isinstance(exc, ProviderCallError)
                else extract_provider_error(
                    exc,
                    provider_key=provider_key,
                    model_key=model_key,
                ).to_log_fields()
            )
            log_exception_event(
                logger,
                "provider.inference.failed",
                exc,
                **details,
                prompt_length=len(prompt),
                max_tokens=max_tokens,
                timeout_ms=timeout_ms,
                circuit_open=circuit_open,
            )
            raise


_registry = ProviderRegistry()


def reset_provider_registry() -> None:
    """Reset registry and clear in-memory circuit breaker state (e.g. on startup)."""
    global _registry
    _circuit_breaker.reset_all()
    _registry = ProviderRegistry()


def get_provider_registry() -> ProviderRegistry:
    settings = get_settings()
    openai = _registry.get("openai")
    logger.debug(
        "provider_registry.access",
        extra={
            "event": "provider_registry.access",
            "settings_openai_configured": settings.openai_api_key_configured,
            "registry_openai_configured": bool(openai and openai.is_configured()),
        },
    )
    return _registry
