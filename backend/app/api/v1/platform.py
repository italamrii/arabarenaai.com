from fastapi import APIRouter, Request

from app.core.dependencies import DbSession, OptionalSessionId, RequestId
from app.schemas.common import Envelope, to_meta
from app.schemas.platform import MaintenanceModeData, PlatformStatusData
from app.services.platform_settings_service import PlatformSettingsService
from app.services.presence_service import PresenceService

router = APIRouter(prefix="/platform", tags=["platform"])


@router.get("/status")
def platform_status(
    request: Request,
    db: DbSession,
    request_id: RequestId,
    session_id: OptionalSessionId,
) -> Envelope[PlatformStatusData]:
    if session_id:
        PresenceService.touch_from_request(
            db,
            session_id=session_id,
            request=request,
            path="/platform/status",
        )
    service = PlatformSettingsService(db)
    maintenance = service.get_maintenance_mode()
    return Envelope(
        data=PlatformStatusData(
            maintenance=MaintenanceModeData(
                enabled=bool(maintenance.get("enabled")),
                message_ar=str(maintenance.get("message_ar") or ""),
                message_en=str(maintenance.get("message_en") or ""),
                estimated_return=str(maintenance.get("estimated_return") or ""),
            )
        ),
        meta=to_meta(request_id),
    )
