import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { PhotoBand } from "@/components/Photo";
import { ArrowUpRight } from "@/components/icons";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Pre-Employment Assessment Tools – Prelim Product Suite",
  description:
    "Pre-employment assessment tools: technical tests, leadership psychometrics, AI evaluation, live coding IDE, anti-cheat, analytics, and API — all feeding one scoring model.",
};

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
        <div className="cardgrid stagger">
          {PRODUCTS.map((p) => (
            <Link className="card card-link" href={`/products/${p.slug}`} key={p.slug}>
              <div className="ci"><p.Icon /></div>
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
              <span className="card-go">Explore <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <Band style={{ paddingTop: 0 }}>
        <PhotoBand src="/images/code-terminal.jpg" alt="Code and terminal output on a developer's screen" ratio="wide" />
      </Band>

      <CTASection title="Compose the assessment your role needs." sub="Tell us the role. We'll show you exactly which modules to turn on and what the scorecard looks like." />
    </>
  );
}
