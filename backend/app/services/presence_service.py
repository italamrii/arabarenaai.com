from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime

from fastapi import Request
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.security import client_ip
from app.models.session_presence import SessionPresence
from app.observability.logging_config import log_event

logger = logging.getLogger(__name__)


def _hash_value(value: str | None) -> str | None:
    if not value:
        return None
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]


class PresenceService:
    @staticmethod
    def touch(
        db: Session,
        *,
        session_id: str,
        path: str | None = None,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> None:
        """Upsert session presence. Never raises — failures are logged only."""
        normalized = session_id.strip()
        if not normalized:
            return

        now = datetime.now(UTC)
        try:
            stmt = insert(SessionPresence).values(
                session_id=normalized,
                first_seen_at=now,
                last_seen_at=now,
                last_path=path,
                user_agent_hash=_hash_value(user_agent),
                ip_hash=_hash_value(ip),
            )
            update_values: dict = {"last_seen_at": now}
            if path:
                update_values["last_path"] = path
            if user_agent:
                update_values["user_agent_hash"] = _hash_value(user_agent)
            if ip:
                update_values["ip_hash"] = _hash_value(ip)

            stmt = stmt.on_conflict_do_update(
                index_elements=[SessionPresence.session_id],
                set_=update_values,
            )
            db.execute(stmt)
            db.commit()
        except Exception as exc:
            db.rollback()
            log_event(
                logger,
                "presence.touch.failed",
                level=logging.WARNING,
                exc_info=exc,
                path=path,
            )

    @staticmethod
    def touch_from_request(
        db: Session,
        *,
        session_id: str,
        request: Request | None = None,
        path: str | None = None,
    ) -> None:
        user_agent = request.headers.get("user-agent") if request else None
        ip = client_ip(request) if request else None
        PresenceService.touch(
            db,
            session_id=session_id,
            path=path,
            user_agent=user_agent,
            ip=ip,
        )
