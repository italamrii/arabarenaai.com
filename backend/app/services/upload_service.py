from __future__ import annotations

import uuid
from io import BytesIO
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import NotFoundAppError, ValidationAppError
from app.domain.attachments import (
    ALLOWED_MIME_TYPES,
    MIME_TO_EXTENSION,
    AttachmentInput,
    normalize_mime_type,
)
from app.models.upload import Upload


class UploadService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def create_upload(
        self,
        *,
        session_id: str,
        filename: str,
        mime_type: str,
        data: bytes,
    ) -> Upload:
        normalized_mime = normalize_mime_type(mime_type)
        if normalized_mime not in ALLOWED_MIME_TYPES:
            raise ValidationAppError(
                message="نوع الملف غير مدعوم. المسموح: PNG, JPG, WEBP, PDF",
                message_en="Unsupported file type",
                details=[{"field": "file", "issue": "unsupported_type"}],
            )

        if not data:
            raise ValidationAppError(
                message="الملف فارغ أو تالف",
                message_en="Empty upload",
                details=[{"field": "file", "issue": "empty"}],
            )

        max_bytes = self.settings.max_upload_bytes
        if len(data) > max_bytes:
            raise ValidationAppError(
                message="حجم الملف يتجاوز ٢٠ ميجابايت",
                message_en="File too large",
                details=[{"field": "file", "issue": "too_large", "max": max_bytes}],
            )

        upload_id = uuid.uuid4()
        extension = MIME_TO_EXTENSION.get(normalized_mime, "")
        storage_key = f"{upload_id}{extension}"
        storage_path = self.upload_dir / storage_key
        storage_path.write_bytes(data)

        row = Upload(
            id=upload_id,
            session_id=session_id,
            original_filename=filename[:255],
            mime_type=normalized_mime,
            size_bytes=len(data),
            storage_key=storage_key,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def get_upload(self, upload_id: uuid.UUID, *, session_id: str | None = None) -> Upload:
        row = self.db.get(Upload, upload_id)
        if row is None:
            raise NotFoundAppError(
                message="الملف غير موجود",
                message_en="Upload not found",
            )
        if session_id and row.session_id != session_id:
            raise NotFoundAppError(
                message="الملف غير موجود",
                message_en="Upload not found",
            )
        return row

    def load_attachment(self, upload_id: uuid.UUID) -> AttachmentInput:
        row = self.get_upload(upload_id)
        storage_path = self.upload_dir / row.storage_key
        if not storage_path.is_file():
            raise NotFoundAppError(
                message="تعذر قراءة الملف المرفوع",
                message_en="Upload file missing on storage",
            )
        return AttachmentInput(
            mime_type=row.mime_type,
            filename=row.original_filename,
            size_bytes=row.size_bytes,
            data=storage_path.read_bytes(),
        )

    def public_url(self, upload_id: uuid.UUID) -> str:
        return f"/v1/uploads/{upload_id}"

    def upload_metrics(self) -> dict[str, int]:
        from datetime import UTC, datetime

        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        total = int(self.db.scalar(select(func.count()).select_from(Upload)) or 0)
        today = int(
            self.db.scalar(
                select(func.count()).select_from(Upload).where(Upload.created_at >= today_start)
            )
            or 0
        )
        images = int(
            self.db.scalar(
                select(func.count())
                .select_from(Upload)
                .where(Upload.mime_type.in_(("image/png", "image/jpeg", "image/webp")))
            )
            or 0
        )
        pdfs = int(
            self.db.scalar(
                select(func.count())
                .select_from(Upload)
                .where(Upload.mime_type == "application/pdf")
            )
            or 0
        )
        return {
            "total": total,
            "today": today,
            "images": images,
            "pdfs": pdfs,
        }


def extract_pdf_text(data: bytes, *, max_chars: int = 12000) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF extraction unavailable") from exc

    reader = PdfReader(BytesIO(data))
    parts: list[str] = []
    for page in reader.pages[:30]:
        text = page.extract_text() or ""
        if text.strip():
            parts.append(text.strip())
        if sum(len(part) for part in parts) >= max_chars:
            break

    combined = "\n\n".join(parts).strip()
    if not combined:
        raise ValidationAppError(
            message="تعذر استخراج نص من ملف PDF",
            message_en="Could not extract PDF text",
        )
    return combined[:max_chars]
