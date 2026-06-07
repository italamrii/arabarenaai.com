# Arab Benchmark AI — Product & Engineering Roadmap

This roadmap optimizes for **startup execution speed**: ship a credible Arabic-first comparison experience in weeks, then layer scale, providers, and agents without architectural rewrites.

**Guiding metrics**
| Phase | North-star | Guardrail |
|-------|------------|-----------|
| MVP | First 100 comparisons with votes | &lt; 45s p95 for 4-model comparison |
| Growth | 1,000 weekly active voters | Provider error rate &lt; 2% |
| Scale | Sub-second analytics at 100K+ votes | Inference cost per comparison tracked |

---

## Phase 0 — Foundation (Week 1)

**Goal**: Repo scaffold, contracts, and deployable skeleton—no user-facing features yet.

| Deliverable | Owner | Done when |
|-------------|-------|-----------|
| Monorepo structure (`/frontend`, `/backend`, `/database`) | Eng | See `COMPLETE_FOLDER_STRUCTURE.md`; CI green on lint + typecheck |
| PostgreSQL schema migrated (core tables + `prompt_categories` seed) | Eng | See `DATABASE_SCHEMA.md` v1 applied |
| OpenAPI spec drafted | Eng | `API_SPEC.md` matches stub routes |
| Provider adapter interface defined | Eng | Contract doc + stub implementations |
| Arabic RTL shell page | Eng | Default `dir="rtl"`, placeholder copy |
| Dev/staging environments | Eng | Frontend + API + DB reachable |

**Exit criteria**: `GET /health` returns 200; empty comparison page renders in Arabic.

---

## Phase 1 — MVP Core (Weeks 2–4)

**Goal**: End-to-end flow—prompt → category → 2–10 models → responses → vote → overall and per-category percentages.

### 1.1 Comparison flow
- [ ] Prompt input (Arabic, max length enforced)
- [ ] **Category picker**: manual selection from 8 fixed categories
- [ ] **Auto-detect toggle**: `POST /categories/detect` preview; user may override before submit
- [ ] Model picker with 2–10 validation
- [ ] Parallel inference for **GPT, Claude, Gemini, DeepSeek** (4 providers)
- [ ] Side-by-side response view with per-model latency badge
- [ ] Resolved category shown on comparison results
- [ ] Loading states (per-model skeletons; partial results as they arrive)
- [ ] Error states per model (no full-page failure)

### 1.2 Voting
- [ ] Single vote per comparison per session
- [ ] Vote confirmation UX (no "you picked the winner" language)
- [ ] Idempotent vote API

