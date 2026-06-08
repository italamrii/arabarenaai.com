from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

AttachmentKind = Literal["image", "pdf"]

IMAGE_MIME_TYPES = frozenset(
    {"image/png", "image/jpeg", "image/jpg", "image/webp"},
)
PDF_MIME_TYPE = "application/pdf"
ALLOWED_MIME_TYPES = IMAGE_MIME_TYPES | {PDF_MIME_TYPE}

MIME_TO_EXTENSION = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


@dataclass(frozen=True)
class AttachmentInput:
    mime_type: str
    filename: str
    size_bytes: int
    data: bytes

    @property
    def kind(self) -> AttachmentKind:
        if self.mime_type == PDF_MIME_TYPE:
            return "pdf"
        return "image"


def normalize_mime_type(raw: str) -> str:
    value = raw.strip().lower()
    if value == "image/jpg":
        return "image/jpeg"
    return value
