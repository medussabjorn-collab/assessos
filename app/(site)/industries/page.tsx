import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, Split, CTASection } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { INDUSTRIES } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Pick your industry: technology, financial services, healthcare, legal, manufacturing, retail, and BPO. Each routes to leadership, technical, and non-IT hiring on one model.",
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        crumb="Industries"
        title="Start with your industry. Then pick your hire."
        sub="Every industry hires differently — a controller isn't a nurse isn't a staff engineer. Choose your segment and Prelim routes you to leadership, technical, and non-IT hiring, tailored and validated for your world."
        secondary={{ label: "See solutions", href: "/solutions" }}
      />

      <Band>
        <SectionHead title="Choose your industry." sub="Each segment routes to the three hiring tracks, tuned to how you actually hire." />
        <div className="cardgrid stagger">
          {INDUSTRIES.map((ind) => (
            <Link className="card card-link" href={`/industries/${ind.slug}`} key={ind.slug}>
              <div className="ci"><ind.Icon /></div>
              <h3>{ind.name}</h3>
              <p>{ind.blurb}</p>
              <span className="card-go">Leadership · Technical · Non-IT <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <Band tint>
        <Split
          title="Regulated industries, handled properly."
          body="Finance, healthcare, and legal don't just need good assessment — they need defensible, compliant assessment. Prelim brings audit-ready reporting, data residency, and deployment inside your own perimeter to the industries that require it."
          points={[
            "Audit-ready, evidence-linked candidate reports",
            "Data residency and cloud / VPC / on-prem deployment",
            "SOC 2 Type II, GDPR, and candidate data that never trains models",
            "Role-knowledge content validated per industry",
          ]}
          media={
            <div className="sd-panel">
              <span className="sd-v tnum">7</span>
              <span className="sd-l">industries, one model</span>
              <p className="sd-note">A strong score means the same thing whether it&apos;s a trader, a triage nurse, or a plant supervisor.</p>
            </div>
          }
        />
      </Band>

      <CTASection title="Hiring in a regulated industry?" sub="Tell us your industry and roles — we'll show you the validated batteries and a sample scorecard." />
    </>
  );
}
