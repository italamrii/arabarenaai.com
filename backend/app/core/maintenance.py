"""Block public write traffic during maintenance unless admin secret is provided."""

from typing import Annotated

from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import AppError
from app.core.session_tokens import verify_admin_secret
from app.services.platform_settings_service import PlatformSettingsService
from sqlalchemy.orm import Session


def require_platform_available(
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[Session, Depends(get_db)],
    x_admin_secret: Annotated[str | None, Header(alias="X-Admin-Secret")] = None,
) -> None:
    if verify_admin_secret(x_admin_secret, settings.resolved_admin_api_secret):
        return

    service = PlatformSettingsService(db)
    if not service.is_maintenance_enabled():
        return

    maintenance = service.get_maintenance_mode()
    raise AppError(
        code="MAINTENANCE_MODE",
        message=str(maintenance.get("message_ar") or "المنصة قيد الصيانة حالياً"),
        message_en=str(maintenance.get("message_en") or "Platform is under maintenance"),
        status_code=503,
    )
