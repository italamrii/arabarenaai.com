from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.admin_auth import require_admin_access
from app.core.dependencies import DbSession, RequestId
from app.schemas.common import Envelope, to_meta
from app.schemas.platform import MaintenanceModeData, MaintenanceModeUpdate
from app.services.platform_settings_service import PlatformSettingsService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/maintenance")
def get_maintenance_mode(
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[MaintenanceModeData]:
    service = PlatformSettingsService(db)
    raw = service.get_maintenance_mode()
    return Envelope(
        data=MaintenanceModeData(
            enabled=bool(raw.get("enabled")),
            message_ar=str(raw.get("message_ar") or ""),
            message_en=str(raw.get("message_en") or ""),
            estimated_return=str(raw.get("estimated_return") or ""),
        ),
        meta=to_meta(request_id),
    )


@router.put("/maintenance")
def update_maintenance_mode(
    payload: MaintenanceModeUpdate,
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[MaintenanceModeData]:
    service = PlatformSettingsService(db)
    update: dict = {"enabled": payload.enabled}
    if payload.message_ar is not None:
        update["message_ar"] = payload.message_ar
    if payload.message_en is not None:
        update["message_en"] = payload.message_en
    if payload.estimated_return is not None:
        update["estimated_return"] = payload.estimated_return

    raw = service.set_maintenance_mode(update)
    return Envelope(
        data=MaintenanceModeData(
            enabled=bool(raw.get("enabled")),
            message_ar=str(raw.get("message_ar") or ""),
            message_en=str(raw.get("message_en") or ""),
            estimated_return=str(raw.get("estimated_return") or ""),
        ),
        meta=to_meta(request_id),
    )
