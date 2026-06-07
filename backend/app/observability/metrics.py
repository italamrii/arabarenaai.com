"""In-process metrics for production observability (Render single-instance).

Replace with Prometheus/Redis in Phase 2 for multi-replica deployments.
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from threading import Lock
from typing import Any


@dataclass
class LatencyStats:
    count: int = 0
    total_ms: int = 0
    min_ms: int | None = None
    max_ms: int | None = None
    recent_ms: deque[int] = field(default_factory=lambda: deque(maxlen=100))

    def record(self, latency_ms: int) -> None:
        self.count += 1
        self.total_ms += latency_ms
        self.min_ms = latency_ms if self.min_ms is None else min(self.min_ms, latency_ms)
        self.max_ms = latency_ms if self.max_ms is None else max(self.max_ms, latency_ms)
        self.recent_ms.append(latency_ms)

    @property
    def avg_ms(self) -> float | None:
        if self.count == 0:
            return None
        return round(self.total_ms / self.count, 1)

    def to_dict(self) -> dict[str, Any]:
        return {
            "count": self.count,
            "avg_ms": self.avg_ms,
            "min_ms": self.min_ms,
            "max_ms": self.max_ms,
            "recent_avg_ms": round(sum(self.recent_ms) / len(self.recent_ms), 1)
            if self.recent_ms
            else None,
        }


@dataclass
class ProviderStats:
    latency: LatencyStats = field(default_factory=LatencyStats)
    successes: int = 0
    failures: int = 0
    last_failure_at: float | None = None
    last_error_type: str | None = None
    circuit_open: bool = False

    def to_dict(self) -> dict[str, Any]:
        total = self.successes + self.failures
        return {
            "latency": self.latency.to_dict(),
            "successes": self.successes,
            "failures": self.failures,
            "failure_rate": round(self.failures / total, 3) if total else 0.0,
            "last_failure_at": self.last_failure_at,
            "last_error_type": self.last_error_type,
            "circuit_open": self.circuit_open,
        }


@dataclass
class ComparisonStats:
    started: int = 0
    completed: int = 0
    partial: int = 0
    failed: int = 0
    background_errors: int = 0
    active: int = 0
    duration: LatencyStats = field(default_factory=LatencyStats)

    def to_dict(self) -> dict[str, Any]:
        terminal = self.completed + self.partial + self.failed
        return {
            "started": self.started,
            "completed": self.completed,
            "partial": self.partial,
            "failed": self.failed,
            "background_errors": self.background_errors,
            "active": self.active,
            "terminal_count": terminal,
            "duration_ms": self.duration.to_dict(),
        }


@dataclass
class RequestStats:
    total: int = 0
    by_status: dict[str, int] = field(default_factory=dict)
    latency: LatencyStats = field(default_factory=LatencyStats)
    errors_4xx: int = 0
    errors_5xx: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "latency_ms": self.latency.to_dict(),
            "errors_4xx": self.errors_4xx,
            "errors_5xx": self.errors_5xx,
            "by_status": dict(self.by_status),
        }


class MetricsCollector:
    def __init__(self) -> None:
        self._lock = Lock()
        self._started_at = time.time()
        self.requests = RequestStats()
        self.comparisons = ComparisonStats()
        self._providers: dict[str, ProviderStats] = {}

    @property
    def uptime_seconds(self) -> float:
        return round(time.time() - self._started_at, 1)

    def _provider(self, provider_key: str) -> ProviderStats:
        if provider_key not in self._providers:
            self._providers[provider_key] = ProviderStats()
        return self._providers[provider_key]

    def record_request(
        self,
        *,
        method: str,
        path: str,
        status_code: int,
        duration_ms: int,
    ) -> None:
        with self._lock:
            self.requests.total += 1
            self.requests.latency.record(duration_ms)
            key = str(status_code)
            self.requests.by_status[key] = self.requests.by_status.get(key, 0) + 1
            if 400 <= status_code < 500:
                self.requests.errors_4xx += 1
            elif status_code >= 500:
                self.requests.errors_5xx += 1

    def record_provider_success(self, provider_key: str, latency_ms: int) -> None:
        with self._lock:
            stats = self._provider(provider_key)
            stats.successes += 1
            stats.latency.record(latency_ms)

    def record_provider_failure(
        self,
        provider_key: str,
        *,
        error_type: str,
        circuit_open: bool = False,
    ) -> None:
        with self._lock:
            stats = self._provider(provider_key)
            stats.failures += 1
            stats.last_failure_at = time.time()
            stats.last_error_type = error_type
            stats.circuit_open = circuit_open

    def record_comparison_started(self, comparison_id: str) -> None:
        with self._lock:
            self.comparisons.started += 1
            self.comparisons.active += 1

    def record_comparison_finished(
        self,
        *,
        comparison_id: str,
        status: str,
        duration_ms: int,
        model_count: int,
        success_count: int,
    ) -> None:
        with self._lock:
            self.comparisons.active = max(0, self.comparisons.active - 1)
            self.comparisons.duration.record(duration_ms)
            if status == "completed":
                self.comparisons.completed += 1
            elif status == "partial":
                self.comparisons.partial += 1
            else:
                self.comparisons.failed += 1

    def record_comparison_background_error(self, comparison_id: str) -> None:
        """Unhandled crash outside comparison finally (rare). Active gauge managed by finished()."""
        with self._lock:
            self.comparisons.background_errors += 1

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "uptime_seconds": self.uptime_seconds,
                "started_at_unix": self._started_at,
                "requests": self.requests.to_dict(),
                "comparisons": self.comparisons.to_dict(),
                "providers": {
                    key: stats.to_dict() for key, stats in sorted(self._providers.items())
                },
            }


_metrics: MetricsCollector | None = None


def get_metrics() -> MetricsCollector:
    global _metrics
    if _metrics is None:
        _metrics = MetricsCollector()
    return _metrics
