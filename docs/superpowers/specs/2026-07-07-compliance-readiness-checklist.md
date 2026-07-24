# Compliance Readiness Checklist — SOC2 Type II / EEOC / NYC LL144
**Compliance Spec · v1.0 · 2026-07-07**

Tracks [#9](https://github.com/medussabjorn-collab/assessos/issues/9). Companion to [2026-07-07-leadership-platform-gap-analysis.md](2026-07-07-leadership-platform-gap-analysis.md) (P0) and:
- [#7](https://github.com/medussabjorn-collab/assessos/issues/7) — bias audit, shipped: `apps/api/src/modules/compliance/bias-audit.service.ts`
- [#8](https://github.com/medussabjorn-collab/assessos/issues/8) — validation study design: [2026-07-07-predictive-model-validation-study.md](2026-07-07-predictive-model-validation-study.md)

**This is a process/readiness doc, not an implementation.** SOC2 Type II is an external audit-firm engagement; EEOC/NYC LL144 compliance is partly legal process, partly the engineering work already tracked in #7/#8. This checklist separates what's engineering-actionable today from what needs a decision (audit firm, legal counsel) before any code gets written.

---

## 1. NYC Local Law 144

Applies to any "automated employment decision tool" (AEDT) used to substantially assist or replace discretionary decision-making for NYC-based candidates/employees.

| Requirement | Status | Owner |
|---|---|---|
| Annual bias audit by independent auditor, published summary | 🟡 Engine built ([#7](https://github.com/medussabjorn-collab/assessos/issues/7)); "independent auditor" + "published" are process steps, not code | Open question: internal vs external auditor — see §4 |
| Candidate notice ≥10 business days before AEDT use | 🔴 Not built | Needs a notice/consent flow in the hiring pipeline (`apps/api/src/modules/hiring`) — not scoped in this pass |
| Alternative selection process / accommodation request | 🔴 Not built | Product decision needed before engineering scope is knowable |
| Published bias-audit summary on a public-facing page | 🔴 Not built | Marketing/legal-owned surface, not `apps/api` |

**Assessment:** the bias-audit *computation* is real (#7). The disclosure/consent/notice obligations around it are not — and those are the parts a real NYC deployment can't skip. Don't market LL144 compliance until the notice + published-summary pieces exist.

## 2. EEOC (Uniform Guidelines on Employee Selection Procedures)

| Requirement | Status | Owner |
|---|---|---|
| Adverse-impact monitoring (four-fifths rule) | 🟢 Shipped — `BiasAuditService.computeAdverseImpact()` | Engineering (done) |
| Criterion-related validity evidence | 🟡 Design doc only ([#8](https://github.com/medussabjorn-collab/assessos/issues/8)) — blocked on outcome data that doesn't exist yet | Blocked, see #8 §2 |
| Documentation retention for selection procedures | 🟢 `HiringDecisionAudit` table records every stage transition with score snapshot (added alongside #7) | Engineering (done) |
| EEO-1-aligned self-ID categories, voluntary, decline-to-state option | 🟢 `CandidateSelfId` model | Engineering (done) — **known gap:** collected through the recruiter-facing API, not a separate candidate-facing intake; see comment in `prisma/schema.prisma` on `CandidateSelfId` |
| Consent/notice-gated collection for GDPR/CCPA-covered candidates | 🟡 Jurisdiction gate shipped — `SelfIdService.isRestrictedJurisdiction()` blocks EU/EEA + California candidates outright until consent capture, privacy notice, and access/erasure endpoints exist | Partial: blocks the regulated jurisdictions we can positively identify (`Candidate.country`/`usState`, recruiter-entered). Candidates with no country set are **not** covered — residual gap, not clearance. UK GDPR not in the blocklist (near-identical regime, deliberately excluded pending explicit scope decision). |

## 3. SOC2 Type II

This is fundamentally not an engineering task to "complete" — it's a 6-12 month audit-firm engagement with continuous evidence collection. What's engineering-actionable *now*, ahead of engaging an auditor:

| Control area | Current state | Gap |
|---|---|---|
| Access control / least privilege | Manual role checks per-endpoint (`org_admin`/`super_admin`), no centralized `RolesGuard` | Works today; an auditor will want a single enforced policy point, not per-controller checks scattered across `apps/api/src/modules/*` |
| Audit logging | `HiringDecisionAudit` covers hiring-stage decisions only | No general admin-action audit log (org creation, user role changes, data exports) |
| Encryption at rest / in transit | Not verified in this pass | Needs infra-level confirmation (RDS encryption, TLS termination config) — outside `apps/api` |
| Secrets management | `.env` pattern locally; `AWS Secrets Manager` named in platform spec (§ Infrastructure) | Verify production actually uses it, not just the spec |
| Change management / CI gating | Not reviewed in this pass | Check `.github/workflows` for required reviews, branch protection |
| Incident response plan | Not reviewed in this pass | Doc-only artifact, no code |

**Recommendation:** don't start the SOC2 clock (auditor engagement) until the access-control and audit-logging gaps above are closed — auditors flag "role checks copy-pasted per controller" and "no general audit log" as findings in a Type I readiness assessment, which costs a redo cycle if done in parallel with the audit instead of before it.

## 4. Open decisions (blocking, not engineering)

- **Bias-audit ownership**: internal I/O psychologist, external EEOC-compliance consultant, or audit-firm bundle with SOC2? Same question raised in #8 — likely worth resolving once, not twice.
- **SOC2 auditor selection and engagement timeline** — 6-12mo means this needs to start now if any enterprise close date depends on it (per platform spec's PLG + Enterprise GTM).
- **LL144 notice/consent flow** — product-owned decision (where in the candidate journey does notice happen, what does "alternative selection process" mean for this product) before it's an engineering ticket.

## 5. What's actually done vs what's still a plan

Done (code, tested, merged this pass):
- Adverse-impact computation with four-fifths rule + small-cell suppression (#7)
- Immutable hiring-decision audit trail (#7)
- Voluntary EEO self-ID storage (#7, with documented intake-channel limitation)

Still a plan, not code:
- Validation study (#8) — blocked on outcome data
- LL144 notice/consent/accommodation flow — not scoped
- SOC2 control remediation — access-control centralization, general audit log
- Everything in §4
