# Revised Implementation Roadmap (With Advanced Features)

| Phase | Timeline | Features | Priority |
|-------|----------|----------|----------|
| Phase 1 (MVP) | TBD | Leadership + Tech hiring, DISC, basic AI scoring, Code compiler | 🔴 Must-have |
| Phase 2 (Compliance) | TBD | Bias audit engine, EEOC/NYC compliance, GDPR explanations | 🔴 Critical for 2026 |
| Phase 3 (Predictive) | TBD | Retention/promotion ML models, talent analytics dashboard | 🟡 High-value |
| Phase 4 (Campus + Non-IT) | TBD | Bulk hiring, specialized Non-IT modules, VR simulations | 🟡 Market expansion |
| Phase 5 (Enterprise) | TBD | ATS/HRIS integrations, white-label marketplace, API ecosystem | 🟢 Scale |
| Phase 6 (AI Innovation) | TBD | Generative AI scenarios, real-time AI interview bot, AR assessments | 🔵 Differentiation |

---

## Phase 1 (MVP) — current state vs. target

Audited against the codebase (2026-07-05):

| Feature | Status | Gap |
|---------|--------|-----|
| Leadership assessment | ✅ Shipped | Sessions, configs, AI reports persisted in Postgres; deployed on Railway |
| Tech hiring | ✅ Shipped | `Candidate` table in Postgres (2026-07-05); pipeline CRUD, stage transitions, dashboard counts, and top-candidates all read real rows. Offer letters / background checks still stubbed |
| DISC | ❌ Not built | Only passing mentions in seed data and question library. No DISC assessment engine, scoring, or profile output |
| Basic AI scoring | 🟡 Partial | AI report pipeline exists (`dimensionScores`, percentile, narrative) but the AI sidecar is **not deployed** — `AI_SIDECAR_URL` defaults to localhost |
| Code compiler | ❌ Mock | `code-execution.service.ts` returns `Math.random()` pass/fail. Needs Judge0 API or Docker sandbox for real execution |

**Phase 1 exit criteria:** ~~Candidate table migrated~~ ✅, DISC engine shipped, AI sidecar deployed, real code execution wired.

## Phase 2 (Compliance) — notes

- Nothing compliance-specific exists yet. Groundwork present: multi-tenant isolation (`TenantMiddleware`), role-based access (`org_admin` / `super_admin`), report audit trail via `AiReport` rows.
- NYC Local Law 144 requires annual independent bias audits for automated employment decision tools — the bias audit engine must log score distributions by protected class to be auditable.
- GDPR Art. 22 explanations: the `narrative` field in `AiReport` is a start; needs per-dimension "why this score" reasoning.

## Phase 3–6 — dependencies

- **Phase 3 (Predictive)** depends on Phase 1 candidate persistence — no ML without historical hiring outcomes stored.
- **Phase 4 (Campus)** bulk hiring depends on Phase 2 compliance — bulk automated screening is exactly what EEOC/NYC audits target.
- **Phase 5 (Enterprise)** white-label groundwork already exists (`white-label.service.ts` — DNS/SSL provisioning still stubbed). Billing/usage tracking TODOs in `billing.service.ts` block usage-based pricing.
- **Phase 6 (AI Innovation)** real-time interview bot can build on the existing interviews module (rooms, feedback flow already scaffolded).

## Existing backlog folded into phases

| Item | Phase |
|------|-------|
| ~~Candidate table in Prisma~~ — done 2026-07-05 | 1 |
| Deploy AI sidecar to Railway | 1 |
| Real code execution (Judge0/sandbox) | 1 |
| PDF report download ([ReportView.tsx:53](apps/web/components/ReportView.tsx)) | 1 |
| Answers table in reports ([reporting.service.ts:62](apps/api/src/modules/reporting/reporting.service.ts)) | 2 (audit trail) |
| Usage metrics storage ([billing.service.ts:161](apps/api/src/modules/billing/billing.service.ts)) | 5 |
| White-label DNS/SSL provisioning ([white-label.service.ts:82](apps/api/src/modules/tenant/white-label.service.ts)) | 5 |
| Practice/coding stats persistence (progress service returns constants) | 3 |
