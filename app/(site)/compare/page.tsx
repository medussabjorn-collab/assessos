import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { COMPARISONS } from "@/lib/compare";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Prelim vs. Competitors – Assessment Platform Comparisons",
  description:
    "See how Prelim compares to HackerRank, Codility, and other assessment tools. Prelim is the only platform that unifies technical, leadership, and non-IT hiring on one scoring model.",
  alternates: { canonical: "/compare/" },
};

export default function ComparePage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Compare", href: "/compare/" },
      ]} />
      <PageHero
        crumb="Compare"
        title="How Prelim compares."
        sub="Most assessment tools own one lane — engineering, or executive search, or ops. Prelim is the only platform that scores all three on the same model. See how it stacks up."
      />

      <Band>
        <SectionHead title="Choose a comparison." />
        <div className="cardgrid stagger">
          {COMPARISONS.map((c) => (
            <Link className="card card-link" href={`/compare/${c.slug}`} key={c.slug}>
              <span className="card-cat">Prelim vs.</span>
              <h3>{c.competitor}</h3>
              <p>{c.tagline}</p>
              <span className="card-go">See comparison <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <Band tint>
        <SectionHead
          title="The Prelim difference."
          sub="Every competitor on this page does one thing exceptionally well. Prelim's advantage is scope — one platform, one model, across every job family your enterprise hires for."
        />
        <ul className="checklist focus-cols rv">
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>Technical, leadership, and non-IT assessment built in</li>
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>One scoring model — comparable verdicts across all job families</li>
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>SOC 2 Type II, GDPR, cloud / VPC / on-prem deployment</li>
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>Single audit trail for every hire across your org</li>
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>10,000+ assessments across technical and non-technical domains</li>
          <li><span className="ct-check" style={{ display: "inline-flex", marginRight: ".4rem" }}>✓</span>Greenhouse, Lever, Workday, SAP integrations</li>
        </ul>
      </Band>

      <CTASection title="See it side by side on your roles." sub="Bring three real openings across different functions — we'll show you how Prelim scores all three in one session." />
    </>
  );
}
