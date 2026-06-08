import logging

import time

from pathlib import Path

from typing import Any



from fastapi import APIRouter

from sqlalchemy import text



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
def admin_stats(db: DbSession, request_id: RequestId) -> Envelope[AdminStatsData]:
    """DB-backed operational stats for the admin dashboard (no PII)."""
    service = AdminStatsService(db)
    return Envelope(data=service.get_stats(), meta=to_meta(request_id))


@router.post("/providers/reset-circuit-breakers")
def reset_circuit_breakers(
    request_id: RequestId,
    registry: ProviderRegistryDep,
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


def _latency_from_dict(data: dict[str, Any]) -> LatencyMetricsOut:

    return LatencyMetricsOut(**data)





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

) -> Envelope[DiagnosticsData]:

    """Operational snapshot: metrics, provider health, DB connectivity."""

    metrics = get_metrics()

    snapshot = metrics.snapshot()

    provider_metrics_map = snapshot["providers"]



    providers_out: list[ProviderMetricsOut] = []

    for adapter in registry.all_adapters():

        health = await adapter.health_check()

        pm = provider_metrics_map.get(adapter.key, {})

        latency = pm.get("latency", {})

        providers_out.append(

            ProviderMetricsOut(

                key=adapter.key,

                name_ar=adapter.name_ar,

                configured=adapter.is_configured(),

                health_status=health.status,

                health_latency_ms=health.latency_ms,

                latency=_latency_from_dict(latency),

                successes=pm.get("successes", 0),

                failures=pm.get("failures", 0),

                failure_rate=pm.get("failure_rate", 0.0),

                last_error_type=pm.get("last_error_type"),

                circuit_open=registry.circuit_breaker.is_open(adapter.key),

            )

        )



    circuit_breakers = registry.circuit_breaker_states()



    db_status = await _check_database()

    overall = "degraded" if db_status["status"] != "healthy" else "ok"

    if any(p.circuit_open for p in providers_out):

        overall = "degraded"



    data = DiagnosticsData(

        status=overall,

        version=settings.app_version,

        uptime_seconds=snapshot["uptime_seconds"],

        requests=RequestMetricsOut(

            **{

                **snapshot["requests"],

                "latency_ms": _latency_from_dict(snapshot["requests"]["latency_ms"]),

            }

        ),

        comparisons=ComparisonMetricsOut(

            **{

                **snapshot["comparisons"],

                "duration_ms": _latency_from_dict(snapshot["comparisons"]["duration_ms"]),

            }

        ),

        providers=providers_out,

        database=db_status,

        circuit_breakers=circuit_breakers,

    )

    return Envelope(data=data, meta=to_meta(request_id))


