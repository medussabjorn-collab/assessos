# AssessOS — Multi-Tenant SaaS Assessment Platform
**Design Spec · v1.0 · 2026-06-14**

---

## 1. Product Vision

AssessOS is a multi-tenant SaaS assessment platform built around six product pillars:

| # | Pillar | Audience |
|---|--------|----------|
| 1 | **Leadership Assessment** ← V1 | Enterprise HR / L&D / CHRO |
| 2 | Hiring Assessments | Enterprise Recruiters / TA |
| 3 | Practice & Interview Prep | Individuals / B2C |
| 4 | Live Interviews | Companies / Interviewers |
| 5 | Gamified Coding | Developers / B2C |
| 6 | Hackathons | Community / Companies |

V1 delivers the **shared platform foundation** plus the complete **Leadership Assessment** pillar. Each subsequent pillar is a separate spec → plan → implementation cycle layered onto the same foundation.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Leadership use cases | Pre-hire screening + Development + Succession (full suite) | Enterprise positioning, higher ACV |
| Competency framework | 8 Leadership Dimensions (Korn Ferry–aligned) | Industry credibility, ships fast |
| AI depth | All 4 levels — Scoring, Narrative, Benchmarking, Coaching Plans | Core differentiator; full suite in V1 |
| Go-to-market | PLG + Enterprise (Free / Pro / Enterprise tiers) | Self-serve traction → enterprise upsell |
| Architecture | Modular monolith + AI sidecar + microservices-ready boundaries | Monolith speed, AI isolation, extract later |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│  CLIENT LAYER                                        │
│  Next.js 14 (App Router) · Tailwind · shadcn/ui     │
│  Recharts · Firebase Auth SDK                        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────┐
│  API GATEWAY — NestJS :3000                          │
│  JWT Validation · Tenant Resolution Middleware       │
│  RBAC Guard · Rate Limiting (Redis) · Helmet/CORS   │
└──────────────────────┬──────────────────────────────┘
                       │ Internal routing
┌──────────────────────▼──────────────────────────────┐
│  CORE MODULES — NestJS Modular Monolith              │
│  AuthModule · TenantModule · UsersModule             │
│  AssessmentModule · LeadershipModule                 │
│  ReportingModule · AnalyticsModule                   │
│  BillingModule · NotificationsModule · StorageModule │
│                                                      │
│  [Microservices-ready: strict module boundaries,     │
│   own service + repository per module, no cross-     │
│   module DB queries. Extract to NestJS TCP/Redis     │
│   microservice without logic changes.]               │
└────────┬─────────────────────────┬───────────────────┘
         │ REST / gRPC              │ SQS async jobs
┌────────▼────────┐      ┌─────────▼──────────────────┐
│  AI SIDECAR     │      │  DATA LAYER                 │
│  FastAPI/Python │      │  PostgreSQL (RDS) — primary │
│  :8000          │      │  Redis (ElastiCache) — cache│
│  Azure OpenAI   │      │  S3 — media / PDFs          │
│  GPT-4o         │      └─────────────────────────────┘
└─────────────────┘
```

### Infrastructure (AWS)
- **Compute:** ECS Fargate — core API container + AI sidecar container (independent scaling)
- **Frontend:** CloudFront + S3 (Next.js static export / ISR)
- **Queue:** SQS — async AI report generation jobs
- **Secrets:** AWS Secrets Manager
- **Observability:** CloudWatch + X-Ray tracing
- **Load balancer:** ALB

---

## 4. Multi-Tenant Data Model

### Strategy
**Shared database, shared schema, `tenant_id` on every row.** Tenant isolation enforced at the NestJS middleware layer — not at the DB layer — for V1 simplicity. Upgrade path: `schema-per-tenant` or `db-per-tenant` switchable via `tenant.isolation_mode` flag per account without application code changes.

### Tenant Isolation Middleware
Every request passes through `TenantMiddleware` before reaching any controller:
```ts
// Runs before every route
const tenantId = req.headers['x-tenant-id'] ?? extractFromJWT(req);
if (!tenantId) throw new UnauthorizedException();
req.tenantId = tenantId; // injected into all services via REQUEST scope

