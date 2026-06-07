# Production Deployment Guide

**Stack:** Frontend → Vercel · Backend → Render · Database → Supabase  
**Status:** Prepared — not deployed. Follow this guide when ready to go live.

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌──────────────────────┐
│  Vercel         │ ──────────────▶│  Render Web Service  │
│  Next.js 15     │  NEXT_PUBLIC_  │  FastAPI + Uvicorn   │
│  (frontend/)    │  API_URL       │  (backend/)          │
└─────────────────┘                └──────────┬───────────┘
                                              │ DATABASE_URL
                                              ▼
                                   ┌──────────────────────┐
                                   │  Supabase PostgreSQL │
                                   │  (migrations via     │
                                   │   Alembic on boot)   │
                                   └──────────────────────┘
```

| Service | URL pattern | Health / verify |
|---------|-------------|-----------------|
| Frontend | `https://<project>.vercel.app` | Home page loads, `/compare` works |
| Backend | `https://<service>.onrender.com` | `GET /v1/health` → `{ "data": { "status": "ok" } }` |
| Database | Supabase dashboard | Tables exist after first API boot |

---

## Prerequisites

- [ ] GitHub repo pushed (Render + Vercel connect via Git)
- [ ] Supabase project created (region close to Render — e.g. `eu-central-1` / Frankfurt)
- [ ] At least one AI provider API key (OpenAI recommended for category auto-detect)
- [ ] `openssl` or password manager to generate `SESSION_SECRET`
- [ ] Review `PRODUCTION_READINESS.md` — resolve **blockers** before public launch

---

## Step 1 — Supabase (Database)

### 1.1 Create project

