# Observability Guide

**Stack:** Structured JSON logs (Render) · In-process metrics · Health diagnostics API  
**Phase:** 1 — suitable for single-instance Render deployment

---

## Overview

Arab Benchmark AI observability covers four layers:

| Layer | Implementation | Where to view |
|-------|----------------|---------------|
| **Request logging** | JSON structured logs per HTTP request | Render → Logs |
| **Provider metrics** | Latency + failure counters per provider | `GET /v1/health/diagnostics` |
| **Comparison metrics** | Duration + status counters | `GET /v1/health/diagnostics` |
| **Health diagnostics** | DB ping, provider health, circuit breakers | `GET /v1/health/diagnostics` |

---

## Configuration

| Variable | Default | Production |
|----------|---------|------------|
| `LOG_LEVEL` | `INFO` | `INFO` or `WARNING` |
| `LOG_FORMAT` | `json` | `json` |
| `APP_VERSION` | `1.0.0` | Set per release |

```bash
# Local dev (human-readable logs)
LOG_FORMAT=text
LOG_LEVEL=INFO

# Render production (set in render.yaml)
LOG_FORMAT=json
LOG_LEVEL=INFO
```

---

## Request Logging

Every HTTP request emits two structured events:

### `http.request.started`
```json
{
  "timestamp": "2025-06-07T12:00:00.000+00:00",
  "level": "INFO",
  "event": "http.request.started",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/v1/comparisons",
  "client_ip": "203.0.113.10"
}
```

### `http.request.completed`
```json
{
  "timestamp": "2025-06-07T12:00:01.234+00:00",
  "level": "INFO",
  "event": "http.request.completed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/v1/comparisons",
  "client_ip": "203.0.113.10",
  "status_code": 202,
  "duration_ms": 1234
}
```

### Correlation

- Every response includes `X-Request-Id` header
- All log lines for a request share the same `request_id`
- API error responses include `meta.request_id`

### Filtering in Render

```
event:http.request.completed status_code:500
event:comparison.inference.completed
event:provider.inference.failed
event:app.unhandled_error
```

---

## Comparison Duration Tracking

### Events

| Event | When | Key fields |
|-------|------|------------|
| `comparison.inference.started` | Background inference begins | `comparison_id`, `model_count` |
| `comparison.inference.completed` | All models finished | `comparison_id`, `status`, `duration_ms`, `success_count` |
| `comparison.inference.background_failed` | Unhandled exception | `comparison_id`, `error_type` |
| `comparison.inference.task_failed` | Single model task exception | `comparison_id`, `error_type` |

### Metrics (in-memory)

Tracked in `MetricsCollector.comparisons`:

| Metric | Description |
|--------|-------------|
| `started` | Total comparisons that entered inference |
| `completed` | All models succeeded |
| `partial` | Some models failed |
| `failed` | All models failed |
| `background_errors` | Unhandled background task crashes |
| `active` | Currently running (inference in progress) |
| `duration_ms` | Latency stats (avg, min, max, count) |

### Example log
```json
{
  "event": "comparison.inference.completed",
  "comparison_id": "abc-123",
  "status": "partial",
  "duration_ms": 8420,
  "model_count": 4,
  "success_count": 3
}
```

---

## Provider Latency Tracking

Recorded on every successful `ProviderRegistry.run_inference()` call.

| Metric | Description |
|--------|-------------|
| `latency.count` | Total successful inferences |
| `latency.avg_ms` | Mean response time |
| `latency.min_ms` / `max_ms` | Range |
| `latency.recent_avg_ms` | Rolling avg of last 100 calls |

Latency comes from adapter `CompletionResult.response_time_ms` (wall-clock per provider API call).

---

## Provider Failure Tracking

Recorded when:

1. Provider API raises an exception (via registry)
2. Provider is unavailable / unconfigured (via comparison service)
3. Circuit breaker opens after repeated failures

| Metric | Description |
|--------|-------------|
| `successes` | Successful inference count |
| `failures` | Failed inference count |
| `failure_rate` | `failures / (successes + failures)` |
| `last_error_type` | Exception class name (e.g. `TimeoutError`) |
| `last_failure_at` | Unix timestamp |
| `circuit_open` | Circuit breaker state |

### Events

| Event | Level | Fields |
|-------|-------|--------|
| `provider.inference.failed` | WARNING | `provider`, `model`, `error_type` |

### Circuit breaker

- Opens after **5 consecutive failures** per provider
- Recovers after **60 seconds**
- State visible in diagnostics: `circuit_breakers.openai: true`

---

## Health Diagnostics

### Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /v1/health` | Liveness probe | Public |
| `GET /v1/health/providers` | Per-provider health check | Public |
| `GET /v1/health/diagnostics` | Full operational snapshot | Public* |

\* **Recommendation:** Restrict `/v1/health/diagnostics` in production (Render IP allowlist, API gateway, or auth middleware in Phase 2). Currently public for operational simplicity.

### Render health check

```
Health Check Path: /v1/health
```

### Diagnostics response example

```bash
curl -s https://your-api.onrender.com/v1/health/diagnostics | jq .
```

