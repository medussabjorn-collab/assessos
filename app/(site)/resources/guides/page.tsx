import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Practical playbooks for rolling out structured assessment across your hiring teams.",
};

export default function GuidesIndexPage() {
  return (
    <>
      <PageHero crumb="Resources / Guides" title="Guides." sub="Practical playbooks for rolling out assessment across your hiring teams." secondary={{ label: "All resources", href: "/resources" }} />

      <Band>
        <SectionHead title="Browse guides." />
        <div className="cardgrid stagger">
          {GUIDES.map((g) => (
            <Link className="card card-link" href={`/resources/guides/${g.slug}`} key={g.slug}>
              <span className="card-cat">{g.audience}</span>
              <h3>{g.title}</h3>
              <p>{g.dek}</p>
              <span className="card-go">{g.steps.length} steps · {g.readMins} min <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <CTASection title="Need a guide for your specific setup?" sub="Tell us how your team hires and we'll write one." />
    </>
  );
}
