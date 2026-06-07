# Arab Benchmark AI — Complete Folder Structure

Production-ready monorepo layout optimized for **fast MVP delivery**, **clean separation of concerns**, and **future extension** (new models, agents, analytics) without rewrites.

**Design rules**
- One repo, two deployable apps (`frontend`, `backend`).
- Providers and analytics live in dedicated backend modules—not microservices.
- Database migrations are version-controlled separately from application code.
- Agent support is scaffolded with empty/stub folders—no premature implementation.
- No shared npm/pip package until duplication proves painful (YAGNI).

---

## Top-Level Layout

```
arab-benchmark-ai/
├── frontend/                   # Next.js app (Vercel)
├── backend/                    # FastAPI app (Railway / Fly.io)
├── database/                   # PostgreSQL migrations, seeds, views
├── infrastructure/             # Docker, CI/CD, deploy configs
├── docs/                       # Architecture & product docs (existing *.md)
├── .github/                    # GitHub Actions workflows
├── .env.example                # Root env template (non-secret keys only)
├── docker-compose.yml          # Local dev: API + Postgres (+ Redis later)
├── Makefile                    # Shortcuts: dev, migrate, test, lint
└── README.md                   # Setup instructions
```

---

## Frontend (`/frontend`)

Next.js 14+ App Router, TypeScript, TailwindCSS. Arabic-first RTL.

```
frontend/
├── public/
│   ├── fonts/                  # Arabic web fonts (IBM Plex Sans Arabic, etc.)
│   └── icons/
├── src/
│   ├── app/                    # App Router pages & layouts
│   │   ├── layout.tsx          # Root layout: dir="rtl", font, providers
│   │   ├── page.tsx            # Home / new comparison
│   │   ├── compare/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Comparison results + voting
│   │   ├── analytics/
│   │   │   ├── page.tsx        # Overall preferences dashboard
│   │   │   └── [categoryKey]/
│   │   │       └── page.tsx    # Per-category preferences
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Primitives: Button, Input, Card, Badge, Skeleton
│   │   ├── layout/             # Header, Footer, Container, RTL helpers
│   │   ├── comparison/         # PromptInput, ModelPicker, ResponseGrid, LatencyBadge
│   │   ├── categories/         # CategoryPicker, AutoDetectToggle, CategoryBadge
│   │   ├── voting/             # VoteButton, VoteConfirmation
│   │   ├── analytics/          # PreferenceBar, CategoryFilter, DisclaimerBanner
│   │   └── agents/             # (Phase 5) TraceViewer, AgentPicker — stub only
│   ├── features/               # Feature-level hooks + orchestration
│   │   ├── comparison/
│   │   │   ├── use-comparison.ts
│   │   │   └── use-comparison-poll.ts
│   │   ├── categories/
│   │   │   └── use-category-detect.ts
│   │   ├── voting/
│   │   │   └── use-vote.ts
│   │   └── analytics/
│   │       └── use-preferences.ts
│   ├── lib/
│   │   ├── api/                # Typed API client (generated from OpenAPI)
│   │   │   ├── client.ts
│   │   │   └── types.ts        # Generated; do not hand-edit
│   │   ├── session.ts          # X-Session-Id / cookie handling
│   │   └── utils.ts
│   ├── i18n/
│   │   ├── ar.ts               # Arabic strings (MVP sole locale)
│   │   └── index.ts
│   └── types/                  # Frontend-only types (UI state, form shapes)
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── eslint.config.mjs
```

**MVP scope**: Implement `components/`, `features/`, and pages through `analytics/`. Leave `components/agents/` as an empty placeholder with a README stub.

**Future models**: No frontend changes beyond API types—`ModelPicker` reads from `GET /models`.

**Future agents**: Add `AgentPicker`, extend `ModelPicker` → `TargetPicker` in Phase 5.

---

## Backend (`/backend`)

