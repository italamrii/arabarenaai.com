from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.dependencies import RequestId, rate_limit_sessions
from app.core.maintenance import require_platform_available
from app.schemas.common import Envelope, to_meta
from app.schemas.session import LegacySessionUpgradeRequest, SessionOut
from app.services.session_service import SessionService

router = APIRouter()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    request_id: RequestId,
    _ip: Annotated[str, Depends(rate_limit_sessions)],
    _platform: Annotated[None, Depends(require_platform_available)],
) -> Envelope[SessionOut]:
    session_id, expires_at = SessionService.create_session()
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
    request_id: RequestId,
    _ip: Annotated[str, Depends(rate_limit_sessions)],
) -> Envelope[SessionOut]:
    """One-time migration: sign an existing plain UUID without changing identity."""
    session_id, expires_at = SessionService.upgrade_legacy_session(body.legacy_session_id)
    return Envelope(
        data=SessionOut(
            session_id=session_id,
            expires_at=expires_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        ),
        meta=to_meta(request_id),
    )
