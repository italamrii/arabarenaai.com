"""Idempotent database patches applied once on app startup."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.model import AIModel
from app.observability.logging_config import log_event

logger = logging.getLogger(__name__)

CLAUDE_TARGET_KEY = "claude-sonnet-4-6"
CLAUDE_LEGACY_KEYS = (
    "claude-sonnet-4-0",
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
)
CLAUDE_NAME_AR = "Claude Sonnet 4.6"
CLAUDE_NAME_EN = "Claude Sonnet 4.6"


def _patch_claude_model_key(db: Session) -> None:
    """Rename legacy Claude model keys in-place (same row id, no duplicates)."""
    target_model = db.scalar(select(AIModel).where(AIModel.key == CLAUDE_TARGET_KEY))
    if target_model is not None:
        log_event(
            logger,
            "startup.patch.claude_model_key.skipped",
            reason="already_at_target",
            model_id=str(target_model.id),
            target_key=CLAUDE_TARGET_KEY,
        )
        return

    for legacy_key in CLAUDE_LEGACY_KEYS:
        legacy_model = db.scalar(select(AIModel).where(AIModel.key == legacy_key))
        if legacy_model is None:
            continue

        conflict = db.scalar(
            select(AIModel).where(
                AIModel.key == CLAUDE_TARGET_KEY,
                AIModel.id != legacy_model.id,
            )
        )
        if conflict is not None:
            log_event(
                logger,
                "startup.patch.claude_model_key.skipped",
                reason="target_key_exists_on_other_row",
                legacy_key=legacy_key,
                legacy_model_id=str(legacy_model.id),
                existing_model_id=str(conflict.id),
            )
            return

        model_id = str(legacy_model.id)
        previous_key = legacy_model.key
        legacy_model.key = CLAUDE_TARGET_KEY
        legacy_model.name_ar = CLAUDE_NAME_AR
        legacy_model.name_en = CLAUDE_NAME_EN
        db.commit()

        log_event(
            logger,
            "startup.patch.claude_model_key.applied",
            model_id=model_id,
            old_key=previous_key,
            new_key=CLAUDE_TARGET_KEY,
            name_ar=CLAUDE_NAME_AR,
            name_en=CLAUDE_NAME_EN,
        )
        return

    log_event(
        logger,
        "startup.patch.claude_model_key.skipped",
        reason="legacy_key_not_found",
        legacy_keys=list(CLAUDE_LEGACY_KEYS),
        target_key=CLAUDE_TARGET_KEY,
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
