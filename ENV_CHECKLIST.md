# Environment Variable Checklist

Use this when configuring **Supabase**, **Render**, and **Vercel**.  
Templates: `backend/.env.production.example`, `frontend/.env.production.example`

---

## Quick Reference

| Variable | Service | Required | Secret |
|----------|---------|----------|--------|
| `DATABASE_URL` | Render | ✅ | ✅ |
| `SESSION_SECRET` | Render | ✅ | ✅ |
| `CORS_ORIGINS` | Render | ✅ | ❌ |
| `NEXT_PUBLIC_API_URL` | Vercel | ✅ | ❌ |
| `OPENAI_API_KEY` | Render | ⚠️ | ✅ |
| `ANTHROPIC_API_KEY` | Render | ⚠️ | ✅ |
| `GOOGLE_API_KEY` | Render | ⚠️ | ✅ |
| `DEEPSEEK_API_KEY` | Render | ⚠️ | ✅ |
| `QWEN_API_KEY` | Render | ⚠️ | ✅ |
| `XAI_API_KEY` | Render | ⚠️ | ✅ |
| `ALLAM_API_KEY` | Render | ❌ | ✅ |
| `APP_VERSION` | Render | ❌ | ❌ |
| `CATEGORY_CLASSIFIER_MODEL` | Render | ❌ | ❌ |
| `CATEGORY_CONFIDENCE_THRESHOLD` | Render | ❌ | ❌ |
| `DEEPSEEK_BASE_URL` | Render | ❌ | ❌ |
| `QWEN_BASE_URL` | Render | ❌ | ❌ |
| `XAI_BASE_URL` | Render | ❌ | ❌ |

⚠️ = At least **one** provider key required for live model responses. OpenAI key also powers category auto-detect.

---

## Render (Backend API)

### Required — block deploy verification if missing

- [ ] **`DATABASE_URL`**
  - **Source:** Supabase → Settings → Database → Connection string (URI)
  - **Format:** `postgresql://postgres.[REF]:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
  - **Notes:**
    - Use Session pooler or Direct connection (see `DEPLOYMENT.md`)
    - Never commit to git
    - Render injects no default — must be set manually

- [ ] **`SESSION_SECRET`**
  - **Generate:** `openssl rand -hex 32`
  - **Min length:** 32+ random bytes
  - **Notes:** Currently defined in config but not fully enforced in app — still set a strong value before launch (see `PRODUCTION_READINESS.md`)

- [ ] **`CORS_ORIGINS`**
  - **Format:** Comma-separated origins, **no trailing slashes**
  - **Production example:**
    ```
    https://arab-benchmark-ai.vercel.app,https://www.yourdomain.com
    ```
  - **Local dev example:**
    ```
    http://localhost:3000,http://127.0.0.1:3000
    ```
  - **Notes:**
    - Must include every frontend origin that calls the API
    - Preview URLs (`*.vercel.app`) must be added individually
    - Wildcards are **not** supported by FastAPI CORSMiddleware

### Provider keys — required for live comparisons

Set keys for each provider you want available. Models without a key will fail at inference time.

- [ ] **`OPENAI_API_KEY`** — GPT models + category auto-detect
- [ ] **`ANTHROPIC_API_KEY`** — Claude models
- [ ] **`GOOGLE_API_KEY`** — Gemini models
- [ ] **`DEEPSEEK_API_KEY`** — DeepSeek models
- [ ] **`QWEN_API_KEY`** — Qwen models
- [ ] **`XAI_API_KEY`** — Grok models
- [ ] **`ALLAM_API_KEY`** — ALLaM (placeholder; optional)

### Optional — sensible defaults exist

- [ ] **`APP_VERSION`** — default `1.0.0`; exposed in `/v1/health`
- [ ] **`CATEGORY_CLASSIFIER_MODEL`** — default `gpt-4o-mini`
- [ ] **`CATEGORY_CONFIDENCE_THRESHOLD`** — default `0.6`
- [ ] **`DEEPSEEK_BASE_URL`** — default `https://api.deepseek.com`
- [ ] **`QWEN_BASE_URL`** — default `https://dashscope.aliyuncs.com/compatible-mode/v1`
- [ ] **`XAI_BASE_URL`** — default `https://api.x.ai/v1`

