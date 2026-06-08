"""Reusable admin authorization for protected operational endpoints."""

from typing import Annotated

from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.exceptions import ForbiddenAppError, UnauthorizedAppError
from app.core.session_tokens import verify_admin_secret


def require_admin_access(
    settings: Annotated[Settings, Depends(get_settings)],
    x_admin_secret: Annotated[str | None, Header(alias="X-Admin-Secret")] = None,
) -> None:
    """Allow access when X-Admin-Secret matches configured admin API secret."""
    expected = settings.resolved_admin_api_secret
    if not expected:
        raise UnauthorizedAppError(
            message="إعدادات الإدارة غير مكتملة",
            message_en="Admin API secret is not configured",
        )
    if not verify_admin_secret(x_admin_secret, expected):
        raise ForbiddenAppError(
            message="غير مصرح بالوصول إلى هذه البيانات",
            message_en="Admin authorization required",
        )


AdminAccess = Annotated[None, Depends(require_admin_access)]