// All repository calls auto-append: WHERE tenant_id = :tenantId
// Enforced by BaseRepository abstract class — no raw SQL without tenant filter
```

### Core Tables

**`tenants`** — `id` · `slug` (UNIQUE) · `name` · `plan` (free|pro|enterprise) · `white_label` (jsonb) · `sso_config` (jsonb) · `settings` (jsonb) · `created_at`

**`users`** — `id` · `tenant_id` (RLS) · `firebase_uid` (UNIQUE) · `email` · `name` · `role` (enum, IDX) · `department` · `metadata` (jsonb)

**`assessment_sessions`** — `id` · `tenant_id` (RLS) · `user_id` (FK) · `config_id` (FK) · `pillar` (leadership|hiring|…) · `status` (pending|active|done) · `started_at` · `submitted_at`

**`assessment_configs`** — `id` · `tenant_id` (RLS) · `pillar` · `dimensions` (jsonb[]) · `time_limit_min` · `pass_mark` · `ai_proctoring` · `benchmark_group`

**`ai_reports`** — `id` · `tenant_id` (RLS) · `session_id` (FK) · `dimension_scores` (jsonb) · `narrative` (text) · `benchmark_percentile` · `recommendation` (hire|develop|watch) · `coaching_plan` (jsonb)

**`subscriptions`** — `id` · `tenant_id` (RLS) · `stripe_customer_id` · `stripe_sub_id` · `plan` · `seats` · `assessment_credits` · `renews_at`

### RBAC — 4 Roles

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| `super_admin` | All tenants | Provision/suspend tenants, platform analytics, billing override |
| `org_admin` | Own tenant | Manage users & roles, configure assessments, all reports, white-label |
| `manager` | Own team | Launch assessments, view team reports, export PDFs, succession pipeline |
| `employee` | Own data | Take assessments, view own report, access coaching plan |

---

## 5. Leadership Assessment Module

### 8 Competency Dimensions (96 questions total)

| # | Dimension | Questions | Weight in Index |
|---|-----------|-----------|-----------------|
| 1 | Strategic Thinking | 15 | 20% |
| 2 | People Development | 12 | 15% |
| 3 | Results Orientation | 12 | 20% |
| 4 | Change Agility | 10 | 8% |
| 5 | Emotional Intelligence | 15 | 10% |
| 6 | Communication & Influence | 12 | 7% |
| 7 | Decision Making | 10 | 20% |
| 8 | Integrity & Values | 10 | floor rule* |

*Floor rule: if Integrity score < 60, Leadership Index is capped at 55 regardless of other scores. Weights configurable per tenant by `org_admin`.

### AI Pipeline — 6 Steps

**Step 1 — Session Submission (sync)**
Candidate submits. Responses, timings, proctoring signals written to PostgreSQL. Job enqueued to SQS.

**Step 2 — Dimension Scoring (async worker, NestJS)**
`LeadershipModule` scores each dimension using weighted rubrics. Anti-cheat flags computed: response time anomalies, tab-switch events, copy-paste detection.

**Step 3 — Narrative Generation (async, AI sidecar)**
Scores + raw responses sent to FastAPI sidecar. One structured GPT-4o call per dimension (8 calls in parallel) → narrative paragraph per dimension. One summary call = 9 Azure OpenAI calls total per report (~8–12s). Streamed to `ai_reports` as generated.

**Prompt structure:**
```
system:  "You are an expert leadership psychologist..."
context: { role, level, industry, tenant_benchmark_group }
input:   { dimension, score, raw_responses[], time_per_question[] }
output:  { narrative: string, strengths: string[], gaps: string[], coaching_focus: boolean }
```
Structured JSON output schema enforced — no free-form hallucination risk.

**Step 4 — Benchmarking Engine (async)**
Scores compared against `benchmark_group` (role + level + industry) stored in `analytics_competency_snapshots`. PostgreSQL `PERCENT_RANK()` window function computes percentile. AI call generates Hire / Develop / Watch recommendation with rationale.

**Step 5 — Coaching Plan (async, AI sidecar)**
Weakest 2–3 dimensions identified. Separate GPT-4o call generates a structured 90-day plan: weekly focus areas, curated resources, milestone check-ins. Stored as `jsonb` in `ai_reports.coaching_plan`.

**Step 6 — Finalise + Notify + PDF**
Report status → `ready`. WebSocket push to manager and candidate dashboards. Puppeteer renders PDF server-side, uploads to S3, presigned URL emailed via `NotificationsModule`.

---

## 6. Analytics Engine

### Leadership Index Formula
```
Leadership Index =
  (Strategic × 0.20) +
  (Results   × 0.20) +
  (Decision  × 0.20) +
  (PeopleDev × 0.15) +
  (EQ        × 0.10) +
  (ChangeAgi × 0.08) +
  (Comms     × 0.07)

