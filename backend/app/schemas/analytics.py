from pydantic import BaseModel, Field

from app.schemas.common import CategoryOut


class PreferenceItem(BaseModel):
    model_id: str
    model_key: str
    name_ar: str
    provider_key: str
    vote_count: int
    preference_share_pct: float


class PreferencesData(BaseModel):
    scope: str
    category: CategoryOut | None = None
    disclaimer_ar: str
    disclaimer_en: str | None = None
    period: str = "all_time"
    total_votes: int
    preferences: list[PreferenceItem]


class CategorySummaryItem(BaseModel):
    category: CategoryOut
    total_votes: int
    preferences: list[PreferenceItem]


class PreferencesSummaryData(BaseModel):
    period: str
    overall: PreferencesData
    by_category: list[CategorySummaryItem]


class ModelPreferenceData(BaseModel):
    model_id: str
    name_ar: str
    scope: str
    category: CategoryOut | None = None
    period: str
    vote_count: int
    total_votes_in_period: int
    preference_share_pct: float
    disclaimer_ar: str