1. [supabase.com](https://supabase.com) → **New project**
2. Choose region (recommend **Frankfurt** if Render uses `frankfurt`)
3. Save the database password securely

### 1.2 Get connection strings

In **Project Settings → Database → Connection string**:

| Use | Pooler mode | Port | When |
|-----|-------------|------|------|
| **Runtime (Render API)** | Session | `5432` | Long-running web service (recommended) |
| **Migrations (first deploy)** | Direct | `5432` | Alembic on container start — use **Direct** if Session pooler fails migrations |

Copy the **URI** format. Ensure `?sslmode=require` is present (Supabase often includes it).

**Example (Session pooler):**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

> **Note:** Do not use Transaction pooler (`:6543`) with SQLAlchemy's default connection pool unless you configure `NullPool`. Session pooler or Direct is simpler for this app.

### 1.3 Network access

- Supabase allows connections from anywhere by default (IPv4 add-on may be required on free tier for external hosts)
- If Render cannot connect, enable **Dedicated IPv4** in Supabase or check firewall settings

### 1.4 Verify after deploy

After backend first boot (migrations run automatically), confirm in **Table Editor**:

- `providers`, `models`, `prompt_categories` — seeded
- `comparisons`, `votes`, `responses` — empty

---

## Step 2 — Render (Backend API)

### 2.1 Option A — Blueprint (recommended)

1. Render Dashboard → **New → Blueprint**
2. Connect GitHub repo
3. Render reads `render.yaml` at repo root
4. Set **secret** env vars marked `sync: false` (see `ENV_CHECKLIST.md`)

### 2.2 Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Runtime** | Docker |
| **Root Directory** | *(leave empty — build from repo root)* |
| **Dockerfile Path** | `backend/Dockerfile` |
| **Docker Context** | `.` (repository root) |
| **Region** | Frankfurt (or closest to Supabase) |
| **Branch** | `main` |
| **Health Check Path** | `/v1/health` |
| **Auto-Deploy** | Yes |

**Start command:** handled by `backend/scripts/start-production.sh` (migrations + uvicorn).

### 2.3 Required environment variables

Set in Render → **Environment**. Full list in `ENV_CHECKLIST.md`.

Minimum:

```bash
DATABASE_URL=postgresql://...supabase...?sslmode=require
SESSION_SECRET=<64-char-hex>
CORS_ORIGINS=https://your-app.vercel.app
OPENAI_API_KEY=sk-...   # at least one provider key
```

Generate secret:
```bash
openssl rand -hex 32
```

### 2.4 First deploy behavior

1. Docker image builds from `backend/Dockerfile`
2. Container starts → `alembic upgrade head` (creates schema + seeds)
3. Uvicorn listens on Render's `PORT`

**Logs to watch:**
```
[start] Running database migrations...
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial
[start] Starting uvicorn on port 10000...
```

### 2.5 Verify backend

```bash
curl https://<your-service>.onrender.com/v1/health
```

Expected:
```json
{
  "data": { "status": "ok", "version": "1.0.0" },
  "meta": { "request_id": "..." }
}
```

Optional:
```bash
curl https://<your-service>.onrender.com/v1/models
```

### 2.6 Render free tier notes

- Service **spins down** after ~15 min idle → first request may take 30–60s (cold start)
- Background comparison inference runs in-process — cold starts can interrupt long jobs
- Upgrade to **Starter** ($7/mo) for always-on before public launch

---

## Step 3 — Vercel (Frontend)

### 3.1 Import project

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Import GitHub repo
3. **Root Directory:** `frontend` ← required (monorepo)
4. Framework: **Next.js** (auto-detected)

### 3.2 Build settings

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |
| Node.js Version | 20.x or 22.x |

`frontend/vercel.json` is included for region hint (`fra1`).

### 3.3 Environment variables

Set for **Production** (and optionally Preview):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://arab-benchmark-api.onrender.com/v1` |

> Must include `/v1` suffix — frontend client uses this as Axios `baseURL`.

### 3.4 Deploy

1. Click **Deploy**
2. Wait for build (`next build`)
3. Open production URL

### 3.5 Post-deploy: update CORS

Return to Render and ensure `CORS_ORIGINS` includes your **exact** Vercel URL:

```bash
CORS_ORIGINS=https://arab-benchmark-ai.vercel.app
```

For **Preview deployments**, add each preview origin manually, or deploy a custom domain only for production testing.

Redeploy Render after changing `CORS_ORIGINS`.

---

## Step 4 — End-to-End Smoke Test

Run in order after all three services are live:

| # | Action | Expected |
|---|--------|----------|
| 1 | Open Vercel URL `/` | Arabic RTL home page |
| 2 | Open `/compare` | Models and categories load |
| 3 | Submit comparison (2+ models) | Redirect to `/results/[id]` |
| 4 | Wait for responses | Cards fill in (may take 30s–2min) |
| 5 | Vote on a response | Success message |
| 6 | Open `/insights` | Analytics load (may be sparse initially) |
| 7 | Browser DevTools → Network | No CORS errors; API calls go to Render URL |

---

## Step 5 — Custom Domain (Optional)

### Vercel (frontend)

1. Vercel → Project → **Domains** → Add `www.yourdomain.com`
2. Configure DNS per Vercel instructions

### Render (backend)

1. Render → Service → **Settings → Custom Domains** → Add `api.yourdomain.com`
2. Update `NEXT_PUBLIC_API_URL` on Vercel:
   ```
   https://api.yourdomain.com/v1
   ```
3. Update `CORS_ORIGINS` on Render:
   ```
   https://www.yourdomain.com,https://yourdomain.com
   ```

---

## Local Production Smoke Test (Optional)

Test the production Docker image locally before deploying:

```bash
# From repo root — requires local Postgres or Supabase DATABASE_URL in env
docker build -f backend/Dockerfile -t arab-benchmark-api .

docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="local-test-secret" \
  -e CORS_ORIGINS="http://localhost:3000" \
  -e OPENAI_API_KEY="sk-..." \
  arab-benchmark-api
```

```bash
# Frontend pointing at local API
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/v1 npm run dev
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| CORS error in browser | `CORS_ORIGINS` missing Vercel URL | Add exact origin on Render, redeploy |
| `connection refused` to DB | Wrong `DATABASE_URL` or Supabase IPv4 | Verify URI, enable Supabase IPv4 add-on |
| Migrations fail on boot | Pooler incompatibility | Use **Direct** connection string for `DATABASE_URL` |
| 502 on first API call | Render cold start | Wait 60s, retry; or upgrade plan |
| Models list empty | Migration didn't run | Check Render logs for Alembic errors |
| Comparison stays "running" | Provider key missing / background task lost | Set API keys; see `PROJECT_AUDIT.md` C2 |
| 400 on compare | Session header issue | Ensure frontend uses latest `client.ts` |
| Vercel build fails | Wrong root directory | Set Root Directory = `frontend` |

---

## Files Reference

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint spec |
| `backend/Dockerfile` | Production image (migrations + API) |
| `backend/scripts/start-production.sh` | Migrate then start uvicorn |
| `frontend/vercel.json` | Vercel build hints |
| `backend/.env.production.example` | Backend env template |
| `frontend/.env.production.example` | Frontend env template |
| `ENV_CHECKLIST.md` | Complete env var checklist |
| `PRODUCTION_READINESS.md` | Pre-launch readiness checklist |

---

## Deployment Order

```
1. Supabase     → create project, copy DATABASE_URL
2. Render       → deploy API, set env vars, verify /v1/health
3. Vercel       → deploy frontend, set NEXT_PUBLIC_API_URL
4. Render       → update CORS_ORIGINS with Vercel URL
5. Smoke test   → full compare → vote → insights flow
```

Do **not** skip step 4 — the frontend will fail CORS without it.
