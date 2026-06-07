from __future__ import annotations

import re
from dataclasses import dataclass

_SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{10,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._-]+", re.IGNORECASE),
    re.compile(r"api[_-]?key[\"']?\s*[:=]\s*[\"']?[^\"'\s]+", re.IGNORECASE),
)


@dataclass(frozen=True)
class ProviderErrorDetails:
    error_code: str
    error_message_debug: str
    provider_key: str
    model_key: str
    exception_class: str
    status_code: int | None = None
    request_id: str | None = None

    def to_content_structured(self) -> dict[str, str | int | None]:
        return {
            "error_code": self.error_code,
            "error_message_debug": self.error_message_debug,
            "provider_key": self.provider_key,
            "model_key": self.model_key,
            "exception_class": self.exception_class,
            "status_code": self.status_code,
            "request_id": self.request_id,
        }

    def to_log_fields(self) -> dict[str, str | int | None]:
        return {
            "provider_key": self.provider_key,
            "model_key": self.model_key,
            "error_code": self.error_code,
            "exception_class": self.exception_class,
            "status_code": self.status_code,
            "request_id": self.request_id,
            "error_message": self.error_message_debug,
        }


class ProviderCallError(Exception):
    def __init__(self, details: ProviderErrorDetails, cause: Exception | None = None) -> None:
        self.details = details
        super().__init__(details.error_message_debug)
        self.__cause__ = cause


def sanitize_error_message(message: str) -> str:
    redacted = message
    for pattern in _SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED]", redacted)
    return redacted[:2000]


_DEBUG_API_FIELDS = (
    "error_code",
    "error_message_debug",
    "provider_key",
    "model_key",
    "exception_class",
    "status_code",
    "request_id",
)


def resolve_response_debug_fields(
    *,
    content_structured: dict | None,
    status: str,
    provider_key: str | None,
    model_key: str | None,
    circuit_open: bool = False,
) -> dict[str, str | int | None]:
    """Resolve API debug fields from persisted JSONB or infer when missing."""
    stored = debug_fields_from_content_structured(content_structured)
    if status != "error":
        return stored
    if any(stored.get(key) for key in ("error_code", "error_message_debug", "exception_class")):
        return stored
    if circuit_open and provider_key:
        return debug_fields_from_content_structured(
            ProviderErrorDetails(
                error_code="circuit_breaker_open",
                error_message_debug=f"Circuit open for provider {provider_key}",
                provider_key=provider_key,
                model_key=model_key or "unknown",
                exception_class="CircuitBreakerOpen",
            ).to_content_structured()
        )
    if provider_key:
        return debug_fields_from_content_structured(
            ProviderErrorDetails(
                error_code="provider_error_unknown",
                error_message_debug="Provider error details not persisted for this response",
                provider_key=provider_key,
                model_key=model_key or "unknown",
                exception_class="Unknown",
            ).to_content_structured()
        )
    return stored


def debug_fields_from_content_structured(
    content_structured: dict | None,
) -> dict[str, str | int | None]:
    """Map persisted JSONB debug payload to safe API fields (no secrets)."""
    if not content_structured:
        return {field: None for field in _DEBUG_API_FIELDS}

    fields: dict[str, str | int | None] = {}
    for field in _DEBUG_API_FIELDS:
        raw = content_structured.get(field)
        if raw is None:
            fields[field] = None
            continue
        if field == "error_message_debug":
            fields[field] = sanitize_error_message(str(raw))
        elif field == "status_code":
            try:
                fields[field] = int(raw)
            except (TypeError, ValueError):
                fields[field] = None
        else:
            fields[field] = str(raw)
    return fields


def extract_provider_error(
    exc: Exception,
    *,
    provider_key: str,
    model_key: str,
) -> ProviderErrorDetails:
    exception_class = type(exc).__name__
    message = sanitize_error_message(str(exc))
    status_code: int | None = None
    request_id: str | None = None
    error_code = exception_class

    request_id = getattr(exc, "request_id", None)
    status_code = getattr(exc, "status_code", None)

    try:
        from openai import APIStatusError

        if isinstance(exc, APIStatusError):
            status_code = exc.status_code
            error_code = f"openai_http_{status_code}"
            if exc.body and isinstance(exc.body, dict):
                err = exc.body.get("error", {})
                if isinstance(err, dict):
                    error_type = err.get("type")
                    if error_type:
                        error_code = str(error_type)
                    api_message = err.get("message")
                    if api_message:
                        message = sanitize_error_message(str(api_message))
            response = getattr(exc, "response", None)
            if response is not None:
                headers = getattr(response, "headers", None)
                if headers is not None:
                    request_id = request_id or headers.get("x-request-id")
    except ImportError:
        pass

    if request_id is None:
        response = getattr(exc, "response", None)
        if response is not None:
            headers = getattr(response, "headers", None)
            if headers is not None:
                request_id = headers.get("x-request-id")

    if exception_class == "RateLimitError":
        error_code = "rate_limit_exceeded"
    elif exception_class == "AuthenticationError":
        error_code = "authentication_error"
    elif exception_class == "APITimeoutError":
        error_code = "api_timeout"
    elif exception_class == "APIConnectionError":
        error_code = "api_connection_error"
    elif "Circuit open" in message:
        error_code = "circuit_breaker_open"

    return ProviderErrorDetails(
        error_code=error_code,
        error_message_debug=message,
        provider_key=provider_key,
        model_key=model_key,
        exception_class=exception_class,
        status_code=status_code,
        request_id=request_id,
    )
