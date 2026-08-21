import type { Metadata } from "next";
import SolutionDetail, { SolutionData } from "@/components/SolutionDetail";
import { Users, Scale, Target, Sparkles, Shield, Bars } from "@/components/icons";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Leadership Assessment Platform – Executives, Managers & Directors",
  description:
    "Leadership assessment platform using situational judgment, psychometrics, and 360° input to predict how executives and managers perform under real pressure.",
};

const data: SolutionData = {
  crumb: "Solutions / Leadership",
  title: "Assess the people who set direction.",
  sub: "Executive hires are the highest-stakes, lowest-sample decisions you make. Prelim brings structure your board respects — without turning judgment into a checkbox.",
  overview: {
    title: "Structure executives actually respect.",
    body: "Leadership potential rarely shows up on a résumé. Prelim measures decision quality, people signals, and values alignment through work-sample and situational-judgment exercises — then benchmarks against leaders in comparable seats.",
    points: [
      "360° input from peers, reports, and interviewers",
      "Situational-judgment scenarios mapped to your competencies",
      "Executive psychometrics validated against on-the-job outcomes",
      "Board-ready reports that explain the score",
    ],
  },
  stat: { value: "63%", label: "faster leadership shortlists", note: "Astraflow cut a 9-week executive shortlist to under three, without lowering the bar." },
  capsTitle: "What you can assess.",
  caps: [
    { Icon: Target, title: "Strategic judgment", desc: "How candidates frame ambiguous, high-stakes decisions." },
    { Icon: Users, title: "People leadership", desc: "Coaching, delegation, and conflict signals from real scenarios." },
    { Icon: Scale, title: "Values & integrity", desc: "Alignment with the behaviors your culture rewards." },
    { Icon: Sparkles, title: "Executive presence", desc: "Communication and influence, scored consistently across panels." },
    { Icon: Shield, title: "Risk & governance", desc: "Judgment under regulatory and reputational pressure." },
    { Icon: Bars, title: "Benchmarking", desc: "Percentile against leaders in comparable roles and stages." },
  ],
  roles: ["CEO", "COO", "VP of Engineering", "VP of Sales", "Director of Operations", "General Manager", "Head of Product", "Chief of Staff", "Regional Director"],
  faq: [
    { q: "Can we use our own leadership competency model?", a: "Yes. Prelim maps every exercise and score to your existing competency framework, so results speak your organization's language rather than a generic one." },
    { q: "Is this a personality test?", a: "No. Psychometrics are one input, combined with work-sample and situational-judgment evidence. The composite is behavior-based and validated against real outcomes." },
    { q: "How do we keep executive assessments confidential?", a: "Assessments run in your chosen deployment — cloud, VPC, or on-prem — and candidate data is never used to train models." },
  ],
  cta: { title: "Put your next executive search on evidence.", sub: "Bring one open leadership role. We'll design the assessment live and walk through a sample scorecard." },
};

export default function Page() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Solutions", href: "/solutions/" },
        { name: "Leadership Assessment", href: "/solutions/leadership-hiring/" },
      ]} />
      <SolutionDetail data={data} />
    </>
  );
}
