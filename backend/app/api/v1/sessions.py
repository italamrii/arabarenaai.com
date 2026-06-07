from fastapi import APIRouter, status

from app.core.dependencies import RequestId
from app.schemas.common import Envelope, to_meta
from app.schemas.session import SessionOut
from app.services.session_service import SessionService

router = APIRouter()


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(request_id: RequestId) -> Envelope[SessionOut]:
    session_id, expires_at = SessionService.create_session()
    return Envelope(
        data=SessionOut(
            session_id=session_id,
            expires_at=expires_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        ),
        meta=to_meta(request_id),
    )
