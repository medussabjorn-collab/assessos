import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead } from "@/components/page";
import { CTASection } from "@/components/page";
import { Sparkles, Bars, Shield, Terminal, Target, Code, ArrowUpRight } from "@/components/icons";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides, case studies, sample tests, and documentation for building defensible hiring with Prelim.",
};

const RESOURCES = [
  { Icon: Sparkles, title: "Blog & Insights", desc: "Ideas on structured hiring, assessment design, and what the data shows.", href: "/resources/blog" },
  { Icon: Bars, title: "Guides", desc: "Practical playbooks for rolling out assessment across your hiring teams.", href: "/resources/guides" },
  { Icon: Shield, title: "Case Studies", desc: "How enterprise teams use Prelim to hire leadership, technical, and non-IT roles.", href: "/resources/case-studies" },
  { Icon: Terminal, title: "Sample Tests", desc: "Try example assessments to see the candidate experience firsthand.", href: "/resources/sample-tests" },
  { Icon: Target, title: "ROI Calculator", desc: "Estimate the time and cost Prelim saves across your hiring pipeline.", href: "/resources/roi-calculator" },
  { Icon: Code, title: "Documentation", desc: "API reference and integration guides for engineering teams.", href: null },
];

export default function ResourcesPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Resources", href: "/resources/" },
      ]} />
      <PageHero
        crumb="Resources"
        title="Everything you need to build defensible hiring."
        sub="Guides, case studies, sample tests, and documentation — for hiring teams and the engineers who integrate Prelim."
        secondary={{ label: "Talk to us", href: "/contact" }}
      />

      <Band>
        <SectionHead title="Browse resources." sub="API documentation is coming soon — reach out if you need it sooner." />
        <div className="cardgrid stagger">
          {RESOURCES.map(({ Icon, title, desc, href }) =>
            href ? (
              <Link className="card card-link" href={href} key={title}>
                <div className="ci"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="card-go">Explore <ArrowUpRight /></span>
              </Link>
            ) : (
              <div className="card card-soon" key={title}>
                <div className="ci"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="card-soon-tag">Coming soon</span>
              </div>
            )
          )}
        </div>
      </Band>

      <CTASection title="Looking for something specific?" sub="Tell us what you need and we'll point you to the right resource — or write it." />
    </>
  );
}
