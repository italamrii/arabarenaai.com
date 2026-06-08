import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.dependencies import DbSession, RequestId, rate_limit_comparisons
from app.schemas.common import Envelope, to_meta
from app.schemas.upload import UploadOut
from app.services.upload_service import UploadService

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_upload(
    db: DbSession,
    request_id: RequestId,
    session_id: Annotated[str, Depends(rate_limit_comparisons)],
    file: UploadFile = File(...),
) -> Envelope[UploadOut]:
    settings = get_settings()
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
) -> FileResponse:
    settings = get_settings()
    service = UploadService(db, settings)
    try:
        parsed = uuid.UUID(upload_id)
    except ValueError as exc:
        from app.core.exceptions import NotFoundAppError

        raise NotFoundAppError(
            message="الملف غير موجود",
            message_en="Upload not found",
        ) from exc

    row = service.get_upload(parsed)
    path = settings.upload_dir_path / row.storage_key
    if not path.is_file():
        from app.core.exceptions import NotFoundAppError

        raise NotFoundAppError(
            message="الملف غير موجود",
            message_en="Upload file missing",
        )
    return FileResponse(path, media_type=row.mime_type, filename=row.original_filename)