IF Integrity < 60 → cap index at 55
```
Weights stored in `assessment_configs.dimensions` jsonb — configurable per tenant by `org_admin`.

### Precompute Pipeline
1. **Trigger:** On each `ai_report` status → `ready` (event) + nightly cron at 02:00 UTC
2. **Materialise:** `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_competency_averages` and `mv_leadership_index` (non-blocking)
3. **Cache:** Serialise snapshot to Redis with 1-hour TTL per `tenant_id`
4. **Serve:** `AnalyticsModule` reads from Redis → falls back to PostgreSQL on cache miss

### Analytics Tables

**`analytics_competency_snapshots`** — `tenant_id` · `dimension` · `cohort` (all|dept|role|level) · `avg_score` · `p25/p50/p75` · `n` (sample size) · `computed_at`

**`analytics_leadership_index`** — `tenant_id` · `user_id` · `leadership_index` · `percentile_rank` (vs tenant cohort) · `industry_percentile` (vs global benchmark) · `trend` (delta vs last session) · `succession_tier` (A|B|C|watch)

### Dashboard Metrics Served
- Org Leadership Index (with QoQ trend delta)
- Avg score per competency across any cohort filter (all / dept / role / level)
- Percentile ranking — individual vs tenant cohort vs industry benchmark
- Succession pipeline — ranked leaderboard with Tier A/B/C/Watch badges
- Org-wide gap flags — bottom 2 dimensions highlighted for L&D investment

---

## 7. Repo Structure

```
assessos/                          # pnpm monorepo
├── apps/
│   ├── web/                       # Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/            # login, register, forgot-password
│   │   │   ├── (dashboard)/       # role-based shells: candidate, manager, admin
│   │   │   └── (assessment)/      # live assessment flow
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/                   # api client, auth helpers
│   ├── api/                       # NestJS modular monolith
│   │   ├── src/
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── tenant/
│   │   │       ├── users/
│   │   │       ├── assessment/
│   │   │       ├── leadership/
│   │   │       ├── reporting/
│   │   │       ├── analytics/
│   │   │       ├── billing/
│   │   │       ├── notifications/
│   │   │       └── storage/
│   │   ├── prisma/                # schema + migrations
│   │   └── test/
│   └── ai-service/                # FastAPI Python sidecar
│       ├── app/
│       │   ├── routers/           # /score, /narrative, /benchmark, /coaching
│       │   ├── prompts/           # prompt template registry
│       │   └── schemas/           # pydantic request/response schemas
│       └── requirements.txt
├── packages/
│   ├── types/                     # shared TypeScript types (tenant, user, report…)
│   ├── ui/                        # shared React component library
│   └── config/                    # eslint, tsconfig, tailwind base configs
├── infra/
│   ├── terraform/                 # ECS, RDS, ElastiCache, S3, SQS, CloudFront
│   └── docker-compose.yml         # local dev: postgres, redis, localstack
└── .github/
    └── workflows/
        ├── ci.yml                 # lint + test + type-check on PR
        └── deploy.yml             # ECS deploy on main merge
