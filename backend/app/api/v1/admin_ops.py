from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.admin_auth import require_admin_access
from app.core.dependencies import DbSession, RequestId
from app.schemas.common import Envelope, to_meta
from app.schemas.control_center import (
    ModelControlItem,
    ModelControlUpdate,
    ModelControlsData,
    ProviderControlItem,
    ProviderControlUpdate,
    ProviderControlsData,
)
from app.schemas.platform import MaintenanceModeData, MaintenanceModeUpdate
from app.services.control_center_service import ControlCenterService
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


@router.get("/provider-controls")
def get_provider_controls(
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[ProviderControlsData]:
    service = ControlCenterService(db)
    return Envelope(data=service.get_provider_controls(), meta=to_meta(request_id))


@router.put("/provider-controls")
def update_provider_controls(
    payload: ProviderControlUpdate,
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[ProviderControlItem]:
    service = ControlCenterService(db)
    item = service.update_provider_control(
        provider_key=payload.provider_key,
        enabled=payload.enabled,
    )
    return Envelope(data=item, meta=to_meta(request_id))


@router.get("/model-controls")
def get_model_controls(
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[ModelControlsData]:
    service = ControlCenterService(db)
    return Envelope(data=service.get_model_controls(), meta=to_meta(request_id))


@router.put("/model-controls")
def update_model_controls(
    payload: ModelControlUpdate,
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[ModelControlItem]:
    service = ControlCenterService(db)
    item = service.update_model_control(model_key=payload.model_key, enabled=payload.enabled)
    return Envelope(data=item, meta=to_meta(request_id))
