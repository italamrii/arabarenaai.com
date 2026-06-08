from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.domain.model_pricing import estimate_response_cost_usd, get_model_pricing
from app.models.model import AIModel
from app.models.provider import Provider
from app.models.response import ModelResponse
from app.observability.logging_config import log_event
from app.schemas.admin_stats import (
    CostByModelOut,
    CostByProviderOut,
    CostTrackingOut,
    MissingPricingModelOut,
    MostExpensiveOut,
)

logger = logging.getLogger(__name__)


def _utc_today_start() -> datetime:
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)


def _utc_month_start() -> datetime:
    now = datetime.now(UTC)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _response_activity_at(
    created_at: datetime,
    completed_at: datetime | None,
) -> datetime:
    return completed_at or created_at


@dataclass
class _TokenRow:
    model_key: str
    model_name_ar: str
    provider_key: str
    provider_name_ar: str
    input_tokens: int | None
    output_tokens: int | None
    comparison_id: UUID
    activity_at: datetime


@dataclass
class _PeriodAccumulator:
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0
    priced_response_count: int = 0
    response_count: int = 0
    comparison_costs: dict[UUID, float] = field(default_factory=dict)
    seen_models: set[str] = field(default_factory=set)

    def add_row(self, row: _TokenRow) -> None:
        self.response_count += 1
        inp = row.input_tokens or 0
        out = row.output_tokens or 0
        if row.input_tokens is not None:
            self.input_tokens += inp
        if row.output_tokens is not None:
            self.output_tokens += out

        cost = estimate_response_cost_usd(
            model_key=row.model_key,
            input_tokens=row.input_tokens,
            output_tokens=row.output_tokens,
        )
        if cost is not None:
            self.estimated_cost_usd += cost
            self.priced_response_count += 1
            self.comparison_costs[row.comparison_id] = (
                self.comparison_costs.get(row.comparison_id, 0.0) + cost
            )
        self.seen_models.add(row.model_key)


