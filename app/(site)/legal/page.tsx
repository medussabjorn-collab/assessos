import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal",
  description: "Prelim's Privacy Policy, Terms of Service, Data Processing Addendum, and Cookie Policy.",
};

export default function LegalIndexPage() {
  return (
    <>
      <PageHero crumb="Legal" title="Legal documents." sub="Our policies for using the Prelim website and platform." secondary={{ label: "Contact us", href: "/contact" }} />
      <Band>
        <SectionHead title="Policies." />
        <div className="cardgrid stagger" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {LEGAL.map((d) => (
            <Link className="card card-link" href={`/legal/${d.slug}`} key={d.slug}>
              <h3>{d.title}</h3>
              <p>{d.intro}</p>
              <span className="card-go">Read <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>
    </>
  );
}
