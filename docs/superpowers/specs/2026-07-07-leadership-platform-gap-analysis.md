# Leadership Platform — Competitive Gap Analysis
**Roadmap Input · v1.0 · 2026-07-07**

Source: informal blueprint-vs-industry comparison (Ployo, HireVue, Pymetrics, Codility) pasted 2026-07-07. This doc turns that table into a prioritized backlog against the existing spec at [2026-06-14-assessos-platform-design.md](2026-06-14-assessos-platform-design.md).

---

## 1. Priority tiers

| Tier | Meaning |
|------|---------|
| 🚨 P0 — Blocking | Compliance/legal exposure or table-stakes gap vs every named competitor |
| 🔥 P1 — Differentiator | Not blocking, but competitors ship it and it's a sales objection |
| ✅ P2 — Already ahead | Existing strength — protect and market it, don't rebuild |
| ⚠️ P3 — Partial | Exists in some form, needs depth |

---

## 2. Backlog

### 🚨 P0 — Compliance & legal (ship before any enterprise/NYC/EU deal)

| Item | Why P0 | Notes |
|------|--------|-------|
| Bias detection / algorithmic bias audit | NYC Local Law 144 requires annual bias audits for automated employment decision tools used on NYC-based candidates; EEOC scrutiny is rising for AI hiring tools | Needs: adverse-impact ratio reporting (4/5ths rule) per protected class, audit trail, published summary. This is a legal requirement, not a feature — don't ship AI-scored hiring decisions without it. |
| Predictive analytics disclosure + validation | Same regulatory family as above — any "93%+ accuracy" claim needs a documented validation study (adverse impact + criterion validity) before enterprise procurement/legal will sign off | Applies to the existing BERT+XGBoost leadership-potential model too, not just new features |
| Compliance framework beyond GDPR | SOC2 Type II, EEOC, NYC LL144 all named as gaps | SOC2 Type II is a 6-12mo audit process — start the clock early if enterprise GTM depends on it (per existing spec's PLG + Enterprise tiers) |

### 🔥 P1 — Differentiators competitors already ship

| Item | Why P1 | Notes |
|------|--------|-------|
| Enterprise integrations (HRIS/LMS/ATS) | Every named competitor has this; "not mentioned" in current blueprint is a real gap for enterprise tier | Start with Workday (HRIS) + one ATS — full matrix (SAP/Oracle/Cornerstone/Degreed) is a v2+ problem |
| Adaptive testing (IRT / CAT) | "Mentioned but not detailed" vs "advanced" for competitors | Item Response Theory + computerized adaptive testing is a real psychometrics investment — scope as its own spec, not a bolt-on |
| AI video analysis depth | Baseline (sentiment/body language) already matches HireVue/Ployo | Micro-expression + vocal stress is P1 not P0 — diminishing returns and its own bias/consent risk (see P0 bias item) |
| Code assessment depth | Multi-language + quality scoring already matches Codility/HackerRank | AI pair-programming simulation is a nice-to-have differentiator, not a gap |
| White-label / multi-tenant marketplace | Not mentioned currently; competitors offer it | Check against existing multi-tenant architecture (spec §3) — may be mostly a billing/branding-layer problem, not a new architecture |

### ⚠️ P3 — Partial, needs depth (not urgent)

| Item | Notes |
|------|-------|
| Immersive assessment (VR/AR) | Emerging even among competitors — treat as R&D bet, not roadmap commitment. High cost, unproven ROI for leadership assessment specifically. |

### ✅ P2 — Already ahead, protect + market

| Item | Notes |
|------|-------|
| DISC integration across all modules | Competitors mostly limit this to leadership-only. Keep, and lead marketing copy with it. |
| Industry-specific SJT scenarios | Competitors are generic. Expanding with generative-AI scenario creation is a good P1-adjacent bet, but the base strength is real today. |

---

## 3. Sequencing recommendation

1. **P0 first, always.** Bias audit + validation study block any enterprise deal in NYC/EU regardless of feature velocity elsewhere. This is legal risk, not backlog nice-to-have.
2. **P1 in parallel, ranked:** HRIS/ATS integration (unblocks enterprise sales conversations) → adaptive testing (psychometric credibility) → the rest.
3. **P3/R&D (VR) stays off the committed roadmap** until P0/P1 ship — don't let a flashy demo feature compete for engineering time against a compliance blocker.

---

## 4. Open questions for follow-up

- Who owns the bias-audit methodology — internal I/O psychologist, external consultant, or a vendor (e.g. an EEOC-compliance audit firm)?
- Is SOC2 Type II already in progress? If not, the 6-12mo timeline needs to start now to not block enterprise close dates.
- Which ATS/HRIS does the current pipeline (sales conversations, design partners) actually need first? Don't build the full Workday/SAP/Oracle matrix speculatively.
