import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { CASE_STUDIES } from "@/lib/case-studies";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "How enterprise teams use Prelim to hire leadership, technical, and non-IT roles — with real results.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        crumb="Resources / Case Studies"
        title="How teams hire with Prelim."
        sub="Real hiring problems, the assessment Prelim ran, and what changed."
        secondary={{ label: "All resources", href: "/resources" }}
      />

      <Band>
        <SectionHead title="Case studies." />
        <div className="cs-grid stagger">
          {CASE_STUDIES.map((c) => (
            <Link className="cs-card" href={`/resources/case-studies/${c.slug}`} key={c.slug}>
              <div className="cs-top">
                <span className="cs-logo">{c.logo}</span>
                <span className="cs-track">{c.trackName} · {c.roles[0]}</span>
              </div>
              <h3>{c.headline}</h3>
              <p>{c.summary}</p>
              <div className="cs-stats">
                {c.results.slice(0, 2).map((r) => (
                  <div key={r.label}><span className="cs-v tnum">{r.value}</span><span className="cs-l">{r.label}</span></div>
                ))}
              </div>
              <span className="card-go">Read case study <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <CTASection title="Want results like these?" sub="Bring three real openings and we'll build the assessments live." />
    </>
  );
}
