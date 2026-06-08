from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.core.config import get_settings
from app.core.dependencies import DbSession, RequestId, rate_limit_sessions
from app.core.maintenance import require_platform_available
from app.core.session_tokens import extract_session_uuid
from app.schemas.common import Envelope, to_meta
from app.schemas.session import LegacySessionUpgradeRequest, SessionOut
from app.services.presence_service import PresenceService
from app.services.session_service import SessionService

router = APIRouter()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    request: Request,
    db: DbSession,
    request_id: RequestId,
    _ip: Annotated[str, Depends(rate_limit_sessions)],
    _platform: Annotated[None, Depends(require_platform_available)],
) -> Envelope[SessionOut]:
    session_id, expires_at = SessionService.create_session()
    settings = get_settings()
    inner_id = extract_session_uuid(session_id, secret=settings.session_secret)
    if inner_id:
        PresenceService.touch_from_request(
            db,
            session_id=inner_id,
            request=request,
            path="/sessions",
        )
    return Envelope(
        data=SessionOut(
            session_id=session_id,
            expires_at=expires_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        ),
        meta=to_meta(request_id),
    )


@router.post("/sessions/upgrade", status_code=status.HTTP_201_CREATED)
def upgrade_legacy_session(
    body: LegacySessionUpgradeRequest,
    request: Request,
    db: DbSession,
    request_id: RequestId,
    _ip: Annotated[str, Depends(rate_limit_sessions)],
) -> Envelope[SessionOut]:
    """One-time migration: sign an existing plain UUID without changing identity."""
    session_id, expires_at = SessionService.upgrade_legacy_session(body.legacy_session_id)
    PresenceService.touch_from_request(
        db,
        session_id=body.legacy_session_id.strip(),
        request=request,
        path="/sessions/upgrade",
    )
    return Envelope(
        data=SessionOut(
            session_id=session_id,
            expires_at=expires_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        ),
        meta=to_meta(request_id),
    )
