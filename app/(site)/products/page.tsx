import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { ArrowUpRight } from "@/components/icons";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Composable assessment modules — technical, leadership, non-IT, AI evaluation, live coding, anti-cheating, analytics, and API — feeding one scoring model.",
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

      <CTASection title="Compose the assessment your role needs." sub="Tell us the role. We'll show you exactly which modules to turn on and what the scorecard looks like." />
    </>
  );
}