FastAPI + Python 3.12+. Single process at MVP; workers added in Phase 4.

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, lifespan, CORS
│   ├── api/
│   │   ├── router.py           # Mounts all v1 routers
│   │   └── v1/
│   │       ├── health.py
│   │       ├── sessions.py
│   │       ├── categories.py
│   │       ├── models.py
│   │       ├── comparisons.py
│   │       ├── votes.py
│   │       ├── analytics.py
│   │       └── agents.py       # Phase 5 stub (returns empty list)
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (env vars)
│   │   ├── dependencies.py     # DB session, session_id, rate limit deps
│   │   ├── exceptions.py       # App errors → HTTP responses
│   │   ├── middleware.py       # Request ID, logging, CORS
│   │   └── security.py         # Rate limits, input sanitization
│   ├── domain/                 # Pure business rules (no I/O)
│   │   ├── comparison.py       # 2–10 model validation, status transitions
│   │   ├── voting.py           # Vote eligibility rules
│   │   ├── categories.py       # Category key validation, fallback rules
│   │   └── targets.py          # InferenceTarget abstraction (model | agent)
│   ├── models/                 # SQLAlchemy ORM models (DB rows)
│   │   ├── provider.py
│   │   ├── model.py
│   │   ├── category.py
│   │   ├── prompt.py
│   │   ├── comparison.py
│   │   ├── response.py
│   │   ├── vote.py
│   │   ├── user.py
│   │   └── agent.py            # Phase 5; table exists, unused in MVP
│   ├── schemas/                # Pydantic request/response DTOs
│   │   ├── category.py
│   │   ├── comparison.py
│   │   ├── vote.py
│   │   ├── analytics.py
│   │   ├── model.py
│   │   └── agent.py
│   ├── repositories/           # DB queries (one file per aggregate)
│   │   ├── category_repo.py
│   │   ├── comparison_repo.py
│   │   ├── vote_repo.py
│   │   ├── model_repo.py
│   │   └── analytics_repo.py
│   ├── services/               # Orchestration layer
│   │   ├── comparison_service.py
│   │   ├── vote_service.py
│   │   ├── category_service.py # Manual resolve + auto-detect dispatch
│   │   └── session_service.py
│   ├── providers/              # ★ Provider adapter layer (see below)
│   ├── analytics/              # ★ Analytics layer (see below)
│   └── agents/                 # ★ Agent runtime layer (Phase 5 stub)
│       ├── registry.py         # Agent catalog (reads DB)
│       ├── base.py             # AgentAdapter protocol
│       └── README.md           # "Phase 5 — not implemented"
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── providers/          # Adapter contract tests with mocked HTTP
│   ├── integration/
│   │   ├── api/
│   │   └── analytics/
│   └── conftest.py
├── alembic.ini                 # Points to /database/migrations (or symlink)
├── pyproject.toml              # Dependencies, ruff, pytest
├── Dockerfile
└── .env.example
```

**Layer flow** (strict one-direction):

```
api/v1  →  services  →  repositories  →  models (ORM)
              ↓
         providers / analytics / agents
              ↓
           domain (pure rules)
```

Routes never call providers or repositories directly.

---

## Providers (`/backend/app/providers`)

One subfolder per vendor. Adding a model = config row + optional adapter tweak.

```
backend/app/providers/
├── __init__.py                 # ProviderRegistry: key → adapter instance
├── base.py                     # ProviderAdapter protocol + shared types
├── registry.py                 # Loads enabled providers from config/DB
├── circuit_breaker.py          # Per-provider failure tracking
├── openai/
│   ├── __init__.py
│   └── adapter.py              # GPT models
├── anthropic/
│   ├── __init__.py
│   └── adapter.py              # Claude models
├── google/
│   ├── __init__.py
│   └── adapter.py              # Gemini models
├── deepseek/
│   ├── __init__.py
│   └── adapter.py
├── qwen/                       # Phase 2
│   ├── __init__.py
│   └── adapter.py
├── xai/                        # Phase 2 (Grok)
│   ├── __init__.py
│   └── adapter.py
└── allam/                      # Stub until API available
    ├── __init__.py
    └── adapter.py              # Returns structured unavailable response