### Auto-injected by Render (do not set manually)

- [ ] **`PORT`** — Render sets this; `start-production.sh` uses it for uvicorn

### Not configurable via env (hardcoded in app)

These exist in `config.py` but have **no env override** today:

| Setting | Default | Notes |
|---------|---------|-------|
| `max_prompt_length` | 4000 | Code change needed to tune |
| `min_models` / `max_models` | 2 / 10 | Code change needed to tune |
| Rate limits | 10/hr comparisons, etc. | In-memory; see readiness checklist |

---

## Vercel (Frontend)

### Required

- [ ] **`NEXT_PUBLIC_API_URL`**
  - **Format:** Full backend base URL **including** `/v1` prefix
  - **Production example:**
    ```
    https://arab-benchmark-api.onrender.com/v1
    ```
  - **Custom domain example:**
    ```
    https://api.yourdomain.com/v1
    ```
  - **Notes:**
    - `NEXT_PUBLIC_` prefix exposes value to browser — never put secrets here
    - Rebuild required after changing (Vercel auto-rebuilds on env change)
    - Set for **Production**; optionally duplicate for **Preview** with same or staging API

### Not required

| Variable | Notes |
|----------|-------|
| `NODE_ENV` | Set automatically by Vercel |
| `VERCEL_URL` | Auto-injected; not used by this app |

---

## Supabase (Database)

Supabase does not use application env files. Configure via dashboard:

- [ ] **Database password** — saved in password manager
- [ ] **Connection string** — copied into Render `DATABASE_URL`
- [ ] **IPv4 add-on** — enable if Render cannot reach DB (free tier)
- [ ] **Backups** — enable Point-in-Time Recovery on paid plan for production
- [ ] **RLS** — not used by this app (API connects as `postgres` service role); do not expose service role key to frontend

### Supabase keys — do NOT put in Vercel

| Key | Where it belongs |
|-----|------------------|
| `service_role` | Never in frontend |
| `anon` key | Not used (no Supabase client in frontend) |
| Database URI | Render only (`DATABASE_URL`) |

---

## Local Development

| File | Copy from |
|------|-----------|
| `backend/.env` | `backend/.env.example` |
| `frontend/.env.local` | `frontend/.env.local.example` |

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

---

## Security Checklist for Secrets

- [ ] `.gitignore` excludes `.env`, `.env.local`, `backend/.env` (root `.gitignore` added)
- [ ] No secrets in `render.yaml` values (only `sync: false` placeholders)
- [ ] No `NEXT_PUBLIC_` variables contain API keys
- [ ] Render secrets marked as **Secret** type in dashboard
- [ ] Rotate `SESSION_SECRET` if ever leaked
- [ ] Rotate provider keys if ever committed — check `git log` before first public deploy

---

## Environment Matrix by Stage

| Variable | Local | Preview | Production |
|----------|-------|---------|------------|
| `DATABASE_URL` | localhost Postgres | Supabase (staging project recommended) | Supabase production |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://*-git-*.vercel.app` (add exact URL) | Production Vercel + custom domain |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/v1` | Staging Render URL | Production Render URL |
| `SESSION_SECRET` | dev value OK | unique per env | unique, 32+ bytes random |
| Provider keys | personal dev keys | staging keys or shared | production billing keys |

**Recommendation:** Use separate Supabase projects for staging and production.

---

## Verification Commands

After setting env vars:

```bash
# Backend health
curl -s "$API_BASE/health" | jq .

# CORS (replace ORIGIN)
curl -s -X OPTIONS "$API_BASE/comparisons" \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" -I

# Frontend env baked at build — check in browser console:
# fetch(process.env not available) — instead verify Network tab base URL
```

---

## Copy-Paste Setup Sheet

Fill in before deploy:

```
=== SUPABASE ===
Project ref:     ____________________
Region:          ____________________
DATABASE_URL:    postgresql://_________________________________

=== RENDER ===
Service URL:     https://____________________.onrender.com
SESSION_SECRET:  ____________________________________________
CORS_ORIGINS:    ____________________________________________
OPENAI_API_KEY:  sk-_________________________________________
(other keys):    ____________________________________________

=== VERCEL ===
Project URL:     https://____________________.vercel.app
NEXT_PUBLIC_API_URL: https://____________________.onrender.com/v1
```
