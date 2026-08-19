import type { Metadata } from "next";
import SolutionDetail, { SolutionData } from "@/components/SolutionDetail";
import { Users, Scale, Target, Sparkles, Bars, Globe } from "@/components/icons";

export const metadata: Metadata = {
  title: "Non-IT Hiring",
  description:
    "Bring one rigor bar to every function — finance, sales, operations, healthcare, and legal — with role-specific assessment batteries.",
};

const data: SolutionData = {
  crumb: "Solutions / Non-IT",
  title: "One standard for every function.",
  sub: "Most of your hires aren't engineers — but they're assessed with far less rigor. Prelim brings the same defensible model to finance, sales, operations, healthcare, and legal.",
  overview: {
    title: "Role-specific batteries, one scoring model.",
    body: "Prelim combines cognitive, behavioral, and role-knowledge assessments tuned per function, then scores them on the same structured model you use everywhere else. Compare candidates fairly, across departments, without inventing a new process each time.",
    points: [
      "Pre-built batteries for finance, sales, ops, healthcare, and legal",
      "Cognitive and aptitude measures that predict performance",
      "Behavioral and culture-fit signals mapped to your values",
      "Consistent scoring you can defend to any hiring manager",
    ],
  },
  stat: { value: "60+", label: "assessment types", note: "From Excel modeling and analytical reasoning to clinical knowledge and contract drafting — ready to deploy." },
  capsTitle: "Functions we cover.",
  capsSub: "Each battery is validated for its domain, so a strong score means the same thing across your org.",
  caps: [
    { Icon: Bars, title: "Finance", desc: "Excel modeling, analytical reasoning, and regulatory knowledge." },
    { Icon: Target, title: "Sales", desc: "Discovery, objection handling, and quota-relevant judgment." },
    { Icon: Sparkles, title: "Operations", desc: "Process reasoning, prioritization, and problem-solving." },
    { Icon: Users, title: "Healthcare", desc: "Clinical knowledge and patient-communication scenarios." },
    { Icon: Scale, title: "Legal", desc: "Research, contract drafting, and compliance reasoning." },
    { Icon: Globe, title: "Custom roles", desc: "Build a battery for any function from Prelim's library." },
  ],
  faq: [
    { q: "How do you keep assessments fair across very different roles?", a: "Every battery is validated for its function, but all report into one structured scoring model — so a 'strong hire' verdict is comparable whether it's a controller or a nurse." },
    { q: "Can we localize assessments for different regions?", a: "Yes. Prelim supports multiple languages and region-specific content, with accessibility built in so candidates are assessed fairly." },
    { q: "Do you support high-volume functional hiring?", a: "Yes. Low-latency scoring and auto-ranking make Prelim practical for thousands of candidates across sales, support, and operations roles." },
  ],
  cta: { title: "Raise the bar for every hire, not just engineers.", sub: "Bring one non-technical role. We'll build the battery live and show you a sample scorecard." },
};

export default function Page() {
  return <SolutionDetail data={data} />;
}