```

**Adapter contract** (`base.py`):

| Method | Purpose |
|--------|---------|
| `complete(prompt, model_key, options)` | Single-turn inference |
| `list_models()` | Models this adapter serves |
| `health_check()` | Latency probe for `/health/providers` |

**Adding a new model family**: Create folder + adapter, register in `registry.py`, seed `providers` + `models` rows in `/database/seeds`.

**Future agents**: Agents call providers internally; they do not replace this layer.

---

## Analytics (`/backend/app/analytics`)

Separated from comparison orchestration. Reads votes; never calls LLM providers (except category classifier lives in `category_service`, not here).

```
backend/app/analytics/
├── __init__.py
├── queries/
│   ├── overall.py              # v_preference_stats equivalent
│   ├── by_category.py          # v_preference_stats_by_category equivalent
│   └── summary.py              # Overall + per-category vote counts
├── service.py                  # AnalyticsService: cache-aware public API
├── cache.py                    # Redis wrapper (no-op / in-memory stub in MVP)
├── rollups/                    # Phase 4 pre-aggregation
│   ├── __init__.py
│   ├── refresh.py              # Job to update preference_rollups
│   └── README.md               # "Phase 4 — enable when vote volume warrants"
└── serializers.py              # Shape API responses; enforce no-rank sort
```

**Rules**
- All percentage calculations live here—not in route handlers.
- `serializers.py` sorts by `name_ar` ascending before returning; never exposes rank fields.
- Category scope: `scope=overall` vs `scope=category` set explicitly in responses.

**MVP**: `queries/` runs live SQL via `analytics_repo.py`. `cache.py` is a pass-through. `rollups/` is a stub.

**Phase 2+**: Wire Redis in `cache.py`. Phase 4: implement `rollups/refresh.py` as a scheduled job.

---

## Agents (`/backend/app/agents`) — Phase 5 Stub

Scaffolded now to avoid folder churn later. MVP ships empty handlers only.

```
backend/app/agents/
├── __init__.py
├── base.py                     # AgentAdapter protocol (run → structured trace)
├── registry.py                 # key → adapter; reads agents table
├── runtime/                    # Future: step loop, tool dispatch
│   └── README.md
└── adapters/                   # Future: one folder per agent implementation
    └── README.md
```

**AgentAdapter contract** (future):

| Method | Purpose |
|--------|---------|
| `run(prompt, agent_key, config)` | Multi-step execution → final answer + trace JSONB |
| `list_agents()` | Enabled agents for picker |

Comparison service will call `targets.py` to dispatch to either `providers/` or `agents/` based on `InferenceTarget.type`.

---

## Database (`/database`)

Schema source of truth. Alembic migrations live here; backend references them.

```
database/
├── migrations/
│   ├── env.py                  # Alembic env; imports backend ORM models
│   ├── script.py.mako
│   └── versions/
│       ├── 001_providers_models.py
│       ├── 002_prompt_categories.py
│       ├── 003_comparisons_responses.py
│       ├── 004_votes.py
│       ├── 005_users.py
│       ├── 006_preference_rollups.py   # Phase 4
│       └── 007_agents.py               # Phase 5
├── seeds/
│   ├── providers.sql
│   ├── models.sql
│   └── prompt_categories.sql   # 8 fixed categories
├── views/
│   ├── v_preference_stats.sql
│   └── v_preference_stats_by_category.sql
└── README.md                   # How to run migrations locally
```

**Local dev flow**

```bash
make migrate    # alembic upgrade head
make seed       # psql seeds (idempotent)
```

**Conventions**
- One migration per logical change; never edit applied migrations.
- Seeds are idempotent (`INSERT ... ON CONFLICT DO NOTHING`).
- Views defined in SQL files and applied by migration for reproducibility.

---

## Infrastructure (`/infrastructure`)

Minimal at MVP; grows with scale phases.

```
infrastructure/
├── docker/
│   ├── Dockerfile.api          # Production API image (or use backend/Dockerfile)
│   └── Dockerfile.frontend     # Optional; Vercel handles frontend in prod
├── compose/
│   ├── docker-compose.yml      # Dev: postgres + api (+ redis in Phase 2)
│   └── docker-compose.test.yml # CI: postgres only for integration tests
├── github/                     # Reference copies; live workflows in /.github
│   └── README.md
├── deploy/
│   ├── railway.toml            # API deploy config (or fly.toml)
│   ├── vercel.json             # Frontend headers, env, rewrites to API
│   └── README.md               # Environment promotion: dev → staging → prod
├── monitoring/                 # Phase 2+
│   ├── prometheus.yml
│   └── grafana/
│       └── dashboards/
│           └── api-overview.json
└── scripts/
    ├── wait-for-postgres.sh
    ├── run-migrations.sh
    └── seed-db.sh
