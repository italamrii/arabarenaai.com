"""Mark comparisons stuck in running/pending as failed after timeout."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings
from app.models.comparison import Comparison
from app.observability.logging_config import log_event

logger = logging.getLogger(__name__)


def sweep_stuck_comparisons(db: Session, settings: Settings) -> int:
    timeout_minutes = settings.comparison_running_timeout_minutes
    cutoff = datetime.now(UTC) - timedelta(minutes=timeout_minutes)

    stmt = (
        select(Comparison)
        .options(joinedload(Comparison.responses))
        .where(
            Comparison.status.in_(("pending", "running")),
            Comparison.created_at < cutoff,
        )
    )
    stuck = list(db.scalars(stmt).all())
    if not stuck:
        return 0

    for comparison in stuck:
        comparison.status = "failed"
        comparison.completed_at = datetime.now(UTC)
        for response in comparison.responses:
            if response.status in ("pending", "running"):
                response.status = "error"
                response.error_message = response.error_message or "انتهت مهلة المعالجة"
                response.completed_at = datetime.now(UTC)

    db.commit()
    log_event(
        logger,
        "comparison.watchdog.swept",
        count=len(stuck),
        timeout_minutes=timeout_minutes,
        comparison_ids=[str(item.id) for item in stuck],
    )
    return len(stuck)
