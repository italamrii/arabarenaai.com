"""Signed session tokens using SESSION_SECRET."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta


def _sign_payload(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest


def _build_signed_token(*, session_uuid: str, secret: str, ttl_days: int) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(days=ttl_days)
    expires_unix = int(expires_at.timestamp())
    payload = f"{session_uuid}.{expires_unix}"
    signature = _sign_payload(payload, secret)
    token = f"{payload}.{signature}"
    return token, expires_at


def create_signed_session_id(*, secret: str, ttl_days: int = 30) -> tuple[str, datetime]:
    """Return (signed_token, expires_at). Token format: {uuid}.{expires_unix}.{signature}."""
    return _build_signed_token(
        session_uuid=str(uuid.uuid4()),
        secret=secret,
        ttl_days=ttl_days,
    )


def create_signed_session_from_uuid(
    *,
    session_uuid: str,
    secret: str,
    ttl_days: int = 30,
) -> tuple[str, datetime]:
    """Sign an existing session UUID for one-time legacy migration."""
    parsed = uuid.UUID(session_uuid)
    return _build_signed_token(
        session_uuid=str(parsed),
        secret=secret,
        ttl_days=ttl_days,
    )


def extract_session_uuid(token: str, *, secret: str) -> str | None:
    """Validate signed token; return inner UUID or None if invalid/expired."""
    if not token or not secret:
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    session_uuid, expires_raw, signature = parts
    try:
        uuid.UUID(session_uuid)
        expires_unix = int(expires_raw)
    except (ValueError, AttributeError):
        return None

    if expires_unix < int(datetime.now(UTC).timestamp()):
        return None

    payload = f"{session_uuid}.{expires_unix}"
    expected = _sign_payload(payload, secret)
    if not hmac.compare_digest(signature, expected):
        return None

    return session_uuid


def is_legacy_plain_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return "." not in value
    except ValueError:
        return False


def constant_time_compare(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def verify_admin_secret(provided: str | None, expected: str | None) -> bool:
    if not provided or not expected:
        return False
    return constant_time_compare(provided.strip(), expected.strip())


def generate_admin_secret() -> str:
    return secrets.token_hex(32)
