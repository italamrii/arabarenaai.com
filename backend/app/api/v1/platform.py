from fastapi import APIRouter

from app.core.dependencies import DbSession, RequestId
from app.schemas.common import Envelope, to_meta
from app.schemas.platform import MaintenanceModeData, PlatformStatusData
from app.services.platform_settings_service import PlatformSettingsService

router = APIRouter(prefix="/platform", tags=["platform"])


@router.get("/status")
def platform_status(db: DbSession, request_id: RequestId) -> Envelope[PlatformStatusData]:
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
