import logging

import time

from pathlib import Path

from typing import Any



from typing import Annotated

from fastapi import APIRouter, Depends

from sqlalchemy import text



from app.core.admin_auth import require_admin_access
from app.core.database import engine

from app.core.dependencies import AppSettings, DbSession, ProviderRegistryDep, RequestId

from app.observability.logging_config import log_event

from app.observability.metrics import get_metrics
from app.services.admin_stats_service import AdminStatsService

from app.schemas.common import Envelope, to_meta

from app.schemas.observability import (

    CircuitBreakerResetOut,

    ComparisonMetricsOut,

    DiagnosticsData,

    LatencyMetricsOut,

    ProviderMetricsOut,

    RequestMetricsOut,

)

from app.schemas.admin_stats import AdminStatsData
from app.schemas.session import (

    EnvDebugData,

    HealthData,

    ProviderHealthData,

    ProviderHealthItem,

)



router = APIRouter(prefix="/health", tags=["health"])

logger = logging.getLogger(__name__)





@router.get("")

def health_check(request_id: RequestId, settings: AppSettings) -> Envelope[HealthData]:

    return Envelope(

        data=HealthData(status="ok", version=settings.app_version),

        meta=to_meta(request_id),

    )





@router.get("/env-debug")

def env_debug(
    request_id: RequestId,
    settings: AppSettings,
    registry: ProviderRegistryDep,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[EnvDebugData]:

    """Temporary: verify .env loading without exposing secrets."""

    return Envelope(

        data=EnvDebugData(

            env_file_path=settings.env_file_path,

            env_file_exists=settings.env_file_exists,

            cwd=str(Path.cwd()),

            openai_api_key_configured=settings.openai_api_key_configured,

            provider_keys_configured=settings.provider_keys_configured,

            registry_openai_configured=registry.openai_configured(),

        ),

        meta=to_meta(request_id),

    )





@router.get("/providers")

async def providers_health(

    request_id: RequestId,

    settings: AppSettings,

    registry: ProviderRegistryDep,

) -> Envelope[ProviderHealthData]:

    settings_openai = settings.openai_api_key_configured

    registry_openai = registry.openai_configured()



    log_event(

        logger,

        "health.providers.check",

        settings_openai_configured=settings_openai,

        registry_openai_configured=registry_openai,

    )



    items: list[ProviderHealthItem] = []

    for adapter in registry.all_adapters():

        result = await adapter.health_check()

        items.append(

            ProviderHealthItem(

                key=adapter.key,

                name_ar=adapter.name_ar,

                status=result.status,

                latency_ms=result.latency_ms,

                message_ar=result.message_ar,

            )

        )



    return Envelope(

        data=ProviderHealthData(

            providers=items,

            settings_openai_configured=settings_openai,

            registry_openai_configured=registry_openai,

        ),

        meta=to_meta(request_id),

    )


@router.get("/admin-stats")
def admin_stats(
    db: DbSession,
    request_id: RequestId,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[AdminStatsData]:
    """DB-backed operational stats for the admin dashboard (no PII)."""
    service = AdminStatsService(db)
    return Envelope(data=service.get_stats(), meta=to_meta(request_id))


@router.post("/providers/reset-circuit-breakers")
def reset_circuit_breakers(
    request_id: RequestId,
    registry: ProviderRegistryDep,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[CircuitBreakerResetOut]:
    """Clear in-memory provider circuit breaker state (all providers)."""
    states = registry.reset_circuit_breakers()
    log_event(
        logger,
        "health.circuit_breakers.reset",
        circuit_breakers=states,
    )
    return Envelope(
        data=CircuitBreakerResetOut(reset=True, circuit_breakers=states),
        meta=to_meta(request_id),
    )


_DEFAULT_LATENCY: dict[str, Any] = {
    "count": 0,
    "avg_ms": None,
    "min_ms": None,
    "max_ms": None,
    "recent_avg_ms": None,
}


def _latency_from_dict(data: dict[str, Any] | None) -> LatencyMetricsOut:
    payload = {**_DEFAULT_LATENCY, **(data if isinstance(data, dict) else {})}
    return LatencyMetricsOut(
        count=int(payload.get("count", 0) or 0),
        avg_ms=payload.get("avg_ms"),
        min_ms=payload.get("min_ms"),
        max_ms=payload.get("max_ms"),
        recent_avg_ms=payload.get("recent_avg_ms"),
    )


def _request_metrics_from_snapshot(raw: dict[str, Any] | None) -> RequestMetricsOut:
    data = raw if isinstance(raw, dict) else {}
    latency_raw = data.get("latency_ms")
    by_status = data.get("by_status")
    return RequestMetricsOut(
        total=int(data.get("total", 0) or 0),
        latency_ms=_latency_from_dict(latency_raw if isinstance(latency_raw, dict) else None),
        errors_4xx=int(data.get("errors_4xx", 0) or 0),
        errors_5xx=int(data.get("errors_5xx", 0) or 0),
        by_status=by_status if isinstance(by_status, dict) else {},
    )


def _comparison_metrics_from_snapshot(raw: dict[str, Any] | None) -> ComparisonMetricsOut:
    data = raw if isinstance(raw, dict) else {}
    duration_raw = data.get("duration_ms")
    return ComparisonMetricsOut(
        started=int(data.get("started", 0) or 0),
        completed=int(data.get("completed", 0) or 0),
        partial=int(data.get("partial", 0) or 0),
        failed=int(data.get("failed", 0) or 0),
        background_errors=int(data.get("background_errors", 0) or 0),
        active=int(data.get("active", 0) or 0),
        terminal_count=int(data.get("terminal_count", 0) or 0),
        duration_ms=_latency_from_dict(duration_raw if isinstance(duration_raw, dict) else None),
    )


async def _provider_metrics_out(
    registry: ProviderRegistryDep,
    provider_metrics_map: dict[str, Any],
) -> list[ProviderMetricsOut]:
    providers_out: list[ProviderMetricsOut] = []
    for adapter in registry.all_adapters():
        health = await adapter.health_check()
        pm = provider_metrics_map.get(adapter.key)
        if not isinstance(pm, dict):
            pm = {}
        latency_raw = pm.get("latency")
        providers_out.append(
            ProviderMetricsOut(
                key=adapter.key,
                name_ar=adapter.name_ar,
                configured=adapter.is_configured(),
                health_status=health.status,
                health_latency_ms=health.latency_ms,
                latency=_latency_from_dict(
                    latency_raw if isinstance(latency_raw, dict) else None
                ),
                successes=int(pm.get("successes", 0) or 0),
                failures=int(pm.get("failures", 0) or 0),
                failure_rate=float(pm.get("failure_rate", 0.0) or 0.0),
                last_error_type=pm.get("last_error_type"),
                circuit_open=registry.circuit_breaker.is_open(adapter.key),
            )
        )
    return providers_out





async def _check_database() -> dict[str, Any]:

    started = time.perf_counter()

    try:

        with engine.connect() as conn:

            conn.execute(text("SELECT 1"))

        latency_ms = int((time.perf_counter() - started) * 1000)

        return {"status": "healthy", "latency_ms": latency_ms}

    except Exception as exc:

        return {"status": "unhealthy", "error": type(exc).__name__}





@router.get("/diagnostics")

async def health_diagnostics(
    request_id: RequestId,
    settings: AppSettings,
    registry: ProviderRegistryDep,
    _admin: Annotated[None, Depends(require_admin_access)],
) -> Envelope[DiagnosticsData]:

    """Operational snapshot: metrics, provider health, DB connectivity."""

    db_status = await _check_database()

    try:
        metrics = get_metrics()
        snapshot = metrics.snapshot() if metrics is not None else {}
        if not isinstance(snapshot, dict):
            snapshot = {}

        provider_metrics_map = snapshot.get("providers")
        if not isinstance(provider_metrics_map, dict):
            provider_metrics_map = {}

        providers_out = await _provider_metrics_out(registry, provider_metrics_map)

        circuit_breakers = registry.circuit_breaker_states()
        overall = "degraded" if db_status.get("status") != "healthy" else "ok"
        if any(p.circuit_open for p in providers_out):
            overall = "degraded"

        data = DiagnosticsData(
            status=overall,
            version=settings.app_version,
            uptime_seconds=float(snapshot.get("uptime_seconds", 0.0) or 0.0),
            requests=_request_metrics_from_snapshot(snapshot.get("requests")),
            comparisons=_comparison_metrics_from_snapshot(snapshot.get("comparisons")),
            providers=providers_out,
            database=db_status,
            circuit_breakers=circuit_breakers,
        )
    except Exception:
        logger.exception("health.diagnostics.assembly_failed")
        fallback_providers: dict[str, Any] = {}
        try:
            fallback_snapshot = get_metrics().snapshot()
            if isinstance(fallback_snapshot, dict):
                raw_providers = fallback_snapshot.get("providers")
                if isinstance(raw_providers, dict):
                    fallback_providers = raw_providers
        except Exception:
            logger.exception("health.diagnostics.snapshot_fallback_failed")
        providers_out = await _provider_metrics_out(registry, fallback_providers)
        data = DiagnosticsData(
            status="degraded",
            version=settings.app_version,
            uptime_seconds=0.0,
            requests=_request_metrics_from_snapshot(None),
            comparisons=_comparison_metrics_from_snapshot(None),
            providers=providers_out,
            database=db_status,
            circuit_breakers=registry.circuit_breaker_states(),
        )

    return Envelope(data=data, meta=to_meta(request_id))


