# Arab Benchmark AI — API Specification

REST API served by **FastAPI**. Base URL: `https://api.arabbenchmark.ai/v1` (production) / `http://localhost:8000/v1` (development).

**Conventions**
- JSON request/response bodies (`Content-Type: application/json`)
- UTF-8 throughout (Arabic text in prompts and responses)
- Timestamps: ISO 8601 UTC (`2025-06-07T12:00:00Z`)
- IDs: UUID v4 strings
- Pagination: cursor-based (`?cursor=&limit=`) for list endpoints
- **No ranking semantics** in any response field names or sort defaults exposed to clients

---

## 1. Authentication

### MVP: Session-based anonymous access

| Header | Description |
|--------|-------------|
| `X-Session-Id` | Client-generated or server-issued session UUID (required for votes) |

Server may also set `HttpOnly` cookie `ab_session` on first visit via `POST /sessions`.

### Phase 2+: Bearer token

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer <jwt>` for authenticated users |

---

## 2. Standard Response Envelope

### Success

```json
{
  "data": { },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "يجب اختيار بين ٢ و ١٠ نماذج",
    "message_en": "Select between 2 and 10 models",
    "details": [
      { "field": "model_ids", "issue": "too_few", "min": 2 }
    ]
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### HTTP status codes

| Code | Usage |
|------|-------|
| `200` | Success |
| `201` | Created |
| `202` | Accepted (async comparison started) |
| `400` | Validation error |
| `401` | Missing/invalid auth |
| `404` | Resource not found |
| `409` | Conflict (duplicate vote) |
| `422` | Unprocessable (business rule violation) |
| `429` | Rate limit exceeded |
| `500` | Internal error |
| `503` | Provider unavailable (all targets failed) |

---

## 3. Rate Limits

| Endpoint group | Limit (MVP) |
|----------------|-------------|
| `POST /comparisons` | 10/hour per session |
| `POST /categories/detect` | 20/hour per session |
| `POST /comparisons/{id}/votes` | 30/hour per session |
| `GET /analytics/*` | 60/minute per IP |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 4. Endpoints

### 4.1 Health

#### `GET /health`

Liveness check.

**Response `200`**
```json
{
  "data": {
    "status": "ok",
    "version": "1.0.0"
  }
}
```

---

#### `GET /health/providers`

Provider availability (internal or public status page).

**Response `200`**
```json
{
  "data": {
    "providers": [
      {
        "key": "openai",
        "name_ar": "OpenAI",
        "status": "healthy",
        "latency_ms": 120
      },
      {
        "key": "allam",
        "name_ar": "علّام",
        "status": "unavailable",
        "message_ar": "قريباً"
      }
    ]
  }
}
```

---

### 4.2 Sessions

#### `POST /sessions`

Issue or refresh anonymous session.

**Response `201`**
```json
{
  "data": {
    "session_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "expires_at": "2025-07-07T12:00:00Z"
  }
}
```

---

### 4.3 Categories

Every comparison must resolve to exactly one category from the fixed catalog below.

| key | name_en | name_ar |
|-----|---------|---------|
| `business` | Business | أعمال |
| `startup` | Startup | شركات ناشئة |
| `coding` | Coding | برمجة |
| `research` | Research | بحث |
| `marketing` | Marketing | تسويق |
| `arabic_writing` | Arabic Writing | كتابة عربية |
| `legal` | Legal | قانوني |
| `general` | General | عام |

#### `GET /categories`

List all enabled prompt categories for the picker UI.

**Response `200`**
```json
{
  "data": {
    "categories": [
      {
        "id": "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "key": "business",
        "name_ar": "أعمال",
        "name_en": "Business",
        "sort_order": 1
      },
      {
        "id": "d2b3c4d5-e6f7-8901-bcde-f12345678901",
        "key": "coding",
        "name_ar": "برمجة",
        "name_en": "Coding",
        "sort_order": 3
      }
    ]
  },
  "meta": {
    "default_key": "general",
    "supports_auto_detect": true
  }
}
```

---

#### `POST /categories/detect`

Suggest a category for a prompt without creating a comparison. Used for auto-detect preview in the UI.

**Request body**
```json
{
  "prompt": "اكتب خطة تسويقية لمنتج SaaS جديد"
}
```

**Response `200`**
```json
{
  "data": {
    "suggested_category": {
      "id": "e3c4d5e6-f7a8-9012-cdef-123456789012",
      "key": "marketing",
      "name_ar": "تسويق",
      "name_en": "Marketing"
    },
    "confidence": 0.87,
    "fallback_used": false
  }
}
```

**Fallback behavior**: If confidence &lt; 0.6 or classifier fails, returns `key: general` with `fallback_used: true`.

**Rate limit**: 20/hour per session (see §3).

---

### 4.4 Models

#### `GET /models`

List selectable models for the comparison picker.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled_only` | boolean | `true` | Exclude disabled and placeholder models |
| `provider` | string | | Filter by provider key |

**Response `200`**
```json
{
  "data": {
    "models": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "key": "gpt-4o",
        "name_ar": "GPT-4o",
        "provider": {
          "key": "openai",
          "name_ar": "OpenAI"
        },
        "is_placeholder": false,
        "max_tokens": 4096
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "key": "allam",
        "name_ar": "علّام",
        "provider": {
          "key": "allam",
          "name_ar": "علّام"
        },
        "is_placeholder": true,
        "status_ar": "قريباً"
      }
    ]
  },
  "meta": {
    "min_selection": 2,
    "max_selection": 10
  }
}
```

**Notes**
- Placeholder models (`is_placeholder: true`) are listed but rejected by `POST /comparisons` unless admin-enabled.
- Default sort: `sort_order` ascending (not preference-based).

---

#### `GET /models/{model_id}`

Single model details.

**Response `200`**: Same shape as one element of `/models` list.

**Response `404`**: Model not found.

---

### 4.5 Comparisons

#### `POST /comparisons`

Create a comparison and run inference across selected models.

**Headers**
- `X-Session-Id` (required)

**Request body (manual category)**
```json
{
  "prompt": "ما هي أفضل طريقة لتعلم اللغة العربية؟",
  "category_mode": "manual",
  "category_key": "arabic_writing",
  "model_ids": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "c3d4e5f6-a7b8-9012-cdef-123456789012"
  ]
}
```

**Request body (auto-detect category)**
```json
{
  "prompt": "اكتب عقداً قانونياً لشراكة بين شركتين",
  "category_mode": "auto",
  "model_ids": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

**Request body (auto-detect with user override)**
```json
{
  "prompt": "اكتب عقداً قانونياً لشراكة بين شركتين",
  "category_mode": "auto",
  "category_key": "legal",
  "model_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "b2c3d4e5-f6a7-8901-bcde-f12345678901"]
}
```

| Field | Type | Rules |
|-------|------|-------|
| `prompt` | string | 1–4000 chars, non-empty after trim |
| `category_mode` | enum | `manual` or `auto` (required) |
| `category_key` | string | Required when `category_mode: manual`. Optional override when `category_mode: auto`; if omitted under auto, server classifies |
| `model_ids` | UUID[] | 2–10 unique IDs; all must exist and be enabled non-placeholder |

**Response `202`** (comparison started)
```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "status": "running",
    "prompt": {
      "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "char_count": 42
    },
    "category": {
      "id": "f4d5e6f7-a8b9-0123-cdef-234567890123",
      "key": "arabic_writing",
      "name_ar": "كتابة عربية",
      "name_en": "Arabic Writing",
      "source": "manual",
      "confidence": null
    },
    "targets": [
      { "model_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "position": 0 },
      { "model_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "position": 1 }
    ],
    "created_at": "2025-06-07T12:00:00Z"
  }
}
```

**Errors**
- `400` — fewer than 2 or more than 10 models; missing/invalid `category_mode` or `category_key`
- `422` — placeholder model in selection; unknown category key
- `429` — rate limit

---

#### `GET /comparisons/{comparison_id}`

Poll comparison status and results.

**Response `200`** (completed)
```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "status": "completed",
    "prompt": {
      "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "content": "ما هي أفضل طريقة لتعلم اللغة العربية؟"
    },
    "category": {
      "id": "f4d5e6f7-a8b9-0123-cdef-234567890123",
      "key": "arabic_writing",
      "name_ar": "كتابة عربية",
      "name_en": "Arabic Writing",
      "source": "auto",
      "confidence": 0.82
    },
    "responses": [
      {
        "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
        "model": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "key": "gpt-4o",
          "name_ar": "GPT-4o",
          "provider": { "key": "openai", "name_ar": "OpenAI" }
        },
        "content": "يمكنك تعلم اللغة العربية من خلال...",
        "response_time_ms": 2340,
        "status": "success"
      },
      {
        "id": "a7b8c9d0-e1f2-3456-0123-567890123456",
        "model": {
          "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "key": "claude-3-5-sonnet",
          "name_ar": "Claude 3.5 Sonnet",
          "provider": { "key": "anthropic", "name_ar": "Anthropic" }
        },
        "content": "أنصحك بالبدء من...",
        "response_time_ms": 1890,
        "status": "success"
      }
    ],
    "vote": null,
    "created_at": "2025-06-07T12:00:00Z",
    "completed_at": "2025-06-07T12:00:45Z"
  }
}
```

**Status values**

| Status | Meaning |
|--------|---------|
| `pending` | Queued |
| `running` | Inference in progress |
| `completed` | All targets succeeded |
| `partial` | Some targets failed; successful responses available |
| `failed` | All targets failed |

**Partial failure example** (`status: "partial"`)
```json
{
  "responses": [
    {
      "id": "...",
      "model": { "key": "grok", "name_ar": "Grok" },
      "content": null,
      "status": "error",
      "error_message_ar": "تعذر الحصول على رد من هذا النموذج"
    }
  ]
}
```

---

#### `GET /comparisons/{comparison_id}/stream`

Server-Sent Events stream for incremental response delivery (Phase 1.5+).

**Events**
- `response.completed` — one model finished
- `comparison.completed` — all done
- `comparison.failed` — terminal failure

**MVP fallback**: Client polls `GET /comparisons/{id}` every 2s until `status` is terminal.

---

### 4.6 Votes

#### `POST /comparisons/{comparison_id}/votes`

Submit community preference for one response.

**Headers**
- `X-Session-Id` (required)

**Request body**
```json
{
  "response_id": "f6a7b8c9-d0e1-2345-f012-456789012345"
}
```

**Rules**
- Comparison must be `completed` or `partial`
- `response_id` must belong to this comparison with `status: success`
- One vote per `comparison_id` per `session_id`

**Response `201`**
```json
{
  "data": {
    "id": "b8c9d0e1-f2a3-4567-1234-678901234567",
    "comparison_id": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "response_id": "f6a7b8c9-d0e1-2345-f012-456789012345",
    "created_at": "2025-06-07T12:01:00Z"
  }
}
```

**Response `409`**
```json
{
  "error": {
    "code": "VOTE_ALREADY_CAST",
    "message": "لقد قمت بالتصويت مسبقاً على هذه المقارنة"
  }
}
```

---

#### `GET /comparisons/{comparison_id}/votes/me`

Check if current session has voted.

**Response `200`**
```json
{
  "data": {
    "has_voted": true,
    "vote": {
      "response_id": "f6a7b8c9-d0e1-2345-f012-456789012345",
      "created_at": "2025-06-07T12:01:00Z"
    }
  }
}
```

---

### 4.7 Analytics

All analytics endpoints return **preference shares (percentages)**—never rank, winner, or loser labels.

Supports two scopes:
- **Overall** — all votes across every category (default).
- **By category** — votes within a single category only (`category_key` or `category_id` query param).

#### `GET /analytics/preferences`

Community preference breakdown. Overall by default; filter by category for per-category shares.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | enum | `all_time` | `7d`, `30d`, `all_time` |
| `provider` | string | | Filter by provider key |
| `category_key` | string | | Filter to one category (e.g. `coding`). Omit for overall. |
| `category_id` | UUID | | Alternative to `category_key` |

**Response `200` (overall)**
```json
{
  "data": {
    "scope": "overall",
    "category": null,
    "disclaimer_ar": "هذه النسب تعكس تفضيلات المجتمع وليست تقييماً رسمياً للنماذج",
    "disclaimer_en": "These figures reflect community preferences, not official model evaluations",
    "period": "all_time",
    "total_votes": 12847,
    "preferences": [
      {
        "model_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "model_key": "gpt-4o",
        "name_ar": "GPT-4o",
        "provider_key": "openai",
        "vote_count": 4521,
        "preference_share_pct": 35.19
      }
    ]
  },
  "meta": {
    "sort": "name_ar_asc",
    "generated_at": "2025-06-07T12:00:00Z"
  }
}
```

**Response `200` (by category — `?category_key=coding`)**
```json
{
  "data": {
    "scope": "category",
    "category": {
      "id": "a9b8c7d6-e5f4-3210-abcd-ef1234567890",
      "key": "coding",
      "name_ar": "برمجة",
      "name_en": "Coding"
    },
    "disclaimer_ar": "هذه النسب تعكس تفضيلات المجتمع في فئة البرمجة فقط",
    "period": "all_time",
    "total_votes": 2140,
    "preferences": [
      {
        "model_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "model_key": "claude-3-5-sonnet",
        "name_ar": "Claude 3.5 Sonnet",
        "provider_key": "anthropic",
        "vote_count": 890,
        "preference_share_pct": 41.59
      }
    ]
  },
  "meta": {
    "sort": "name_ar_asc",
    "generated_at": "2025-06-07T12:00:00Z"
  }
}
```

**Contract**
- `preference_share_pct`: 0–100; sums to ≈ 100 within the active scope (overall or single category)
- Default client sort: **alphabetical by `name_ar`**—not by `preference_share_pct`
- Field names must not include `rank`, `winner`, `score`, or `rating`
- Per-category percentages are **not comparable across categories** (different denominators)

---

#### `GET /analytics/preferences/summary`

High-level breakdown: overall totals plus vote count and top-line share per category (for dashboard landing). Does **not** expose cross-category model ranks.

**Query parameters**: `period` (`7d`, `30d`, `all_time`)

**Response `200`**
```json
{
  "data": {
    "period": "30d",
    "overall": {
      "total_votes": 3200,
      "preferences": []
    },
    "by_category": [
      {
        "category": {
          "key": "coding",
          "name_ar": "برمجة",
          "name_en": "Coding"
        },
        "total_votes": 540,
        "preferences": []
      },
      {
        "category": {
          "key": "marketing",
          "name_ar": "تسويق",
          "name_en": "Marketing"
        },
        "total_votes": 310,
        "preferences": []
      }
    ]
  }
}
```

`preferences` arrays follow the same shape as `GET /analytics/preferences` (percentages only, sorted by `name_ar`).

---

#### `GET /analytics/preferences/{model_id}`

Preference share for a single model with context. Supports overall and per-category scope.

**Query parameters**: `period`, `category_key` (optional)

**Response `200`**
```json
{
  "data": {
    "model_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name_ar": "GPT-4o",
    "scope": "category",
    "category": {
      "key": "coding",
      "name_ar": "برمجة",
      "name_en": "Coding"
    },
    "period": "30d",
    "vote_count": 890,
    "total_votes_in_period": 3200,
    "preference_share_pct": 27.81,
    "disclaimer_ar": "هذه النسبة تعكس تفضيلات المجتمع خلال الفترة المحددة"
  }
}
```

---

#### `GET /analytics/trends` (Phase 2)

Weekly preference share over time (for charts—not a leaderboard).

**Query**: `?model_id=&weeks=12&category_key=` (category optional)

**Response `200`**
```json
{
  "data": {
    "model_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name_ar": "GPT-4o",
    "category": {
      "key": "coding",
      "name_ar": "برمجة"
    },
    "points": [
      { "week_start": "2025-05-26", "preference_share_pct": 32.1, "vote_count": 210 },
      { "week_start": "2025-06-02", "preference_share_pct": 34.5, "vote_count": 245 }
    ]
  }
}
```

---

### 4.8 Agents (Phase 5 — stub now)

#### `GET /agents`

List available agents (empty array in MVP).

**Response `200`**
```json
{
  "data": {
    "agents": []
  },
  "meta": {
    "coming_soon_ar": "دعم الوكلاء الذكيين قريباً"
  }
}
```

#### `POST /comparisons` (future extension)

Request body will accept `target_ids` polymorphic array:
```json
{
  "prompt": "...",
  "category_mode": "manual",
  "category_key": "research",
  "targets": [
    { "type": "model", "id": "uuid" },
    { "type": "agent", "id": "uuid" }
  ]
}
```
Total targets: 2–10. Backward compatible with `model_ids` until deprecation.

---

## 5. Webhooks (Phase 3+)

Not required for MVP. Future: `comparison.completed` for async integrations.

---

## 6. OpenAPI

- Auto-generated from FastAPI at `/v1/openapi.json`
- Frontend types generated via `openapi-typescript` in CI
- `API_SPEC.md` is the human-readable contract; OpenAPI is the machine-readable source of truth once implemented

---

## 7. CORS

| Origin | Methods |
|--------|---------|
| `https://arabbenchmark.ai` | GET, POST, OPTIONS |
| `http://localhost:3000` | GET, POST, OPTIONS (dev) |

---

## 8. Idempotency

| Endpoint | Key |
|----------|-----|
| `POST /comparisons` | Optional `Idempotency-Key` header (UUID); duplicate within 24h returns same comparison |
| `POST /comparisons/{id}/votes` | Implicit via `(comparison_id, session_id)` uniqueness |

---

## 9. Error Code Catalog

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Schema/field validation |
| `MODEL_COUNT_INVALID` | 400 | Fewer than 2 or more than 10 models |
| `CATEGORY_REQUIRED` | 400 | Missing category when `category_mode: manual` |
| `CATEGORY_INVALID` | 400 | Unknown or disabled `category_key` |
| `CATEGORY_DETECT_FAILED` | 422 | Auto-detect failed; client should retry or pick manually |
| `MODEL_NOT_AVAILABLE` | 422 | Disabled, placeholder, or unknown model |
| `COMPARISON_NOT_READY` | 422 | Vote before comparison complete |
| `RESPONSE_NOT_FOUND` | 404 | Invalid response_id for comparison |
| `VOTE_ALREADY_CAST` | 409 | Duplicate vote |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 503 | All providers failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. MVP Endpoint Checklist

| Method | Path | MVP |
|--------|------|-----|
| GET | `/health` | ✅ |
| GET | `/health/providers` | ✅ |
| POST | `/sessions` | ✅ |
| GET | `/categories` | ✅ |
| POST | `/categories/detect` | ✅ |
| GET | `/models` | ✅ |
| GET | `/models/{id}` | ✅ |
| POST | `/comparisons` | ✅ |
| GET | `/comparisons/{id}` | ✅ |
| POST | `/comparisons/{id}/votes` | ✅ |
| GET | `/comparisons/{id}/votes/me` | ✅ |
| GET | `/analytics/preferences` | ✅ |
| GET | `/analytics/preferences/summary` | ✅ |
| GET | `/analytics/preferences/{model_id}` | ✅ |
| GET | `/comparisons/{id}/stream` | ⏳ Phase 1.5 |
| GET | `/analytics/trends` | ⏳ Phase 2 |
| GET | `/agents` | ⏳ Phase 5 (stub returns `[]`) |
