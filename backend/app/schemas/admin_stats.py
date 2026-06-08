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


class ProviderUsageOut(BaseModel):
    provider_key: str
    provider_name_ar: str
    usage_count: int


class CostByProviderOut(BaseModel):
    provider_key: str
    provider_name_ar: str
    estimated_cost_usd: float | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    response_count: int = 0


class CostByModelOut(BaseModel):
    model_key: str
    model_name_ar: str
    provider_key: str
    estimated_cost_usd: float | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    response_count: int = 0


class MissingPricingModelOut(BaseModel):
    model_key: str
    model_name_ar: str
    provider_key: str


class MostExpensiveOut(BaseModel):
    provider_key: str | None = None
    provider_name_ar: str | None = None
    model_key: str | None = None
    model_name_ar: str | None = None
    estimated_cost_usd: float | None = None


class CostTrackingOut(BaseModel):
    estimated_cost_today_usd: float | None = None
    estimated_cost_month_usd: float | None = None
    input_tokens_today: int | None = None
    output_tokens_today: int | None = None
    input_tokens_month: int | None = None
    output_tokens_month: int | None = None
    cost_by_provider_today: list[CostByProviderOut] = []
    cost_by_model_today: list[CostByModelOut] = []
    most_expensive_provider_today: MostExpensiveOut | None = None
    most_expensive_model_today: MostExpensiveOut | None = None
    average_cost_per_comparison_today: float | None = None
    comparisons_with_cost_today: int | None = None
    missing_pricing_models: list[MissingPricingModelOut] = []


class UsageSignalsOut(BaseModel):
    online_now_5m: int | None = None
    active_sessions_15m: int | None = None
    visitors_today: int | None = None
    comparisons_today: int | None = None
    votes_today: int | None = None
    uploads_today: int | None = None
    attachments_today: int | None = None
    model_responses_today: int | None = None
    most_used_models_today: list[ModelSelectionOut] = []
    most_used_providers_today: list[ProviderUsageOut] = []
    failed_comparisons_today: int | None = None
    average_response_time_today: float | None = None
    total_input_tokens_today: int | None = None
    total_output_tokens_today: int | None = None


class AdminStatsData(BaseModel):
    comparisons: ComparisonStatsOut
    uploads: UploadStatsOut
    total_votes: int
    most_selected_models: list[ModelSelectionOut]
    provider_execution: list[ProviderExecutionOut]
    vote_preferences: list[VotePreferenceOut]
    recent_errors: list[RecentErrorOut]
    recent_activity: list[RecentActivityOut]
    usage_signals: UsageSignalsOut
    cost_tracking: CostTrackingOut
