"""Idempotent database patches applied once on app startup."""

import logging
from pathlib import Path

from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.model import AIModel
from app.observability.logging_config import log_event

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_SQL_PATH = BACKEND_ROOT / "scripts" / "add_uploads.sql"
PLATFORM_SETTINGS_SQL_PATH = BACKEND_ROOT / "scripts" / "add_platform_settings.sql"

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


def _parse_sql_file(sql_path: Path) -> list[str]:
    """Load SQL statements from file, ignoring blank lines and -- comments."""
    raw = sql_path.read_text(encoding="utf-8")
    lines: list[str] = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        lines.append(line)

    statements: list[str] = []
    for part in "\n".join(lines).split(";"):
        stmt = part.strip()
        if stmt:
            statements.append(stmt)
    return statements


def _patch_uploads_schema(db: Session) -> None:
    """Apply backend/scripts/add_uploads.sql (idempotent uploads schema repair)."""
    sql_path = UPLOADS_SQL_PATH
    if not sql_path.is_file():
        raise FileNotFoundError(f"Uploads migration SQL not found: {sql_path}")

    bind = db.get_bind()
    uploads_existed = inspect(bind).has_table("uploads")

    for stmt in _parse_sql_file(sql_path):
        db.execute(text(stmt))
    db.commit()

    log_event(
        logger,
        "startup.patch.uploads_schema.applied",
        uploads_existed_before=uploads_existed,
        uploads_exists_after=inspect(bind).has_table("uploads"),
        sql_path=str(sql_path),
    )


def _patch_platform_settings_schema(db: Session) -> None:
    sql_path = PLATFORM_SETTINGS_SQL_PATH
    if not sql_path.is_file():
        raise FileNotFoundError(f"Platform settings SQL not found: {sql_path}")

    bind = db.get_bind()
    existed = inspect(bind).has_table("platform_settings")

    for stmt in _parse_sql_file(sql_path):
        db.execute(text(stmt))
    db.commit()

    log_event(
        logger,
        "startup.patch.platform_settings.applied",
        existed_before=existed,
        exists_after=inspect(bind).has_table("platform_settings"),
        sql_path=str(sql_path),
    )


def apply_startup_patches() -> None:
    db = SessionLocal()
    try:
        log_event(logger, "startup.patches.begin")
        _patch_uploads_schema(db)
        _patch_platform_settings_schema(db)
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
