"""Idempotent database patches applied once on app startup."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.model import AIModel
from app.observability.logging_config import log_event

logger = logging.getLogger(__name__)

CLAUDE_OLD_KEY = "claude-3-5-sonnet-20241022"
CLAUDE_NEW_KEY = "claude-sonnet-4-20250514"
CLAUDE_NAME_AR = "Claude Sonnet 4"
CLAUDE_NAME_EN = "Claude Sonnet 4"


def _patch_claude_model_key(db: Session) -> None:
    """Rename legacy Claude model key in-place (same row id, no duplicates)."""
    old_model = db.scalar(select(AIModel).where(AIModel.key == CLAUDE_OLD_KEY))
    if old_model is None:
        log_event(
            logger,
            "startup.patch.claude_model_key.skipped",
            reason="old_key_not_found",
            old_key=CLAUDE_OLD_KEY,
        )
        return

    conflict = db.scalar(
        select(AIModel).where(AIModel.key == CLAUDE_NEW_KEY, AIModel.id != old_model.id)
    )
    if conflict is not None:
        log_event(
            logger,
            "startup.patch.claude_model_key.skipped",
            reason="new_key_exists_on_other_row",
            old_model_id=str(old_model.id),
            existing_model_id=str(conflict.id),
        )
        return

    model_id = str(old_model.id)
    previous_key = old_model.key
    old_model.key = CLAUDE_NEW_KEY
    old_model.name_ar = CLAUDE_NAME_AR
    old_model.name_en = CLAUDE_NAME_EN
    db.commit()

    log_event(
        logger,
        "startup.patch.claude_model_key.applied",
        model_id=model_id,
        old_key=previous_key,
        new_key=CLAUDE_NEW_KEY,
        name_ar=CLAUDE_NAME_AR,
        name_en=CLAUDE_NAME_EN,
    )


def apply_startup_patches() -> None:
    db = SessionLocal()
    try:
        log_event(logger, "startup.patches.begin")
        _patch_claude_model_key(db)
        log_event(logger, "startup.patches.complete")
    except Exception as exc:
        db.rollback()
        log_event(
            logger,
            "startup.patches.failed",
            level=logging.ERROR,
            exc_info=exc,
            error_type=type(exc).__name__,
        )
        raise
    finally:
        db.close()
