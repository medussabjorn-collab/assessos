export type Verdict = "strong-hire" | "consider" | "no-hire";

export type Competency = {
  label: string;
  score: number;
  evidence: string;
};

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  role: string;
  req: string;
  track: "Technical Hiring" | "Leadership Hiring" | "Non-IT Hiring";
  composite: number;
  percentile: string;
  benchmark: string;
  confidence: "High" | "Medium" | "Low";
  verdict: Verdict;
  competencies: Competency[];
  integrity: { label: string; status: "clean" | "flagged"; detail: string }[];
  latencyMs: number;
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  "strong-hire": "Strong Hire",
  consider: "Consider",
  "no-hire": "No Hire",
};

export const CANDIDATES: Candidate[] = [
  {
    id: "ava",
    name: "Ava Meridian",
    initials: "AM",
    role: "Staff Engineer",
    req: "REQ-4471",
    track: "Technical Hiring",
    composite: 88.9,
    percentile: "96th",
    benchmark: "Staff SWE",
    confidence: "High",
    verdict: "strong-hire",
    competencies: [
      { label: "System Design", score: 91, evidence: "Proposed a partitioned queue with backpressure under a simulated 10x load spike, and correctly identified the failure mode of the naive approach before being asked." },
      { label: "Coding", score: 88, evidence: "Debugged a failing integration test by reading logs methodically, narrating hypotheses out loud, and fixing root cause on the first attempt." },
      { label: "Leadership", score: 76, evidence: "Gave a clear, structured answer on mentoring a struggling teammate, with a concrete example from the situational-judgment exercise." },
      { label: "Communication", score: 82, evidence: "Explained a distributed-systems trade-off to a non-technical panelist in under two minutes without losing precision." },
      { label: "Culture Fit", score: 79, evidence: "Values-alignment responses were consistent across three independent scenario variants." },
    ],
    integrity: [
      { label: "Proctor status", status: "clean", detail: "No environment anomalies detected during the session." },
      { label: "Response consistency", status: "clean", detail: "No contradictions flagged across the session." },
      { label: "AI-assist policy", status: "clean", detail: "Copilot use was permitted for this assessment; usage was within policy." },
    ],
    latencyMs: 207,
  },
  {
    id: "jordan",
    name: "Jordan Blake",
    initials: "JB",
    role: "VP of Engineering",
    req: "REQ-5122",
    track: "Leadership Hiring",
    composite: 74.2,
    percentile: "68th",
    benchmark: "VP Eng, Series C",
    confidence: "Medium",
    verdict: "consider",
    competencies: [
      { label: "Strategic Judgment", score: 79, evidence: "Framed a scope-cut trade-off clearly, but the reasoning leaned heavily on a single prior experience rather than the specifics given." },
      { label: "People Leadership", score: 71, evidence: "Coaching approach was direct and well-structured, though the plan skipped how to handle pushback from the report." },
      { label: "Values & Integrity", score: 80, evidence: "Consistent, values-anchored responses across all three scenario variants." },
      { label: "Executive Presence", score: 68, evidence: "Communicated confidently, but ran long on two of three timed responses." },
      { label: "Risk & Governance", score: 73, evidence: "Correctly flagged the compliance risk in the scenario but proposed a slower mitigation than the benchmark cohort." },
    ],
    integrity: [
      { label: "Proctor status", status: "clean", detail: "No environment anomalies detected during the session." },
      { label: "Response consistency", status: "flagged", detail: "One response (Risk & Governance) diverged from the values stated in Values & Integrity — flagged for panel review, not auto-scored down." },
      { label: "AI-assist policy", status: "clean", detail: "Not applicable to this assessment type." },
    ],
    latencyMs: 211,
  },
  {
    id: "sam",
    name: "Sam Rivera",
    initials: "SR",
    role: "Financial Analyst",
    req: "REQ-3390",
    track: "Non-IT Hiring",
    composite: 51.4,
    percentile: "22nd",
    benchmark: "Financial Analyst, mid-market",
    confidence: "High",
    verdict: "no-hire",
    competencies: [
      { label: "Financial Modeling", score: 44, evidence: "The payback-period model contained a formula error that materially changed the recommendation; not caught during the session." },
      { label: "Analytical Reasoning", score: 58, evidence: "Identified one of the two material risks in the forecast case; missed the segment-concentration risk entirely." },
      { label: "Regulatory Knowledge", score: 61, evidence: "Correct on general principles, imprecise on the specific disclosure requirement asked." },
      { label: "Communication", score: 49, evidence: "The client-facing judgment scenario response avoided the core tension in the prompt rather than addressing it." },
      { label: "Integrity Judgment", score: 55, evidence: "Reasonable instinct to escalate, but the proposed approach risked the client relationship unnecessarily." },
    ],
    integrity: [
      { label: "Proctor status", status: "clean", detail: "No environment anomalies detected during the session." },
      { label: "Response consistency", status: "clean", detail: "No contradictions flagged — scores are consistently below benchmark, not erratic." },
      { label: "AI-assist policy", status: "clean", detail: "Not applicable to this assessment type." },
    ],
    latencyMs: 198,
  },
];