```

---

## 8. V1 Build Plan — 12 Weeks

### Phase 1 · Weeks 1–2 · Foundation
- [ ] Monorepo scaffold (pnpm workspaces, shared packages, CI/CD)
- [ ] Firebase Auth integration + JWT middleware
- [ ] RBAC guard — 4 roles enforced at route level
- [ ] `TenantMiddleware` + `BaseRepository` with tenant_id auto-filter
- [ ] PostgreSQL schema + Prisma migrations: tenants, users, subscriptions
- [ ] Next.js shell — auth flow, role-based routing, layout shells
- [ ] Docker Compose local dev (Postgres, Redis, LocalStack)

**Deliverable:** Any user can register/login. Tenant isolation enforced. CI green.

### Phase 2 · Weeks 3–4 · Assessment Core
- [ ] `AssessmentModule` — configs, sessions, question bank API
- [ ] `LeadershipModule` — 8 dimensions, question types, weighted scoring
- [ ] Candidate assessment UI — timer, tab-switch detection, submit flow
- [ ] Anti-cheat: response time logging, proctoring signal capture
- [ ] Migrate existing question bank from v1 codebase (96 questions)

**Deliverable:** Candidate logs in, takes full 8-dimension leadership assessment, submits.

### Phase 3 · Weeks 5–6 · AI Pipeline
- [ ] FastAPI AI sidecar scaffold — Azure OpenAI client, health check
- [ ] Prompt template registry — narrative, recommendation, coaching plan
- [ ] SQS worker in NestJS — picks up jobs, orchestrates AI sidecar calls
- [ ] `ai_reports` table + `ReportingModule` — store + serve reports
- [ ] Puppeteer PDF generation → S3 upload → presigned URL email
- [ ] Report dashboard UI — dimension scores, narrative, benchmark, coaching plan

**Deliverable:** Full AI report generated end-to-end within 30s of submission.

### Phase 4 · Weeks 7–8 · Analytics Engine
- [ ] `AnalyticsModule` + materialized views (`mv_competency_averages`, `mv_leadership_index`)
- [ ] Leadership Index formula implementation + percentile ranking
- [ ] Redis caching layer — snapshot serialisation, TTL invalidation
- [ ] Succession tier assignment AI call (A/B/C/Watch)
- [ ] Org analytics dashboard — KPIs, competency chart, succession pipeline
- [ ] Nightly cron job (EventBridge → SQS → worker)

**Deliverable:** CHRO/org_admin sees real-time leadership health dashboard with succession intelligence.

### Phase 5 · Weeks 9–10 · Multi-Tenant SaaS
- [ ] Tenant self-serve signup + onboarding wizard (5 steps)
- [ ] Stripe integration — Free / Pro / Enterprise plan checkout + webhooks
- [ ] White-label settings — logo, brand colours, custom domain (CNAME)
- [ ] Super admin portal — provision/suspend tenants, usage metrics, billing override
- [ ] SSO config — SAML/OIDC for enterprise tenants (Auth0 enterprise connections)

**Deliverable:** New org self-serves, pays, and launches first assessment in under 10 minutes.

### Phase 6 · Weeks 11–12 · Production Hardening
- [ ] AWS ECS Fargate deployment (Terraform) — API + AI sidecar
- [ ] CloudFront + S3 for Next.js, ALB for API
- [ ] RDS PostgreSQL (Multi-AZ) + ElastiCache Redis production setup
- [ ] CloudWatch dashboards + X-Ray tracing + PagerDuty alerting
- [ ] k6 load test — target: 500 concurrent assessment sessions
- [ ] Penetration test + security audit (OWASP Top 10)
- [ ] Seed global benchmark data — industry norms for Leadership Index percentiles

**Deliverable:** Production launch — multi-tenant, observable, load-tested, secure.

---

## 9. Non-Goals for V1

- Pillars 2–6 (Hiring, Practice, Live Interviews, Gamified Coding, Hackathons) — separate specs
- Mobile native apps (iOS/Android) — responsive web only
- On-premise / self-hosted deployment
- Video interview recording (Phase 4+ feature)
- Custom question builder for `org_admin` — configurable weights only in V1

---

## 10. Key Risks

| Risk | Mitigation |
|------|-----------|
| Azure OpenAI latency spikes | Async SQS queue — UI shows "generating" state, WebSocket push on completion |
| GPT-4o cost at scale | Structured output + cached prompts; benchmark 1000 reports/month in cost model before launch |
| Tenant data leak | `BaseRepository` enforces tenant_id on every query; integration tests assert cross-tenant isolation |
| Puppeteer PDF memory in ECS | Separate ECS task definition for PDF worker with higher memory allocation |
| Benchmark data cold start | Seed synthetic industry norms at launch; replace with real data as volume grows |
