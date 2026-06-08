from datetime import datetime

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError
from app.core.session_tokens import (
    create_signed_session_from_uuid,
    create_signed_session_id,
    is_legacy_plain_uuid,
)


class SessionService:
    @staticmethod
    def create_session() -> tuple[str, datetime]:
        settings = get_settings()
        return create_signed_session_id(
            secret=settings.session_secret,
            ttl_days=settings.session_ttl_days,
        )

    @staticmethod
    def upgrade_legacy_session(legacy_session_id: str) -> tuple[str, datetime]:
        """Re-sign an existing plain UUID without changing identity."""
        normalized = legacy_session_id.strip()
        if not is_legacy_plain_uuid(normalized):
            raise ValidationAppError(
                message="معرف الجلسة القديم غير صالح",
                message_en="Invalid legacy session id",
                details=[{"field": "legacy_session_id", "issue": "invalid_uuid"}],
            )

        settings = get_settings()
        return create_signed_session_from_uuid(
            session_uuid=normalized,
            secret=settings.session_secret,
            ttl_days=settings.session_ttl_days,
        )
