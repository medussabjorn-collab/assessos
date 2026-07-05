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
| DISC | ✅ Shipped | Short-form engine (2026-07-05): 12 forced-choice groups, most/least scoring, 16 profile labels, results persisted in `disc_results`, quiz + profile UI at `/dashboard/disc` |
| Basic AI scoring | ✅ Shipped | Sidecar plan dropped (2026-07-05) — the API calls Claude directly (`report-generator.service.ts`). Answers now persisted on submit and fed to scoring. **Set `ANTHROPIC_API_KEY` in Railway to activate**; reports mark `failed` otherwise |
| Code compiler | 🟡 Wired | Judge0 integration shipped (2026-07-05) — real execution for Python/JS/Java/C++, fails loudly when unconfigured. **Set `JUDGE0_URL` (+ `JUDGE0_API_KEY` for RapidAPI) in Railway to activate** |

**Phase 1 exit criteria:** all code shipped ✅. Activation needs two Railway env vars: `ANTHROPIC_API_KEY` (reports) and `JUDGE0_URL` (code execution).

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
| ~~AI report generation~~ — done 2026-07-05 (in-API Claude call, no sidecar) | 1 |
| ~~Real code execution (Judge0)~~ — done 2026-07-05 | 1 |
| PDF report download ([ReportView.tsx:53](apps/web/components/ReportView.tsx)) | 1 |
| ~~Answers persisted with sessions~~ — done 2026-07-05 | 2 (audit trail) |
| Usage metrics storage ([billing.service.ts:161](apps/api/src/modules/billing/billing.service.ts)) | 5 |
| White-label DNS/SSL provisioning ([white-label.service.ts:82](apps/api/src/modules/tenant/white-label.service.ts)) | 5 |
| Practice/coding stats persistence (progress service returns constants) | 3 |
