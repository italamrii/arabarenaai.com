import uuid
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import ValidationAppError
from app.core.security import client_ip, rate_limiter
from app.providers.registry import ProviderRegistry, get_provider_registry


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid.uuid4()))


def get_session_id(
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
) -> str:
    if not x_session_id:
        raise ValidationAppError(
            message="معرف الجلسة مطلوب",
            message_en="X-Session-Id header is required",
            details=[{"field": "X-Session-Id", "issue": "required"}],
        )
    try:
        uuid.UUID(x_session_id)
    except ValueError as exc:
        raise ValidationAppError(
            message="معرف الجلسة غير صالح",
            message_en="Invalid X-Session-Id format",
            details=[{"field": "X-Session-Id", "issue": "invalid_uuid"}],
        ) from exc
    return x_session_id


def get_optional_session_id(
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
) -> str | None:
    if x_session_id is None:
        return None
    try:
        uuid.UUID(x_session_id)
    except ValueError as exc:
        raise ValidationAppError(
            message="معرف الجلسة غير صالح",
            message_en="Invalid X-Session-Id format",
        ) from exc
    return x_session_id


def get_app_settings() -> Settings:
    return get_settings()


def get_app_provider_registry() -> ProviderRegistry:
    return get_provider_registry()


DbSession = Annotated[Session, Depends(get_db)]
RequestId = Annotated[str, Depends(get_request_id)]
SessionId = Annotated[str, Depends(get_session_id)]
OptionalSessionId = Annotated[str | None, Depends(get_optional_session_id)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]
ProviderRegistryDep = Annotated[ProviderRegistry, Depends(get_app_provider_registry)]


def rate_limit_comparisons(session_id: SessionId) -> str:
    rate_limiter.check(f"comparisons:{session_id}", limit=10, window_seconds=3600)
    return session_id


def rate_limit_votes(session_id: SessionId) -> str:
    rate_limiter.check(f"votes:{session_id}", limit=30, window_seconds=3600)
    return session_id


def rate_limit_category_detect(session_id: SessionId) -> str:
    rate_limiter.check(f"category_detect:{session_id}", limit=20, window_seconds=3600)
    return session_id


def rate_limit_analytics(request: Request) -> str:
    ip = client_ip(request)
    rate_limiter.check(f"analytics:{ip}", limit=60, window_seconds=60)
    return ip
