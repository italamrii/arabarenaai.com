"""Temporary development-only debug routes. Do not expose in production."""

from __future__ import annotations

import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import DbSession
from app.core.exceptions import NotFoundAppError
from app.models.response import ModelResponse

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/comparison/{comparison_id}")
def debug_comparison_responses(
    comparison_id: str,
    db: DbSession,
) -> dict:
    """Return raw ModelResponse rows for a comparison (unsanitized content_structured)."""
    try:
        parsed_id = uuid.UUID(comparison_id)
    except ValueError as exc:
        raise NotFoundAppError(
            message="المقارنة غير موجودة",
            message_en="Comparison not found",
        ) from exc

    stmt = (
        select(ModelResponse)
        .where(ModelResponse.comparison_id == parsed_id)
        .order_by(ModelResponse.created_at)
    )
    rows = list(db.scalars(stmt).all())
    if not rows:
        raise NotFoundAppError(
            message="المقارنة غير موجودة",
            message_en="Comparison not found",
        )

    return {
        "comparison_id": str(parsed_id),
        "responses": [
            {
                "response_id": str(row.id),
                "status": row.status,
                "error_message": row.error_message,
                "content_structured": row.content_structured,
            }
            for row in rows
        ],
    }
