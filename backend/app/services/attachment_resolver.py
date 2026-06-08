from __future__ import annotations

from dataclasses import dataclass

from app.domain.attachments import AttachmentInput
from app.services.upload_service import extract_pdf_text

IMAGE_UNSUPPORTED_AR = "هذا النموذج لا يدعم تحليل الصور حالياً"
PDF_UNSUPPORTED_PREFIX_AR = "محتوى الملف المرفق (PDF):\n\n"

# Provider attachment capabilities for Phase 1
PROVIDER_CAPABILITIES: dict[str, dict[str, bool]] = {
    "openai": {"image": True, "pdf": False},
    "anthropic": {"image": True, "pdf": True},
    "google": {"image": True, "pdf": True},
    "xai": {"image": False, "pdf": False},
    "deepseek": {"image": False, "pdf": False},
    "qwen": {"image": True, "pdf": False},
    "allam": {"image": False, "pdf": False},
}


@dataclass(frozen=True)
class ResolvedAttachment:
    prompt: str
    attachment: AttachmentInput | None
    unsupported_image: bool = False


def provider_supports(provider_key: str, kind: str) -> bool:
    caps = PROVIDER_CAPABILITIES.get(provider_key, {})
    return bool(caps.get(kind))


def resolve_for_provider(
    *,
    prompt: str,
    attachment: AttachmentInput | None,
    provider_key: str,
) -> ResolvedAttachment:
    base_prompt = prompt.strip()

    if attachment is None:
        return ResolvedAttachment(prompt=base_prompt, attachment=None)

    if attachment.kind == "image":
        if provider_supports(provider_key, "image"):
            return ResolvedAttachment(prompt=base_prompt or "حلّل المرفق المرفق.", attachment=attachment)
        return ResolvedAttachment(
            prompt=base_prompt,
            attachment=None,
            unsupported_image=True,
        )

    if provider_supports(provider_key, "pdf"):
        return ResolvedAttachment(
            prompt=base_prompt or "حلّل الملف المرفق.",
            attachment=attachment,
        )

    extracted = extract_pdf_text(attachment.data)
    merged = f"{base_prompt}\n\n{PDF_UNSUPPORTED_PREFIX_AR}{extracted}".strip()
    return ResolvedAttachment(prompt=merged, attachment=None)
