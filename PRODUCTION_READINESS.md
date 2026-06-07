# Production Readiness Checklist

**Target stack:** Vercel + Render + Supabase  
**Last updated:** June 2025  
**Overall status:** 🟡 **Not ready for public launch** — ready for **controlled beta** after blockers below

Use this checklist before and after following `DEPLOYMENT.md`.  
Cross-referenced with `PROJECT_AUDIT.md`.

---

## How to Use

| Symbol | Meaning |
|--------|---------|
| 🔴 **Blocker** | Must fix or accept risk before public launch |
| 🟠 **High** | Fix before marketing / open beta |
| 🟡 **Medium** | Fix within first month of production |
| 🟢 **Done** | Already in place |
| ⬜ **Todo** | Not yet complete |

---

## 1. Infrastructure & Deployment

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Production Dockerfile with migrations | `backend/Dockerfile` + `start-production.sh` |
| 🟢 | Render Blueprint | `render.yaml` |
| 🟢 | Vercel config | `frontend/vercel.json`, root dir = `frontend` |
| 🟢 | Deployment guide | `DEPLOYMENT.md` |
| 🟢 | Env checklist | `ENV_CHECKLIST.md` |
| 🟢 | Root `.gitignore` | Excludes `.env`, secrets |
| ⬜ | CI/CD pipeline | No GitHub Actions yet |
| ⬜ | Staging environment | Separate Supabase + Render + Vercel preview recommended |
| ⬜ | Custom domains + TLS | Optional for beta |
| ⬜ | Uptime monitoring | e.g. Better Uptime, Render health checks |
| 🟠 | Render always-on plan | Free tier cold starts break UX and background inference |
| 🟡 | PgBouncer / connection limits | Monitor Supabase connection count under load |

---

## 2. Database (Supabase)

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Schema migration exists | `001_initial` with seeds |
| 🟢 | Auto-migrate on deploy | Via `start-production.sh` |
| ⬜ | Migration run verified on Supabase | Run once in staging |
| ⬜ | Backups enabled | PITR on paid Supabase plan |
| ⬜ | Connection string tested from Render IP | IPv4 add-on if needed |
| 🟡 | `preference_rollups` table | Documented but not migrated — analytics uses live SQL |
| 🟡 | Prompt retention policy | Plaintext prompts stored indefinitely |
| 🟡 | Separate staging database | Strongly recommended |

**Pre-launch DB verification:**

- [ ] `SELECT COUNT(*) FROM models;` — expect 7+ seeded models
- [ ] `SELECT COUNT(*) FROM prompt_categories;` — expect 8 categories
- [ ] `SELECT COUNT(*) FROM providers;` — expect 7 providers

---

## 3. Backend API (Render)

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Health endpoint | `GET /v1/health` |
| 🟢 | CORS configurable | `CORS_ORIGINS` env var |
| 🟢 | Provider adapter layer | OpenAI, Anthropic, Google, etc. |
| 🔴 | Analytics rate limiting broken | `analytics.py` — missing `Depends()` |
| 🔴 | Comparisons stuck in `running` | No timeout / failure recovery on background tasks |
| 🔴 | Vote race → 500 | No `IntegrityError` handling |
| 🔴 | Session auth cosmetic | `SESSION_SECRET` unused; client-trusted UUID |
| 🟠 | In-memory rate limiter | Won't work correctly with multiple Render instances |
| 🟠 | BackgroundTasks lost on restart | Deploy/restart kills in-flight comparisons |
| 🟠 | No global 500 error handler | May leak stack traces |
| 🟠 | `period` query param no-op | Analytics date filter not implemented |
| 🟡 | Sync SQLAlchemy in async routes | OK at low traffic |
| 🟡 | Provider health endpoint public | `/v1/health/providers` — info disclosure |

**Pre-launch API verification:**

- [ ] `GET /v1/health` returns 200
- [ ] `GET /v1/models` returns seeded models
- [ ] `POST /v1/comparisons` with 2 models → 202
- [ ] Comparison reaches `completed` or `partial` (not stuck `running`)
- [ ] `POST /v1/votes` → 201; duplicate vote → 409 (currently 500 — fix first)
- [ ] `GET /v1/analytics/preferences/summary` rate-limited (currently not — fix first)
- [ ] CORS allows Vercel origin only

---