```json
{
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "uptime_seconds": 3600.5,
    "requests": {
      "total": 1523,
      "latency_ms": { "count": 1523, "avg_ms": 45.2, "min_ms": 2, "max_ms": 1200 },
      "errors_4xx": 12,
      "errors_5xx": 1,
      "by_status": { "200": 1400, "202": 98, "429": 12, "500": 1 }
    },
    "comparisons": {
      "started": 98,
      "completed": 72,
      "partial": 20,
      "failed": 4,
      "background_errors": 2,
      "active": 0,
      "terminal_count": 96,
      "duration_ms": { "count": 96, "avg_ms": 12400.0, "min_ms": 3200, "max_ms": 45000 }
    },
    "providers": [
      {
        "key": "openai",
        "name_ar": "OpenAI",
        "configured": true,
        "health_status": "healthy",
        "health_latency_ms": 210,
        "latency": { "count": 150, "avg_ms": 3200.5 },
        "successes": 148,
        "failures": 2,
        "failure_rate": 0.013,
        "last_error_type": "APITimeoutError",
        "circuit_open": false
      }
    ],
    "database": {
      "status": "healthy",
      "latency_ms": 8
    },
    "circuit_breakers": {
      "openai": false,
      "anthropic": false,
      "google": false
    }
  },
  "meta": { "request_id": "..." }
}
```

### Status values

| `data.status` | Meaning |
|---------------|---------|
| `ok` | DB healthy, no open circuit breakers |
| `degraded` | DB unhealthy OR any circuit breaker open |

---

## Application Events Reference

| Event | Level | Description |
|-------|-------|-------------|
| `app.started` | INFO | Server boot |
| `app.stopped` | INFO | Server shutdown |
| `app.error` | WARNING | Handled `AppError` (4xx/429) |
| `app.validation_error` | WARNING | Request validation failure |
| `app.unhandled_error` | ERROR | Unhandled 500 |

---

## Monitoring Playbook

### Daily checks

```bash
# Liveness
curl -sf https://API_URL/v1/health

# Operational snapshot
curl -s https://API_URL/v1/health/diagnostics | jq '.data | {status, uptime_seconds, comparisons, errors: .requests.errors_5xx}'
```

### Alerts to configure (Render / external)

| Condition | Severity | Action |
|-----------|----------|--------|
| `/v1/health` returns non-200 | Critical | Check Render service + DB |
| `errors_5xx > 0` in diagnostics | High | Check Render logs for `app.unhandled_error` |
| `comparisons.background_errors` increasing | High | Check provider keys, DB connectivity |
| `comparisons.active` stuck > 0 for 30min | High | Stuck inference — see `PROJECT_AUDIT.md` C2 |
| Provider `failure_rate > 0.2` | Medium | Check provider API status / quotas |
| `circuit_open: true` | Medium | Provider degraded; wait for recovery or investigate |
| `database.status != healthy` | Critical | Check Supabase status + `DATABASE_URL` |

### Render log queries

Search for these `event` values:

```
app.unhandled_error
comparison.inference.background_failed
provider.inference.failed
http.request.completed AND status_code:500
```

---

## Architecture

```
Request → RequestIdMiddleware → LoggingMiddleware → Route Handler
                │                      │
                │                      ├─ log: http.request.started
                │                      ├─ metrics.record_request()
                │                      └─ log: http.request.completed
                │
Comparison create → BackgroundTask → ComparisonService.run_inference()
                                           │
                                           ├─ metrics.record_comparison_started()
                                           ├─ ProviderRegistry.run_inference()
                                           │     ├─ success → record_provider_success(latency)
                                           │     └─ failure → record_provider_failure()
                                           └─ metrics.record_comparison_finished(duration)
```

### Module map

| File | Role |
|------|------|
| `app/observability/logging_config.py` | JSON formatter, `log_event()` |
| `app/observability/metrics.py` | In-process metrics collector |
| `app/core/middleware.py` | HTTP request logging + metrics |
| `app/services/comparison_service.py` | Comparison duration events |
| `app/providers/registry.py` | Provider latency/failure metrics |
| `app/api/v1/health.py` | Diagnostics endpoint |
| `app/main.py` | Logging bootstrap, error event logging |

---

## Limitations (Phase 1)

| Limitation | Impact | Phase 2 fix |
|------------|--------|-------------|
| In-memory metrics | Reset on deploy/restart; not shared across replicas | Prometheus + Redis |
| No log aggregation service | Render logs only; no cross-service search | Datadog / Axiom / Better Stack |
| No distributed tracing | Cannot trace request → provider → DB | OpenTelemetry |
| Diagnostics endpoint public | Operational data exposed | Auth middleware |
| No frontend RUM | No client-side error tracking | Sentry browser SDK |
| Per-path metrics aggregated | `by_status` only, not per-route breakdown | Add route labels |

---

## Local Development

```bash
# Human-readable logs
LOG_FORMAT=text LOG_LEVEL=DEBUG make dev

# JSON logs (production-like)
LOG_FORMAT=json make dev

# Watch diagnostics while testing
watch -n 5 'curl -s http://localhost:8000/v1/health/diagnostics | jq .data.comparisons'
```

---

## Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Render log access, health check path
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — Observability checklist items
- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) — Known reliability gaps
