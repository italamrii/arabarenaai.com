from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import TypeVar

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.comparison import Comparison, ComparisonTarget
from app.models.model import AIModel
from app.models.provider import Provider
from app.models.response import ModelResponse
from app.models.session_presence import SessionPresence
from app.models.upload import Upload
from app.models.vote import Vote
from app.observability.logging_config import log_event
from app.schemas.admin_stats import (
    AdminStatsData,
    ComparisonStatsOut,
    ModelSelectionOut,
    ProviderExecutionOut,
    ProviderUsageOut,
    RecentActivityOut,
    RecentErrorOut,
    UploadStatsOut,
    UsageSignalsOut,
    VotePreferenceOut,
)

logger = logging.getLogger(__name__)
T = TypeVar("T")


def _safe_error_fields(content_structured: dict | None) -> tuple[str | None, str | None]:
    if not content_structured or not isinstance(content_structured, dict):
        return None, None
    error_code = content_structured.get("error_code")
    request_id = content_structured.get("request_id")
    return (
        str(error_code) if error_code else None,
        str(request_id) if request_id else None,
    )


def _utc_today_start() -> datetime:
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)


class AdminStatsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_stats(self) -> AdminStatsData:
        return AdminStatsData(
            comparisons=self._comparison_stats(),
            uploads=self._upload_stats(),
            total_votes=self._total_votes(),
            most_selected_models=self._most_selected_models(),
            provider_execution=self._provider_execution(),
            vote_preferences=self._vote_preferences(),
            recent_errors=self._recent_errors(),
            recent_activity=self._recent_activity(),
            usage_signals=self._usage_signals(),
        )

    def _safe_metric(self, name: str, fn: Callable[[], T], default: T) -> T:
        try:
            return fn()
        except Exception as exc:
            log_event(
                logger,
                "admin_stats.metric_failed",
                level=logging.WARNING,
                metric=name,
                exc_info=exc,
            )
            return default

    def _usage_signals(self) -> UsageSignalsOut:
        return UsageSignalsOut(
            online_now_5m=self._safe_metric(
                "online_now_5m",
                self._online_now_5m,
                None,
            ),
            active_sessions_15m=self._safe_metric(
                "active_sessions_15m",
                self._active_sessions_15m,
                None,
            ),
            visitors_today=self._safe_metric(
                "visitors_today",
                self._visitors_today,
                None,
            ),
            comparisons_today=self._safe_metric(
                "comparisons_today",
                self._comparisons_today,
                None,
            ),
            votes_today=self._safe_metric("votes_today", self._votes_today, None),
            uploads_today=self._safe_metric("uploads_today", self._uploads_today, None),
            attachments_today=self._safe_metric(
                "attachments_today",
                self._attachments_today,
                None,
            ),
            model_responses_today=self._safe_metric(
                "model_responses_today",
                self._model_responses_today,
                None,
            ),
            most_used_models_today=self._safe_metric(
                "most_used_models_today",
                self._most_used_models_today,
                [],
            ),
            most_used_providers_today=self._safe_metric(
                "most_used_providers_today",
                self._most_used_providers_today,
                [],
            ),
            failed_comparisons_today=self._safe_metric(
                "failed_comparisons_today",
                self._failed_comparisons_today,
                None,
            ),
            average_response_time_today=self._safe_metric(
                "average_response_time_today",
                self._average_response_time_today,
                None,
            ),
            total_input_tokens_today=self._safe_metric(
                "total_input_tokens_today",
                self._total_input_tokens_today,
                None,
            ),
            total_output_tokens_today=self._safe_metric(
                "total_output_tokens_today",
                self._total_output_tokens_today,
                None,
            ),
        )

    def _online_now_5m(self) -> int:
        cutoff = datetime.now(UTC) - timedelta(minutes=5)
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(SessionPresence)
                .where(SessionPresence.last_seen_at >= cutoff)
            )
            or 0
        )

    def _active_sessions_15m(self) -> int:
        cutoff = datetime.now(UTC) - timedelta(minutes=15)
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(SessionPresence)
                .where(SessionPresence.last_seen_at >= cutoff)
            )
            or 0
        )

    def _visitors_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(SessionPresence)
                .where(SessionPresence.first_seen_at >= today_start)
            )
            or 0
        )

    def _comparisons_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(Comparison)
                .where(Comparison.created_at >= today_start)
            )
            or 0
        )

    def _votes_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count()).select_from(Vote).where(Vote.created_at >= today_start)
            )
            or 0
        )

    def _uploads_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count()).select_from(Upload).where(Upload.created_at >= today_start)
            )
            or 0
        )

    def _attachments_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(Comparison)
                .where(
                    Comparison.created_at >= today_start,
                    Comparison.upload_id.is_not(None),
                )
            )
            or 0
        )

    def _model_responses_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(ModelResponse)
                .where(
                    or_(
                        ModelResponse.created_at >= today_start,
                        ModelResponse.completed_at >= today_start,
                    )
                )
            )
            or 0
        )

    def _most_used_models_today(self, limit: int = 8) -> list[ModelSelectionOut]:
        today_start = _utc_today_start()
        rows = self.db.execute(
            select(
                AIModel.id,
                AIModel.name_ar,
                Provider.key,
                func.count(ComparisonTarget.id).label("usage_count"),
            )
            .join(ComparisonTarget, ComparisonTarget.model_id == AIModel.id)
            .join(Comparison, Comparison.id == ComparisonTarget.comparison_id)
            .join(Provider, Provider.id == AIModel.provider_id)
            .where(Comparison.created_at >= today_start)
            .group_by(AIModel.id, Provider.key)
            .order_by(func.count(ComparisonTarget.id).desc())
            .limit(limit)
        ).all()
        return [
            ModelSelectionOut(
                model_id=str(row[0]),
                model_name_ar=str(row[1]),
                provider_key=str(row[2]),
                selection_count=int(row[3]),
            )
            for row in rows
        ]

    def _most_used_providers_today(self, limit: int = 8) -> list[ProviderUsageOut]:
        today_start = _utc_today_start()
        rows = self.db.execute(
            select(
                Provider.key,
                Provider.name_ar,
                func.count(ComparisonTarget.id).label("usage_count"),
            )
            .join(AIModel, AIModel.provider_id == Provider.id)
            .join(ComparisonTarget, ComparisonTarget.model_id == AIModel.id)
            .join(Comparison, Comparison.id == ComparisonTarget.comparison_id)
            .where(Comparison.created_at >= today_start)
            .group_by(Provider.id)
            .order_by(func.count(ComparisonTarget.id).desc())
            .limit(limit)
        ).all()
        return [
            ProviderUsageOut(
                provider_key=str(row[0]),
                provider_name_ar=str(row[1]),
                usage_count=int(row[2]),
            )
            for row in rows
        ]

    def _failed_comparisons_today(self) -> int:
        today_start = _utc_today_start()
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(Comparison)
                .where(
                    Comparison.created_at >= today_start,
                    Comparison.status == "failed",
                )
            )
            or 0
        )

    def _average_response_time_today(self) -> float | None:
        today_start = _utc_today_start()
        avg_ms = self.db.scalar(
            select(func.avg(ModelResponse.response_time_ms)).where(
                ModelResponse.status == "success",
                ModelResponse.response_time_ms.is_not(None),
                or_(
                    ModelResponse.created_at >= today_start,
                    ModelResponse.completed_at >= today_start,
                ),
            )
        )
        return round(float(avg_ms), 1) if avg_ms is not None else None

    def _total_input_tokens_today(self) -> int | None:
        today_start = _utc_today_start()
        total = self.db.scalar(
            select(func.coalesce(func.sum(ModelResponse.input_tokens), 0)).where(
                ModelResponse.input_tokens.is_not(None),
                or_(
                    ModelResponse.created_at >= today_start,
                    ModelResponse.completed_at >= today_start,
                ),
            )
        )
        return int(total) if total is not None else None

    def _total_output_tokens_today(self) -> int | None:
        today_start = _utc_today_start()
        total = self.db.scalar(
            select(func.coalesce(func.sum(ModelResponse.output_tokens), 0)).where(
                ModelResponse.output_tokens.is_not(None),
                or_(
                    ModelResponse.created_at >= today_start,
                    ModelResponse.completed_at >= today_start,
                ),
            )
        )
        return int(total) if total is not None else None

    def _comparison_stats(self) -> ComparisonStatsOut:
        status_rows = self.db.execute(
            select(Comparison.status, func.count()).group_by(Comparison.status)
        ).all()
        counts = {str(row[0]): int(row[1]) for row in status_rows}
        total = sum(counts.values())

        today_start = _utc_today_start()
        today = int(
            self.db.scalar(
                select(func.count()).select_from(Comparison).where(Comparison.created_at >= today_start)
            )
            or 0
        )

        avg_ms = self.db.scalar(
            select(func.avg(ModelResponse.response_time_ms)).where(
                ModelResponse.status == "success",
                ModelResponse.response_time_ms.is_not(None),
            )
        )

        return ComparisonStatsOut(
            total=total,
            completed=counts.get("completed", 0),
            partial=counts.get("partial", 0),
            failed=counts.get("failed", 0),
            pending=counts.get("pending", 0),
            today=today,
            avg_response_time_ms=round(float(avg_ms), 1) if avg_ms is not None else None,
        )

    def _upload_stats(self) -> UploadStatsOut:
        today_start = _utc_today_start()
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
        return UploadStatsOut(total=total, today=today, images=images, pdfs=pdfs)

    def _total_votes(self) -> int:
        return int(self.db.scalar(select(func.count(Vote.id))) or 0)

    def _most_selected_models(self, limit: int = 8) -> list[ModelSelectionOut]:
        rows = self.db.execute(
            select(
                AIModel.id,
                AIModel.name_ar,
                Provider.key,
                func.count(ComparisonTarget.id).label("selection_count"),
            )
            .join(ComparisonTarget, ComparisonTarget.model_id == AIModel.id)
            .join(Provider, Provider.id == AIModel.provider_id)
            .group_by(AIModel.id, Provider.key)
            .order_by(func.count(ComparisonTarget.id).desc())
            .limit(limit)
        ).all()

        return [
            ModelSelectionOut(
                model_id=str(row[0]),
                model_name_ar=str(row[1]),
                provider_key=str(row[2]),
                selection_count=int(row[3]),
            )
            for row in rows
        ]

    def _provider_execution(self) -> list[ProviderExecutionOut]:
        selection_rows = self.db.execute(
            select(
                Provider.key,
                Provider.name_ar,
                func.count(ComparisonTarget.id).label("selection_count"),
            )
            .join(AIModel, AIModel.provider_id == Provider.id)
            .join(ComparisonTarget, ComparisonTarget.model_id == AIModel.id)
            .group_by(Provider.id)
        ).all()
        selection_map = {
            str(row[0]): (str(row[1]), int(row[2])) for row in selection_rows
        }

        response_rows = self.db.execute(
            select(
                Provider.key,
                Provider.name_ar,
                func.sum(case((ModelResponse.status == "success", 1), else_=0)).label("success_count"),
                func.sum(case((ModelResponse.status == "error", 1), else_=0)).label("error_count"),
                func.avg(
                    case(
                        (
                            ModelResponse.status == "success",
                            ModelResponse.response_time_ms,
                        ),
                        else_=None,
                    )
                ).label("avg_ms"),
            )
            .join(AIModel, AIModel.provider_id == Provider.id)
            .join(ModelResponse, ModelResponse.model_id == AIModel.id)
            .group_by(Provider.id)
        ).all()

        items: list[ProviderExecutionOut] = []
        seen: set[str] = set()

        for row in response_rows:
            key = str(row[0])
            seen.add(key)
            success_count = int(row[2] or 0)
            error_count = int(row[3] or 0)
            terminal = success_count + error_count
            selection_count = selection_map.get(key, (str(row[1]), 0))[1]
            avg_ms = row[4]
            items.append(
                ProviderExecutionOut(
                    provider_key=key,
                    provider_name_ar=str(row[1]),
                    selection_count=selection_count,
                    success_count=success_count,
                    error_count=error_count,
                    success_rate=round(success_count / terminal, 3) if terminal > 0 else None,
                    avg_response_time_ms=round(float(avg_ms), 1) if avg_ms is not None else None,
                )
            )

        for key, (name_ar, selection_count) in selection_map.items():
            if key not in seen:
                items.append(
                    ProviderExecutionOut(
                        provider_key=key,
                        provider_name_ar=name_ar,
                        selection_count=selection_count,
                        success_count=0,
                        error_count=0,
                        success_rate=None,
                        avg_response_time_ms=None,
                    )
                )

        items.sort(key=lambda item: item.selection_count, reverse=True)
        return items

    def _vote_preferences(self, limit: int = 8) -> list[VotePreferenceOut]:
        rows = self.db.execute(
            select(
                AIModel.id,
                AIModel.name_ar,
                Provider.key,
                func.count(Vote.id).label("vote_count"),
            )
            .join(ModelResponse, ModelResponse.model_id == AIModel.id)
            .join(Vote, Vote.response_id == ModelResponse.id)
            .join(Provider, Provider.id == AIModel.provider_id)
            .where(ModelResponse.status == "success")
            .group_by(AIModel.id, Provider.key)
            .order_by(func.count(Vote.id).desc())
            .limit(limit)
        ).all()

        return [
            VotePreferenceOut(
                model_id=str(row[0]),
                model_name_ar=str(row[1]),
                provider_key=str(row[2]),
                vote_count=int(row[3]),
            )
            for row in rows
        ]

    def _recent_errors(self, limit: int = 15) -> list[RecentErrorOut]:
        stmt = (
            select(ModelResponse)
            .options(
                joinedload(ModelResponse.comparison),
            )
            .where(ModelResponse.status == "error")
            .order_by(ModelResponse.completed_at.desc().nullslast(), ModelResponse.created_at.desc())
            .limit(limit)
        )
        responses = list(self.db.scalars(stmt).unique().all())

        model_ids = [response.model_id for response in responses if response.model_id]
        models_by_id: dict = {}
        if model_ids:
            model_rows = self.db.scalars(
                select(AIModel)
                .join(Provider)
                .options(joinedload(AIModel.provider))
                .where(AIModel.id.in_(model_ids))
            ).unique().all()
            models_by_id = {model.id: model for model in model_rows}

        items: list[RecentErrorOut] = []
        for response in responses:
            model = models_by_id.get(response.model_id) if response.model_id else None
            error_code, request_id = _safe_error_fields(response.content_structured)
            occurred = response.completed_at or response.created_at
            items.append(
                RecentErrorOut(
                    occurred_at=occurred.isoformat() if occurred else "",
                    provider_key=model.provider.key if model and model.provider else None,
                    provider_name_ar=model.provider.name_ar if model and model.provider else None,
                    model_name_ar=model.name_ar if model else None,
                    error_message_ar=response.error_message,
                    error_code=error_code,
                    request_id=request_id,
                )
            )
        return items

    def _recent_activity(self, limit: int = 12) -> list[RecentActivityOut]:
        comparisons = list(
            self.db.scalars(
                select(Comparison).order_by(Comparison.created_at.desc()).limit(limit)
            ).all()
        )

        return [
            RecentActivityOut(
                occurred_at=comparison.created_at.isoformat(),
                activity_type="مقارنة",
                status=comparison.status,
            )
            for comparison in comparisons
        ]
