import uuid
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import ValidationAppError
from app.core.security import client_ip, rate_limiter
from app.core.session_tokens import extract_session_uuid
from app.providers.registry import ProviderRegistry, get_provider_registry


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid.uuid4()))


def _validate_session_token(raw_token: str) -> str:
    settings = get_settings()
    session_uuid = extract_session_uuid(raw_token, secret=settings.session_secret)
    if session_uuid is None:
        raise ValidationAppError(
            message="معرف الجلسة غير صالح أو منتهي الصلاحية",
            message_en="Invalid or expired session token",
            details=[{"field": "X-Session-Id", "issue": "invalid_or_expired"}],
        )
    return session_uuid


def get_session_id(
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
) -> str:
    if not x_session_id:
        raise ValidationAppError(
            message="معرف الجلسة مطلوب",
            message_en="X-Session-Id header is required",
            details=[{"field": "X-Session-Id", "issue": "required"}],
        )
    return _validate_session_token(x_session_id.strip())


def get_raw_session_token(
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
) -> str | None:
    if x_session_id is None:
        return None
    token = x_session_id.strip()
    if not token:
        return None
    _validate_session_token(token)
    return token


def get_optional_session_id(
    x_session_id: Annotated[str | None, Header(alias="X-Session-Id")] = None,
) -> str | None:
    if x_session_id is None:
        return None
    return _validate_session_token(x_session_id.strip())


def get_app_settings() -> Settings:
    return get_settings()


def get_app_provider_registry() -> ProviderRegistry:
    return get_provider_registry()


DbSession = Annotated[Session, Depends(get_db)]
RequestId = Annotated[str, Depends(get_request_id)]
SessionId = Annotated[str, Depends(get_session_id)]
RawSessionToken = Annotated[str | None, Depends(get_raw_session_token)]
OptionalSessionId = Annotated[str | None, Depends(get_optional_session_id)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]
ProviderRegistryDep = Annotated[ProviderRegistry, Depends(get_app_provider_registry)]


def _settings() -> Settings:
    return get_settings()


def rate_limit_comparisons(session_id: SessionId) -> str:
    settings = _settings()
    rate_limiter.check(
        f"comparisons:{session_id}",
        limit=settings.rate_limit_comparisons_per_hour,
        window_seconds=3600,
    )
    return session_id


def rate_limit_votes(session_id: SessionId) -> str:
    settings = _settings()
    rate_limiter.check(
        f"votes:{session_id}",
        limit=settings.rate_limit_votes_per_hour,
        window_seconds=3600,
    )
    return session_id


def rate_limit_category_detect(session_id: SessionId) -> str:
    settings = _settings()
    rate_limiter.check(
        f"category_detect:{session_id}",
        limit=settings.rate_limit_category_detect_per_hour,
        window_seconds=3600,
    )
    return session_id


def rate_limit_analytics(request: Request) -> str:
    settings = _settings()
    ip = client_ip(request)
    rate_limiter.check(
        f"analytics:{ip}",
        limit=settings.rate_limit_analytics_per_minute,
        window_seconds=60,
    )
    return ip


def rate_limit_sessions(request: Request) -> str:
    settings = _settings()
    ip = client_ip(request)
    rate_limiter.check(
        f"sessions:{ip}",
        limit=settings.rate_limit_sessions_per_hour,
        window_seconds=3600,
    )
    return ip
