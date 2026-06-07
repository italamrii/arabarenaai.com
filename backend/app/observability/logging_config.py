"""Structured logging for production (JSON) and local dev (text)."""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

_SKIP_RECORD_KEYS = frozenset(
    {
        "name",
        "msg",
        "args",
        "created",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "module",
        "msecs",
        "message",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "exc_info",
        "exc_text",
        "thread",
        "threadName",
        "taskName",
    }
)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key not in _SKIP_RECORD_KEYS and not key.startswith("_"):
                payload[key] = value

        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging(*, level: str = "INFO", log_format: str = "json") -> None:
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    handler = logging.StreamHandler(sys.stdout)
    if log_format.lower() == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
        )

    root.addHandler(handler)

    # Quiet noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def log_event(
    logger: logging.Logger,
    event: str,
    *,
    level: int = logging.INFO,
    exc_info: bool | BaseException | None = False,
    **fields: Any,
) -> None:
    """Emit a structured log line with a stable `event` key."""
    logger.log(level, event, extra={"event": event, **fields}, exc_info=exc_info)


def log_exception_event(
    logger: logging.Logger,
    event: str,
    exc: BaseException,
    **fields: Any,
) -> None:
    """Emit a structured exception log with full stack trace."""
    from app.providers.errors import sanitize_error_message

    response = getattr(exc, "response", None)
    request_id = getattr(exc, "request_id", None)
    if request_id is None and response is not None:
        headers = getattr(response, "headers", None)
        if headers is not None:
            request_id = headers.get("x-request-id")

    logger.exception(
        event,
        extra={
            "event": event,
            "exception_class": type(exc).__name__,
            "error_message": sanitize_error_message(str(exc)),
            "status_code": getattr(exc, "status_code", None),
            "request_id": request_id,
            **fields,
        },
    )


def api_key_log_fields(api_key: str | None) -> dict[str, bool | int]:
    """Safe API-key diagnostics for structured logs (never logs the key)."""
    return {
        "api_key_configured": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
    }
