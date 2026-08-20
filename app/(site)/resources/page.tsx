import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, CTASection } from "@/components/page";
import { Sparkles, Bars, Shield, Terminal, Target, Code } from "@/components/icons";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides, case studies, sample tests, and documentation for building defensible hiring with Prelim.",
};

const RESOURCES = [
  { Icon: Sparkles, title: "Blog & Insights", desc: "Ideas on structured hiring, assessment design, and what the data shows." },
  { Icon: Bars, title: "Guides", desc: "Practical playbooks for rolling out assessment across your hiring teams." },
  { Icon: Shield, title: "Case Studies", desc: "How enterprise teams use Prelim to hire leadership, technical, and non-IT roles." },
  { Icon: Terminal, title: "Sample Tests", desc: "Try example assessments to see the candidate experience firsthand." },
  { Icon: Target, title: "ROI Calculator", desc: "Estimate the time and cost Prelim saves across your hiring pipeline." },
  { Icon: Code, title: "Documentation", desc: "API reference and integration guides for engineering teams." },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        crumb="Resources"
        title="Everything you need to build defensible hiring."
        sub="Guides, case studies, sample tests, and documentation — for hiring teams and the engineers who integrate Prelim."
        secondary={{ label: "Talk to us", href: "/contact" }}
      />

      <Band>
        <SectionHead title="Browse resources." sub="This library is growing — reach out if there's something specific you need." />
        <CardGrid items={RESOURCES} />
      </Band>

      <CTASection title="Looking for something specific?" sub="Tell us what you need and we'll point you to the right resource — or write it." />
    </>
  );
}