## 4. Frontend (Vercel)

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Arabic RTL UI | Dark theme, IBM Plex Sans Arabic |
| 🟢 | API client with session header | `lib/api/client.ts` |
| 🟢 | Premium compare/results UX | Sticky CTA, progress bar, vote flow |
| 🟢 | `NEXT_PUBLIC_API_URL` configurable | Build-time env |
| 🟠 | No error boundaries on all pages | Some silent failures |
| 🟠 | Polling never times out | Stuck comparisons poll forever |
| 🟡 | No `loading.tsx` / `not-found.tsx` | Next.js conventions |
| 🟡 | Accessibility gaps | Vote cards improved; more ARIA needed |
| 🟡 | No security headers (CSP) | Add via `next.config.ts` or Vercel headers |
| 🟢 | Category manual override fix | `categoryManual` flag on compare page |

**Pre-launch frontend verification:**

- [ ] Production build succeeds (`npm run build`)
- [ ] `/compare` loads models and categories from Render API
- [ ] Full flow: compare → results → vote → insights
- [ ] No mixed-content warnings (HTTPS → HTTPS only)
- [ ] Mobile layout acceptable on `/compare` and `/results`

---

## 5. Security

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Secrets in env vars (not code) | Render/Vercel dashboard |
| 🟢 | `.gitignore` for env files | Root `.gitignore` |
| 🔴 | No real session binding | Spoofable `X-Session-Id` |
| 🔴 | Analytics scraping unbounded | Rate limit bug |
| 🟠 | Comparison UUID enumerable | Anyone with ID reads prompt |
| 🟠 | Default `SESSION_SECRET` in code | Overridden in prod, but weak fallback |
| 🟠 | Google API key in URL query | Provider adapter |
| 🟠 | `X-Forwarded-For` trusted | IP spoofing for rate limits |
| 🟡 | No CAPTCHA / bot protection | Anonymous API |
| 🟡 | No HSTS / CSP headers | Add before public launch |
| ⬜ | Dependency audit | `npm audit`, `pip audit` before launch |
| ⬜ | Secret scanning on repo | Enable GitHub secret scanning |

**Minimum security bar for public launch:**

- [ ] Fix analytics rate limiting
- [ ] Strong `SESSION_SECRET` set (even if not yet enforced in code)
- [ ] `CORS_ORIGINS` locked to known domains
- [ ] All provider keys in Render secrets only
- [ ] Accept session model limitations OR implement signed sessions

---

## 6. Performance & Scalability

| Status | Item | Notes |
|--------|------|-------|
| 🟡 | Analytics N+1 queries | Per-category loops |
| 🟡 | No analytics cache | Stub only |
| 🟡 | New HTTP client per provider call | Connection overhead |
| 🟠 | Single Render instance | No horizontal scaling |
| 🟠 | Inference cost unbounded | Per-session limits only |
| 🟡 | Recharts bundle size | Insights page |
| ⬜ | Load test baseline | e.g. 50 concurrent comparisons |

**Render + Supabase sizing (beta):**

| Traffic | Render plan | Supabase plan |
|---------|-------------|---------------|
| < 100 DAU | Starter | Free / Pro |
| 100–1K DAU | Standard | Pro |
| 1K+ DAU | Standard+ / job queue | Pro + connection pooler tuning |

---

## 7. Observability

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Request ID middleware | `X-Request-Id` |
| 🟢 | Structured JSON request logging | `LOG_FORMAT=json`, events `http.request.*` |
| 🟢 | Provider latency tracking | Per-provider avg/min/max in metrics |
| 🟢 | Comparison duration tracking | `comparison.inference.*` events + metrics |
| 🟢 | Provider failure tracking | Failures, error types, circuit breaker state |
| 🟢 | Health diagnostics endpoint | `GET /v1/health/diagnostics` |
| 🟢 | Render health check configured | `/v1/health` in `render.yaml` |
| 🟢 | Observability guide | [OBSERVABILITY.md](./OBSERVABILITY.md) |
| 🟡 | In-memory metrics only | Resets on deploy; not multi-replica |
| ⬜ | Error tracking | Sentry recommended |
| ⬜ | Log aggregation service | Render logs only |
| ⬜ | Database query monitoring | Supabase dashboard |
| ⬜ | Cost alerts | Provider API spend caps |
| 🟡 | Diagnostics endpoint public | Restrict in Phase 2 |

