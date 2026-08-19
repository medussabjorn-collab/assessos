import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, CTASection } from "@/components/page";
import { Code, Shield, Users, Sparkles, Terminal, ShieldCheck, Bars, Plug } from "@/components/icons";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Composable assessment modules — technical, leadership, non-IT, AI evaluation, live coding, anti-cheating, analytics, and API — feeding one scoring model.",
};

const MODULES = [
  { Icon: Code, title: "Technical Assessment", desc: "Coding, system design, and DevOps tasks in a realistic environment." },
  { Icon: Shield, title: "Leadership Assessment", desc: "360°, situational judgment, and executive psychometrics." },
  { Icon: Users, title: "Non-IT / Functional", desc: "Role batteries for finance, sales, ops, healthcare, and legal." },
  { Icon: Sparkles, title: "AI Evaluation", desc: "AI interviewer and reasoning-aware grading of open responses." },
  { Icon: Terminal, title: "Live Coding IDE", desc: "Real repos, real tests, real time — in the browser." },
  { Icon: ShieldCheck, title: "Anti-Cheating", desc: "Proctoring and integrity signals tuned for the AI era." },
  { Icon: Bars, title: "Analytics & Reporting", desc: "Pipeline insight, benchmarks, and audit-ready reports." },
  { Icon: Plug, title: "API & Integrations", desc: "Structured JSON reports into any ATS or workflow." },
];

export default function ProductsPage() {
  return (
    <>
      <PageHero
        crumb="Products"
        title="Every signal that matters, in one system."
        sub="Turn on the modules a role needs. Each one feeds the same scoring model and reporting layer, so results stay comparable across your whole org."
        secondary={{ label: "See the platform", href: "/platform" }}
      />

      <Band>
        <SectionHead title="The assessment engine." sub="Compose any combination — Prelim keeps the scoring consistent." />
        <CardGrid items={MODULES} />
      </Band>

      <CTASection title="Compose the assessment your role needs." sub="Tell us the role. We'll show you exactly which modules to turn on and what the scorecard looks like." />
    </>
  );
}
