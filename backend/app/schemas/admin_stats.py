from pydantic import BaseModel


class ComparisonStatsOut(BaseModel):
    total: int
    completed: int
    partial: int
    failed: int
    pending: int
    today: int
    avg_response_time_ms: float | None = None


class ModelSelectionOut(BaseModel):
    model_id: str
    model_name_ar: str
    provider_key: str
    selection_count: int


class ProviderExecutionOut(BaseModel):
    provider_key: str
    provider_name_ar: str
    selection_count: int
    success_count: int
    error_count: int
    success_rate: float | None = None
    avg_response_time_ms: float | None = None


class VotePreferenceOut(BaseModel):
    model_id: str
    model_name_ar: str
    provider_key: str
    vote_count: int


class RecentErrorOut(BaseModel):
    occurred_at: str
    provider_key: str | None = None
    provider_name_ar: str | None = None
    model_name_ar: str | None = None
    error_message_ar: str | None = None
    error_code: str | None = None
    request_id: str | None = None


class RecentActivityOut(BaseModel):
    occurred_at: str
    activity_type: str
    status: str


class UploadStatsOut(BaseModel):
    total: int
    today: int
    images: int
    pdfs: int


class AdminStatsData(BaseModel):
    comparisons: ComparisonStatsOut
    uploads: UploadStatsOut
    total_votes: int
    most_selected_models: list[ModelSelectionOut]
    provider_execution: list[ProviderExecutionOut]
    vote_preferences: list[VotePreferenceOut]
    recent_errors: list[RecentErrorOut]
    recent_activity: list[RecentActivityOut]
