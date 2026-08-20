import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, Split, FAQ, CTASection } from "@/components/page";
import { Sparkles, Bars, ShieldCheck, Users, Plug, Server } from "@/components/icons";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "How Prelim works: AI builds the assessment, runs it proctored and adaptive, auto-scores every response, and returns a ranked, explainable shortlist.",
};

const STEPS = [
  { st: "STEP 01", h: "Build", p: "Describe the role. Prelim generates a job-specific assessment across skill, cognition, and culture." },
  { st: "STEP 02", h: "Assess", p: "Candidates take a fair, adaptive test — proctored, accessible, and low-latency." },
  { st: "STEP 03", h: "Score", p: "Specialized assessors grade every response and flag inconsistency automatically." },
  { st: "STEP 04", h: "Decide", p: "A ranked skills matrix and verdict your team can explain and stand behind." },
];

const CAPS = [
  { Icon: Sparkles, title: "AI Test Builder", desc: "Turn a job description into a validated assessment in minutes." },
  { Icon: Bars, title: "Assessment Library", desc: "60+ assessment types across every function, ready to compose." },
  { Icon: ShieldCheck, title: "Auto-scoring", desc: "Reasoning-aware grading with inconsistency detection built in." },
  { Icon: Users, title: "Candidate Experience", desc: "Fast, accessible, and fair — a test candidates don't resent." },
  { Icon: Plug, title: "Integrations", desc: "Two-way sync with Greenhouse, Lever, Workday, and SAP." },
  { Icon: Server, title: "Deployment", desc: "Cloud, VPC, or on-prem — inside your own security perimeter." },
];

export default function PlatformPage() {
  let bandIndex = 0;
  const nextTint = () => bandIndex++ % 2 === 1;

  return (
    <>
      <PageHero
        crumb="Platform"
        title="From open req to decision you can defend."
        sub="Prelim is a closed loop: it builds the assessment, runs it, scores it, and returns a ranked, explainable shortlist — one system instead of five disconnected tools."
        secondary={{ label: "See security", href: "/security" }}
      />

      <Band tint={nextTint()}>
        <SectionHead title="A closed loop, not a point tool." />
        <div className="flow stagger">
          {STEPS.map((s) => (
            <div className="node" key={s.st}>
              <div className="bar" />
              <div className="st">{s.st}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band tint={nextTint()}>
        <SectionHead
          title="Watch a requisition move through the loop."
          sub="A live view of candidates moving from Build through Decide — the same board your recruiting team sees."
        />
        <PipelineBoard />
      </Band>

      <Band tint={nextTint()}>
        <SectionHead title="Everything the loop runs on." sub="Each capability feeds the same scoring model and reporting layer." />
        <CardGrid items={CAPS} />
      </Band>

      <Band tint={nextTint()}>
        <Split
          title="Explainable by design."
          body="A score you can't defend is worse than no score. Every Prelim verdict traces back to specific evidence — the response, the rubric, and the benchmark — so hiring managers, candidates, and auditors all see why."
          points={[
            "Evidence-linked scores, not black-box numbers",
            "Percentile benchmarks against comparable roles",
            "Inconsistency and integrity flags surfaced for review",
            "Exportable, audit-ready candidate reports",
          ]}
          media={
            <div className="sd-panel">
              <span className="sd-v tnum">88.9%</span>
              <span className="sd-l">scoring accuracy vs. benchmark</span>
              <p className="sd-note">Measured against expert human panels across 60+ assessment types.</p>
            </div>
          }
        />
      </Band>

      <Band tint={nextTint()}>
        <SectionHead title="Platform questions." />
        <FAQ items={[
          { q: "How long does it take to launch an assessment?", a: "Most teams go from job description to live assessment the same day. The AI Test Builder does the first draft; you review and adjust before it goes out." },
          { q: "Does Prelim replace our ATS?", a: "No — it plugs into it. Scores, verdicts, and reports sync back into Greenhouse, Lever, Workday, or SAP so recruiters stay in their existing workflow." },
          { q: "Can we run Prelim inside our own cloud?", a: "Yes. Prelim deploys to cloud, a dedicated VPC, or fully on-prem, so candidate data never leaves your perimeter." },
        ]} />
      </Band>

      <CTASection />
    </>
  );
}