---

## 8. Testing & Quality

| Status | Item | Notes |
|--------|------|-------|
| 🔴 | Minimal test coverage | ~3 backend unit tests, 0 frontend tests |
| ⬜ | API integration tests | Compare, vote, analytics |
| ⬜ | Smoke test script | Post-deploy automation |
| ⬜ | Lint in CI | `ruff`, `next lint` |
| ⬜ | Type check in CI | `tsc --noEmit` |

**Recommended before launch:**

- [ ] Manual smoke test checklist in `DEPLOYMENT.md` Step 4
- [ ] Run `make test` — all pass
- [ ] Run `cd frontend && npm run build` — no errors

---

## 9. Legal & Product

| Status | Item | Notes |
|--------|------|-------|
| 🟢 | Community preference disclaimer | UI + API copy |
| 🟢 | No winner/loser language | Product rule enforced |
| ⬜ | Privacy policy | Prompts stored in plaintext |
| ⬜ | Terms of service | |
| ⬜ | Provider ToS compliance | OpenAI, Anthropic, etc. data policies |
| ⬜ | Arabic content moderation | No filter on prompts/responses |

---

## 10. Launch Decision Matrix

### ✅ Ready for **private / team beta** when:

- [ ] All `DEPLOYMENT.md` steps complete
- [ ] `ENV_CHECKLIST.md` required vars set
- [ ] Smoke test passes end-to-end
- [ ] Render on **Starter** plan (avoid cold starts)
- [ ] At least one provider API key configured
- [ ] Team aware of known bugs (audit critical items)

### ⛔ **Not ready for public launch** until:

- [ ] Analytics rate limiting fixed (C1)
- [ ] Comparison failure / timeout handling (C2)
- [ ] Vote `IntegrityError` → 409 (C4)
- [ ] Session abuse mitigations documented or implemented (C3)
- [ ] Basic error states on frontend (H-F1)
- [ ] Privacy policy published (if collecting prompts)
- [ ] CI runs tests on PRs

---

## 11. Post-Deploy Monitoring (First 48 Hours)

| Check | Frequency | Action if failing |
|-------|-----------|-------------------|
| Render health `/v1/health` | Every 5 min | Check logs, DB connection |
| Supabase connections | Daily | Scale pool or upgrade plan |
| Provider error rate | Daily | Check API keys, quotas |
| Stuck `running` comparisons | Daily | Query DB, fix C2 |
| Render memory / CPU | Daily | Upgrade plan |
| Vercel build status | On each deploy | Fix build errors |
| Provider API bill | Daily | Set spend caps |

**SQL — find stuck comparisons:**
```sql
SELECT id, status, created_at
FROM comparisons
WHERE status IN ('pending', 'running')
  AND created_at < NOW() - INTERVAL '30 minutes';
```

---

## 12. Rollback Plan

| Component | Rollback method |
|-----------|-----------------|
| Frontend | Vercel → Deployments → Promote previous |
| Backend | Render → Deploys → Rollback to previous image |
| Database | Supabase → Backups → Restore (last resort; prefer forward-fix migrations) |
| Env vars | Render/Vercel → revert to previous values → redeploy |

**Never** run `alembic downgrade` in production without a tested backup.

---

## Summary Scorecard

| Area | Status | Blockers |
|------|--------|----------|
| Deployment artifacts | 🟢 Ready | 0 |
| Database | 🟡 Mostly ready | Verify on Supabase |
| Backend reliability | 🔴 Not ready | 4 critical bugs |
| Frontend | 🟡 Beta-ready | Error handling |
| Security | 🔴 Not ready | Session + rate limits |
| Testing | 🔴 Not ready | Coverage |
| Observability | 🟡 Minimal | No Sentry |

**Recommended path:**

1. Deploy to staging using `DEPLOYMENT.md`
2. Run smoke tests
3. Fix 🔴 blockers from `PROJECT_AUDIT.md`
4. Re-run this checklist
5. Public launch

---

## Related Documents

- [DEPLOYMENT.md](./DEPLOYMENT.md) — step-by-step deploy guide
- [ENV_CHECKLIST.md](./ENV_CHECKLIST.md) — environment variables
- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) — full technical audit
- [API_SPEC.md](./API_SPEC.md) — API contract reference
