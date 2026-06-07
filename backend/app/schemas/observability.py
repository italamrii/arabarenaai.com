from typing import Any

from pydantic import BaseModel


class LatencyMetricsOut(BaseModel):
    count: int
    avg_ms: float | None = None
    min_ms: int | None = None
    max_ms: int | None = None
    recent_avg_ms: float | None = None


class ProviderMetricsOut(BaseModel):
    key: str
    name_ar: str
    configured: bool
    health_status: str
    health_latency_ms: int | None = None
    latency: LatencyMetricsOut
    successes: int
    failures: int
    failure_rate: float
    last_error_type: str | None = None
    circuit_open: bool


class ComparisonMetricsOut(BaseModel):
    started: int
    completed: int
    partial: int
    failed: int
    background_errors: int
    active: int
    terminal_count: int
    duration_ms: LatencyMetricsOut


class RequestMetricsOut(BaseModel):
    total: int
    latency_ms: LatencyMetricsOut
    errors_4xx: int
    errors_5xx: int
    by_status: dict[str, int]


class DiagnosticsData(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    requests: RequestMetricsOut
    comparisons: ComparisonMetricsOut
    providers: list[ProviderMetricsOut]
    database: dict[str, Any]
    circuit_breakers: dict[str, bool]


class CircuitBreakerResetOut(BaseModel):
    reset: bool
    circuit_breakers: dict[str, bool]