```

**Root `docker-compose.yml`** symlinks or includes `infrastructure/compose/docker-compose.yml` for convenience.

---

## CI/CD (`.github/`)

```
.github/
├── workflows/
│   ├── ci.yml                  # Lint + test on PR
│   ├── deploy-staging.yml      # Auto-deploy staging on merge to main
│   └── deploy-prod.yml         # Manual dispatch or tag trigger
└── PULL_REQUEST_TEMPLATE.md
```

**CI jobs (single workflow, parallel jobs)**

| Job | Runs |
|-----|------|
| `frontend-lint` | ESLint, TypeScript check |
| `frontend-build` | `next build` |
| `backend-lint` | Ruff |
| `backend-test` | pytest (unit + integration with compose postgres) |
| `openapi-sync` | Verify generated frontend types match backend spec |

---

## Environment Variables

```
# .env.example (root — documents all services)

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/v1

# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/arab_benchmark
REDIS_URL=                      # Empty in MVP; set in Phase 2
SESSION_SECRET=
CATEGORY_CLASSIFIER_MODEL=gpt-4o-mini

# Provider keys (backend only — never expose to frontend)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
QWEN_API_KEY=
XAI_API_KEY=
ALLAM_API_KEY=
```

---

## What We Deliberately Omit (MVP)

| Omit | Why |
|------|-----|
| `/packages/shared` monorepo lib | Two apps; duplication not yet painful |
| Separate analytics microservice | SQL + service module is enough until 100K+ votes |
| Event bus / Kafka | Postgres + optional Redis is sufficient |
| `backend/app/workers/` | Add in Phase 4 with ARQ/Celery when needed |
| Terraform | Platform dashboards (Railway, Vercel, Neon) for MVP |
| `frontend/src/pages/` (Pages Router) | App Router only |

---

## Extension Guide

### Add a new AI model (same provider)
1. Insert row in `database/seeds/models.sql`
2. Run seed / migration if new config columns needed
3. No code change if model uses existing adapter

### Add a new provider (new vendor)
1. Create `backend/app/providers/{vendor}/adapter.py`
2. Register in `providers/registry.py`
3. Seed `providers` + `models` rows
4. Add API key to env + infrastructure secrets

### Add AI agents (Phase 5)
1. Apply migration `007_agents.py`
2. Implement `agents/base.py` + first adapter in `agents/adapters/`
3. Extend `domain/targets.py` dispatch in `comparison_service.py`
4. Activate `frontend/src/components/agents/`
5. Extend `analytics/queries/` to include agent targets

### Scale analytics (Phase 4)
1. Implement `analytics/rollups/refresh.py`
2. Enable Redis in `analytics/cache.py`
3. Add read replica connection in `core/config.py`

---

## Document Index

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System design |
| `DATABASE_SCHEMA.md` | Table definitions |
| `API_SPEC.md` | REST contract |
| `ROADMAP.md` | Phased delivery |
| `COMPLETE_FOLDER_STRUCTURE.md` | This file |
| `PROJECT_CONTEXT.md` | Product source of truth |
