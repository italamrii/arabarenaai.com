# Arab Benchmark AI

Arabic-first platform for comparing AI models on Arabic prompts with community preference analytics.

## Backend (Phase 1)

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Provider API keys in environment variables (optional for local dev without live inference)

### Setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
make install
cd frontend && npm install
make docker-up          # or use your own Postgres instance
make migrate
```

**Backend:** `make dev` → http://localhost:8000  
**Frontend:** `make dev-frontend` → http://localhost:3000

### Migrations

```bash
cd backend && alembic upgrade head
```

### Architecture docs

See `ARCHITECTURE.md`, `API_SPEC.md`, `DATABASE_SCHEMA.md`, and `COMPLETE_FOLDER_STRUCTURE.md`.

### Production deployment

| Doc | Purpose |
|-----|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Step-by-step: Vercel + Render + Supabase |
| [ENV_CHECKLIST.md](./ENV_CHECKLIST.md) | Environment variable checklist |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | Pre-launch readiness checklist |
| [OBSERVABILITY.md](./OBSERVABILITY.md) | Logging, metrics, health diagnostics |

Config artifacts: `render.yaml`, `frontend/vercel.json`, `backend/Dockerfile`, `backend/scripts/start-production.sh`.
