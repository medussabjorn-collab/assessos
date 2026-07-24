# Predictive Leadership-Potential Model — Validation Study Design
**Compliance Spec · v1.0 · 2026-07-07**

Tracks [#8](https://github.com/medussabjorn-collab/assessos/issues/8). Companion to [2026-07-07-leadership-platform-gap-analysis.md](2026-07-07-leadership-platform-gap-analysis.md) (P0) and the bias-audit engine shipped for [#7](https://github.com/medussabjorn-collab/assessos/issues/7) (`apps/api/src/modules/compliance/bias-audit.service.ts`).

**This is a methodology plan, not an implementation.** No real hiring-outcome data exists yet in this codebase — `Candidate.technicalScore` / `cultureFitScore` are currently unpopulated by any writer (confirmed by grep across `apps/api/src`), and there is no promotion/tenure/performance-rating table to validate a "leadership potential" prediction against. Nothing here should be coded until the data prerequisite in §2 is met — building a validation *pipeline* against synthetic or absent data would produce a document that looks compliant without being true, which is worse than no pipeline.

---

## 1. Why this is P0, not a nice-to-have

Any accuracy claim on an automated employment decision tool ("93%+ accuracy") is a legal liability without a documented validation study behind it:

- **EEOC Uniform Guidelines on Employee Selection Procedures** require evidence the selection procedure predicts job performance and doesn't produce unjustified adverse impact.
- **NYC Local Law 144** requires the bias audit ([#7](https://github.com/medussabjorn-collab/assessos/issues/7)) to be paired with disclosure of what the tool measures and how — an unvalidated model undermines that disclosure.
- Enterprise legal/procurement teams will ask "validated how, against what outcome, on what sample" before signing — this is a sales blocker, not just a compliance one.

## 2. Data prerequisite (blocking)

A validation study needs a **criterion** — a real-world outcome to predict against. Candidates, in order of statistical strength:

| Criterion | Where it'd live | Status |
|-----------|-----------------|--------|
| Supervisor performance rating (6-12mo post-hire/promotion) | New `PerformanceRating` table, not in schema today | Doesn't exist |
| Promotion within N months | Derivable from `User.role` changes over time if role-change history is tracked | Not tracked — `User.role` is a mutable field with no history |
| Retention (voluntary/involuntary termination within N months) | Would need a `terminatedAt` / `terminationReason` field on `User` | Doesn't exist |
| Manager-rated 360 competency change over time | `RaterFeedback` table exists today | Exists, but too new (added this cycle) to have longitudinal data yet |

**Recommendation:** don't build a validation pipeline before there's at least 6-12 months of one criterion above, with enough sample size per protected-class group to run adverse-impact math without hitting the same small-cell suppression floor used in `BiasAuditService` (n≥5 per cell, and realistically n≥30+ per group for a validity coefficient to mean anything).

## 3. Study design (once data exists)

### 3.1 Design type
**Predictive validity study** (score at assessment time → outcome N months later), not concurrent validity (scoring incumbents against current performance) — predictive is the stronger evidentiary standard and matches how the tool is actually used (pre-decision, not post-hoc).

### 3.2 Sample
- Minimum N per the codebase's existing multi-tenant structure: aggregate across tenants (with tenant consent — check DPA/ToS before pooling customer data across tenant boundaries) or treat each enterprise tenant as its own validation cohort if pooling isn't contractually allowed.
- Stratify by the same EEO categories used in `BiasAuditService` (`EeoGender`, `EeoRaceEthnicity`, `EeoAgeBand`) so validity coefficients can be reported per subgroup, not just in aggregate — a model that's 93% accurate overall but predicts poorly for one subgroup is itself an adverse-impact problem.

### 3.3 Statistics to compute
- **Criterion validity coefficient** (Pearson r or logistic AUC depending on whether the criterion is continuous or binary) between the model's `dimensionScores`/`benchmarkPercentile` (see `AiReport` in `prisma/schema.prisma`) and the chosen outcome.
- **Differential validity check** — does the coefficient hold consistently across EEO subgroups, or does it predict better for some groups than others?
- **Differential prediction (intercept/slope bias)** — even if validity coefficients match across groups, check for systematic over/under-prediction for any subgroup (Cleary model or equivalent).
- Confidence intervals on all of the above — a single point estimate ("93%") without an interval and sample size is not defensible to legal/procurement.

### 3.4 Documentation package (the actual deliverable)
A validation report suitable for enterprise legal review, containing:
1. Study design and sample description (N, time period, criterion used, tenant(s))
2. Validity coefficients (aggregate + per-subgroup) with confidence intervals
3. Adverse impact cross-reference to the [#7](https://github.com/medussabjorn-collab/assessos/issues/7) bias-audit report for the same period
4. Limitations section — sample size caveats, criterion limitations (e.g. supervisor ratings carry their own bias risk), what the study does *not* establish
5. Re-validation cadence commitment (annual, or triggered by model retraining)

## 4. Open questions

- Who owns running this study — internal I/O psychologist / data scientist, or an external validation consultant? (Same open question as the compliance-framework doc — may be the same hire/vendor.)
- Which tenant(s) have enough hire/promotion volume to reach adequate sample size first, and have they consented to their data being used for model validation (separate from ordinary product usage)?
- Does `AiReport.benchmarkPercentile` or `dimensionScores` map cleanly to a single "leadership potential" score, or does validation need to happen per-dimension? Current schema (`prisma/schema.prisma:121-141`) stores `dimensionScores` as unstructured `Json` — may need a defined schema before it can be a validation *target* consistently across sessions.

## 5. Explicit non-goal for this pass

No code changes in this commit. The bias-audit engine ([#7](https://github.com/medussabjorn-collab/assessos/issues/7)) is real and running; this document intentionally stops at "here's the plan" because building against absent data would misrepresent validation status — the exact failure mode this study exists to prevent.
