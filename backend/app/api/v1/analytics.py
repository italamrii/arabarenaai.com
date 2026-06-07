import uuid

from fastapi import APIRouter, Query

from app.analytics.service import AnalyticsService
from app.core.dependencies import DbSession, RequestId, rate_limit_analytics
from app.schemas.analytics import ModelPreferenceData, PreferencesData, PreferencesSummaryData
from app.schemas.common import Envelope, to_meta

router = APIRouter()


@router.get("/preferences")
def get_preferences(
    db: DbSession,
    request_id: RequestId,
    _ip: str = rate_limit_analytics,
    period: str = Query(default="all_time"),
    category_key: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    provider: str | None = Query(default=None),
) -> Envelope[PreferencesData]:
    service = AnalyticsService(db)
    data = service.get_preferences(
        category_key=category_key,
        category_id=category_id,
        period=period,
    )
    if provider:
        data.preferences = [p for p in data.preferences if p.provider_key == provider]
        data.total_votes = sum(p.vote_count for p in data.preferences)
    return Envelope(
        data=data,
        meta=to_meta(request_id, sort="name_ar_asc"),
    )


@router.get("/preferences/summary")
def get_preferences_summary(
    db: DbSession,
    request_id: RequestId,
    _ip: str = rate_limit_analytics,
    period: str = Query(default="all_time"),
) -> Envelope[PreferencesSummaryData]:
    service = AnalyticsService(db)
    return Envelope(
        data=service.get_summary(period=period),
        meta=to_meta(request_id),
    )


@router.get("/preferences/{model_id}")
def get_model_preferences(
    model_id: str,
    db: DbSession,
    request_id: RequestId,
    _ip: str = rate_limit_analytics,
    period: str = Query(default="all_time"),
    category_key: str | None = Query(default=None),
) -> Envelope[ModelPreferenceData]:
    service = AnalyticsService(db)
    data = service.get_model_preference(
        uuid.UUID(model_id),
        category_key=category_key,
        period=period,
    )
    return Envelope(data=data, meta=to_meta(request_id))