### 1.3 Analytics (overall + by category)
- [ ] **Overall** preference percentages per model (all time)
- [ ] **By category** preference percentages (`GET /analytics/preferences?category_key=`)
- [ ] Analytics summary dashboard (`GET /analytics/preferences/summary`) — overall + per-category vote counts
- [ ] Category filter UI on analytics page
- [ ] Disclaimer copy: community preferences, not official rankings
- [ ] Percentages only—no rank numbers (#1, #2); sort by `name_ar`, not share

### 1.4 Data capture (per `PROJECT_CONTEXT.md`)
- [ ] Store: prompts, responses, votes, response_time, selected models
- [ ] Store: category (`category_id`, `category_source`, `category_confidence`)

### 1.5 ALLaM placeholder
- [ ] Model appears in catalog as "قريباً"
- [ ] Stub adapter; excluded from live comparisons unless explicitly enabled by admin flag

**Exit criteria**: Internal team completes 50 real Arabic comparisons across at least 3 categories; votes reflected in overall and per-category analytics within 60s.

**Defer**: User accounts, Redis, date-range analytics filters, Qwen, Grok.

---

## Phase 2 — Provider Expansion & Polish (Weeks 5–7)

**Goal**: Full initial model lineup + UX polish + light scale prep.

### 2.1 Additional providers
- [ ] Qwen (DashScope)
- [ ] Grok (xAI)
- [ ] ALLaM integration (when API contract + credentials available; else remain stub)

### 2.2 Analytics v1 (time filters)
- [ ] Filter by date range (7d, 30d, all time) for overall and per-category views
- [ ] Per-model preference share with vote count (not rank)
- [ ] Optional: breakdown by prompt length bucket

### 2.3 UX & Arabic polish
- [ ] Responsive mobile layout
- [ ] Accessibility pass (keyboard nav, ARIA for RTL)
- [ ] Shareable comparison link (read-only, no vote on shared view—or vote with new session)

### 2.4 Reliability
- [ ] Provider health dashboard (internal)
- [ ] Circuit breaker per provider
- [ ] Structured logging + basic metrics

### 2.5 Performance
- [ ] Redis for analytics cache
- [ ] DB indexes validated under load test (1K comparisons)

**Exit criteria**: All 7 model families represented (6 live + ALLaM stub or live); p95 &lt; 45s for 6-model comparison.

---

## Phase 3 — Community & Growth (Weeks 8–10)

**Goal**: Retention hooks and trust—still no leaderboard framing.

| Feature | Rationale |
|---------|-----------|
| Optional user accounts (OAuth) | Save comparison history |
| Public comparison gallery (opt-in) | Organic discovery |
| Admin panel | Enable/disable models, feature flags |
| Rate limiting + abuse detection | Protect inference budget |
| Email waitlist / feedback widget | Community input loop |

**Analytics v2**
- [ ] Weekly trend lines by model (overall and per category)
- [ ] Export CSV for researchers (aggregated only, no PII)

**Exit criteria**: 500+ registered or session users; &lt; 1% duplicate vote rate.

---

## Phase 4 — Scale & Cost Control (Weeks 11–14)

**Goal**: Handle 10K DAU without re-architecture.

- [ ] API horizontal scaling (2+ replicas)
- [ ] PgBouncer / connection pooling
- [ ] Read replica for analytics queries
- [ ] `preference_rollups` pre-aggregation table
- [ ] Background job queue for slow providers (ARQ/Celery)
- [ ] Inference budget alerts per provider
- [ ] CDN caching for static analytics pages (ISR on Next.js)

**Exit criteria**: Load test 500 concurrent comparisons; analytics p95 &lt; 500ms.

---

## Phase 5 — AI Agents (Weeks 15+)

**Goal**: Compare agents alongside models using the same vote + preference UX.

### 5.1 Foundation
- [ ] `InferenceTarget` abstraction (`model` | `agent`)
- [ ] `responses.content` JSONB for multi-step traces
- [ ] Agent registry (name, description, config schema)

### 5.2 Agent providers
- [ ] First agent runtime integration (e.g., tool-using GPT agent)
- [ ] Trace viewer UI (collapsible steps; vote on final answer default)

### 5.3 Analytics
- [ ] Preference percentages include agent targets alongside models
- [ ] Separate filters: models only / agents only / mixed

**Exit criteria**: One published agent comparison type with community voting and percentage breakdown.

**Open decisions** (resolve before Phase 5 build)
1. Vote on final answer vs. full trace?
2. Max agent steps / timeout?
3. Mixed comparisons (5 models + 2 agents)—still cap at 10 targets?

---

## Cross-Cutting Concerns (All Phases)

| Concern | Phase 1 | Phase 2+ |
|---------|---------|----------|
| Security | CORS, input limits, secrets in env | Auth, audit logs |
| i18n | Arabic only | English optional |
| Testing | Provider contract tests, API integration | Load tests, E2E (Playwright) |
| Docs | README, API spec | Runbooks for provider outages |
| Legal | Terms: community preferences disclaimer | Privacy policy for accounts |

---

## Prioritization Framework

When scope conflicts arise, prioritize in this order:

1. **Correctness** — Vote integrity, data accuracy, no misleading rank language
2. **Arabic UX** — RTL, copy, prompt handling
3. **Core loop** — Compare → vote → see overall and per-category percentages
4. **Categories** — Every comparison categorized; auto-detect with manual override
5. **Provider coverage** — More models after loop is solid
6. **Performance** — When metrics justify investment
7. **Agents** — After model comparison is proven and scaled

---

## Milestone Summary

| Milestone | Target | Key outcome |
|-----------|--------|-------------|
| **M0** | Week 1 | Deployable skeleton |
| **M1** | Week 4 | MVP with 4 providers + categories + voting + overall & per-category analytics |
| **M2** | Week 7 | 7 model families + Redis cache |
| **M3** | Week 10 | Accounts, gallery, analytics v2 |
| **M4** | Week 14 | 10K DAU-ready infrastructure |
| **M5** | Week 15+ | Agent comparisons (beta) |

---

## Out of Scope (2025)

- Automated Arabic NLU evaluation / BLEU-style scoring
- Model fine-tuning or hosting
- Enterprise SSO / on-prem
- Native iOS/Android apps
- Paid tiers (revisit after PMF signal)
