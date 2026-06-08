from __future__ import annotations

import base64

from app.domain.attachments import AttachmentInput


def attachment_to_base64(attachment: AttachmentInput) -> str:
    return base64.b64encode(attachment.data).decode("ascii")


def openai_user_content(prompt: str, attachment: AttachmentInput | None) -> str | list[dict]:
    if attachment is None:
        return prompt
    if attachment.kind == "image":
        encoded = attachment_to_base64(attachment)
        parts: list[dict] = []
        if prompt:
            parts.append({"type": "text", "text": prompt})
        parts.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{attachment.mime_type};base64,{encoded}"},
            }
        )
        return parts
    return prompt


def anthropic_user_content(prompt: str, attachment: AttachmentInput | None) -> str | list[dict]:
    if attachment is None:
        return prompt
    encoded = attachment_to_base64(attachment)
    blocks: list[dict] = []
    if prompt:
        blocks.append({"type": "text", "text": prompt})
    if attachment.kind == "image":
        blocks.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": attachment.mime_type,
                    "data": encoded,
                },
            }
        )
    else:
        blocks.append(
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": attachment.mime_type,
                    "data": encoded,
                },
            }
        )
    return blocks


def google_user_parts(prompt: str, attachment: AttachmentInput | None) -> list[dict]:
    parts: list[dict] = []
    if prompt:
        parts.append({"text": prompt})
    if attachment is None:
        return parts
    encoded = attachment_to_base64(attachment)
    parts.append({"inlineData": {"mimeType": attachment.mime_type, "data": encoded}})
    return parts