class CostTrackingService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_cost_tracking(self) -> CostTrackingOut:
        try:
            return self._build_cost_tracking()
        except Exception as exc:
            log_event(
                logger,
                "admin_stats.metric_failed",
                level=logging.WARNING,
                metric="cost_tracking",
                exc_info=exc,
            )
            return CostTrackingOut()

    def _build_cost_tracking(self) -> CostTrackingOut:
        month_start = _utc_month_start()
        today_start = _utc_today_start()
        rows = self._fetch_token_rows(month_start)

        today_acc = _PeriodAccumulator()
        month_acc = _PeriodAccumulator()
        provider_today: dict[str, _PeriodAccumulator] = defaultdict(_PeriodAccumulator)
        model_today: dict[str, _PeriodAccumulator] = defaultdict(_PeriodAccumulator)
        provider_meta: dict[str, tuple[str, str]] = {}
        model_meta: dict[str, tuple[str, str, str]] = {}

        for row in rows:
            provider_meta[row.provider_key] = (row.provider_name_ar, row.provider_key)
            model_meta[row.model_key] = (
                row.model_name_ar,
                row.provider_key,
                row.model_key,
            )

            month_acc.add_row(row)
            if row.activity_at >= today_start:
                today_acc.add_row(row)
                provider_today[row.provider_key].add_row(row)
                model_today[row.model_key].add_row(row)

        missing_pricing = self._missing_pricing_models(rows)

        cost_by_provider_today = [
            CostByProviderOut(
                provider_key=key,
                provider_name_ar=provider_meta.get(key, (key, key))[0],
                estimated_cost_usd=_round_usd(acc.estimated_cost_usd) if acc.priced_response_count else None,
                input_tokens=acc.input_tokens,
                output_tokens=acc.output_tokens,
                response_count=acc.response_count,
            )
            for key, acc in sorted(
                provider_today.items(),
                key=lambda item: item[1].estimated_cost_usd,
                reverse=True,
            )
        ]

        cost_by_model_today = [
            CostByModelOut(
                model_key=key,
                model_name_ar=model_meta.get(key, (key, key, key))[0],
                provider_key=model_meta.get(key, ("", key, key))[1],
                estimated_cost_usd=_round_usd(acc.estimated_cost_usd) if acc.priced_response_count else None,
                input_tokens=acc.input_tokens,
                output_tokens=acc.output_tokens,
                response_count=acc.response_count,
            )
            for key, acc in sorted(
                model_today.items(),
                key=lambda item: item[1].estimated_cost_usd,
                reverse=True,
            )
        ]

        most_expensive_provider = _most_expensive_provider(cost_by_provider_today)
        most_expensive_model = _most_expensive_model(cost_by_model_today)

        comparisons_with_cost_today = len(today_acc.comparison_costs)
        average_cost_per_comparison_today = None
        if comparisons_with_cost_today > 0:
            total_comparison_cost = sum(today_acc.comparison_costs.values())
            average_cost_per_comparison_today = _round_usd(
                total_comparison_cost / comparisons_with_cost_today
            )

        return CostTrackingOut(
            estimated_cost_today_usd=_round_usd(today_acc.estimated_cost_usd)
            if today_acc.priced_response_count
            else None,
            estimated_cost_month_usd=_round_usd(month_acc.estimated_cost_usd)
            if month_acc.priced_response_count
            else None,
            input_tokens_today=today_acc.input_tokens if today_acc.input_tokens else None,
            output_tokens_today=today_acc.output_tokens if today_acc.output_tokens else None,
            input_tokens_month=month_acc.input_tokens if month_acc.input_tokens else None,
            output_tokens_month=month_acc.output_tokens if month_acc.output_tokens else None,
            cost_by_provider_today=cost_by_provider_today,
            cost_by_model_today=cost_by_model_today,
            most_expensive_provider_today=most_expensive_provider,
            most_expensive_model_today=most_expensive_model,
            average_cost_per_comparison_today=average_cost_per_comparison_today,
            comparisons_with_cost_today=comparisons_with_cost_today or None,
            missing_pricing_models=missing_pricing,
        )

    def _fetch_token_rows(self, since: datetime) -> list[_TokenRow]:
        stmt = (
            select(
                AIModel.key,
                AIModel.name_ar,
                Provider.key,
                Provider.name_ar,
                ModelResponse.input_tokens,
                ModelResponse.output_tokens,
                ModelResponse.comparison_id,
                ModelResponse.created_at,
                ModelResponse.completed_at,
            )
            .join(AIModel, AIModel.id == ModelResponse.model_id)
            .join(Provider, Provider.id == AIModel.provider_id)
            .where(
                ModelResponse.model_id.is_not(None),
                or_(
                    ModelResponse.created_at >= since,
                    ModelResponse.completed_at >= since,
                ),
            )
        )
        raw_rows = self.db.execute(stmt).all()
        result: list[_TokenRow] = []
        for row in raw_rows:
            activity_at = _response_activity_at(row[7], row[8])
            if activity_at < since:
                continue
            result.append(
                _TokenRow(
                    model_key=str(row[0]),
                    model_name_ar=str(row[1]),
                    provider_key=str(row[2]),
                    provider_name_ar=str(row[3]),
                    input_tokens=row[4],
                    output_tokens=row[5],
                    comparison_id=row[6],
                    activity_at=activity_at,
                )
            )
        return result

    def _missing_pricing_models(self, rows: list[_TokenRow]) -> list[MissingPricingModelOut]:
        seen: set[str] = set()
        missing: list[MissingPricingModelOut] = []
        for row in rows:
            if row.model_key in seen:
                continue
            seen.add(row.model_key)
            pricing = get_model_pricing(row.model_key)
            if pricing is None or (
                pricing.input_cost_per_1m_tokens_usd is None
                or pricing.output_cost_per_1m_tokens_usd is None
            ):
                missing.append(
                    MissingPricingModelOut(
                        model_key=row.model_key,
                        model_name_ar=row.model_name_ar,
                        provider_key=row.provider_key,
                    )
                )
        missing.sort(key=lambda item: item.model_key)
        return missing


def _round_usd(value: float) -> float:
    return round(value, 6)


def _most_expensive_provider(
    items: list[CostByProviderOut],
) -> MostExpensiveOut | None:
    priced = [item for item in items if item.estimated_cost_usd is not None]
    if not priced:
        return None
    top = max(priced, key=lambda item: item.estimated_cost_usd or 0.0)
    return MostExpensiveOut(
        provider_key=top.provider_key,
        provider_name_ar=top.provider_name_ar,
        model_key=None,
        model_name_ar=None,
        estimated_cost_usd=top.estimated_cost_usd,
    )


def _most_expensive_model(items: list[CostByModelOut]) -> MostExpensiveOut | None:
    priced = [item for item in items if item.estimated_cost_usd is not None]
    if not priced:
        return None
    top = max(priced, key=lambda item: item.estimated_cost_usd or 0.0)
    return MostExpensiveOut(
        provider_key=top.provider_key,
        provider_name_ar=None,
        model_key=top.model_key,
        model_name_ar=top.model_name_ar,
        estimated_cost_usd=top.estimated_cost_usd,
    )
