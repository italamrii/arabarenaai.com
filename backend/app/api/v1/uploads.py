import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Header, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.dependencies import DbSession, OptionalSessionId, RequestId, rate_limit_comparisons
from app.core.maintenance import require_platform_available
from app.core.exceptions import ForbiddenAppError, NotFoundAppError
from app.core.session_tokens import verify_admin_secret
from app.schemas.common import Envelope, to_meta
from app.schemas.upload import UploadOut
from app.services.presence_service import PresenceService
from app.services.upload_service import UploadService

router = APIRouter(prefix="/uploads", tags=["uploads"])


def _is_admin_request(x_admin_secret: str | None) -> bool:
    settings = get_settings()
    return verify_admin_secret(x_admin_secret, settings.resolved_admin_api_secret)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_upload(
    request: Request,
    db: DbSession,
    request_id: RequestId,
    session_id: Annotated[str, Depends(rate_limit_comparisons)],
    _platform: Annotated[None, Depends(require_platform_available)],
    file: UploadFile = File(...),
) -> Envelope[UploadOut]:
    settings = get_settings()
    PresenceService.touch_from_request(
        db,
        session_id=session_id,
        request=request,
        path="/uploads",
    )
    service = UploadService(db, settings)
    data = await file.read()
    row = service.create_upload(
        session_id=session_id,
        filename=file.filename or "upload",
        mime_type=file.content_type or "application/octet-stream",
        data=data,
    )
    return Envelope(
        data=UploadOut(
            id=str(row.id),
            url=service.public_url(row.id),
            mime_type=row.mime_type,
            size=row.size_bytes,
            filename=row.original_filename,
        ),
        meta=to_meta(request_id),
    )


@router.get("/{upload_id}")
def get_upload_file(
    upload_id: str,
    db: DbSession,
    request_id: RequestId,
    session_id: OptionalSessionId,
    x_admin_secret: Annotated[str | None, Header(alias="X-Admin-Secret")] = None,
) -> FileResponse:
    settings = get_settings()
    service = UploadService(db, settings)
    try:
        parsed = uuid.UUID(upload_id)
    except ValueError as exc:
        raise NotFoundAppError(
            message="الملف غير موجود",
            message_en="Upload not found",
        ) from exc

    row = service.get_upload(parsed)
    if not _is_admin_request(x_admin_secret):
        if not session_id:
            raise ForbiddenAppError(
                message="غير مصرح بتنزيل هذا الملف",
                message_en="Session required to download this upload",
            )
        if row.session_id != session_id:
            raise ForbiddenAppError(
                message="غير مصرح بتنزيل هذا الملف",
                message_en="You do not have access to this upload",
            )

    path = settings.upload_dir_path / row.storage_key
    if not path.is_file():
        raise NotFoundAppError(
            message="الملف غير موجود",
            message_en="Upload file missing",
        )
    return FileResponse(path, media_type=row.mime_type, filename=row.original_filename)
