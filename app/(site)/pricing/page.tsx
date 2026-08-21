import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, FAQ, CTASection } from "@/components/page";
import { Check } from "@/components/icons";

export const metadata: Metadata = {
  title: "Pricing – Free, Team & Enterprise Plans",
  description:
    "Prelim pricing: free plan with 100 assessments/month, Team plan with unlimited assessments and live coding IDE, and Enterprise with SSO, SOC 2, and custom deployment.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    unit: "forever",
    blurb: "For teams trying structured assessment on real roles.",
    cta: { label: "Start free", href: "/contact" },
    featured: false,
    features: [
      "100 assessments / month",
      "Skill, cognition & culture scoring",
      "Structured candidate insights",
      "Pipeline ranking",
      "Community support",
    ],
  },
  {
    name: "Team",
    price: "Custom",
    unit: "per hiring team",
    blurb: "For scaling teams that hire across functions.",
    cta: { label: "Talk to sales", href: "/contact" },
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited assessments",
      "AI Test Builder & 60+ types",
      "Live coding IDE & anti-cheat",
      "ATS integrations & analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "annual",
    blurb: "For regulated organizations with strict requirements.",
    cta: { label: "Contact sales", href: "/contact" },
    featured: false,
    features: [
      "Everything in Team",
      "Cloud, VPC, or on-prem deployment",
      "SSO, SCIM & audit logging",
      "SOC 2 report & DPA",
      "Custom batteries & benchmarks",
      "Dedicated success manager & SLA",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        crumb="Pricing"
        title="Start free. Scale with your hiring."
        sub="One platform, one scoring model, transparent tiers. Move from a single role to enterprise-wide hiring without switching tools."
        primary={{ label: "Book a demo", href: "/contact" }}
        secondary={{ label: "Compare plans", href: "#plans" }}
      />

      <Band id="plans">
        <div className="pricing">
          {TIERS.map((t) => (
            <div className={`tier${t.featured ? " tier-featured" : ""} rv`} key={t.name}>
              {t.featured && <span className="tier-tag">Most popular</span>}
              <h3 className="tier-name">{t.name}</h3>
              <div className="tier-price"><span className="tp-v">{t.price}</span><span className="tp-u">{t.unit}</span></div>
              <p className="tier-blurb">{t.blurb}</p>
              <Link className={`btn ${t.featured ? "btn-primary" : "btn-ghost"} tier-cta`} href={t.cta.href}>{t.cta.label}</Link>
              <ul className="tier-features">
                {t.features.map((f) => (
                  <li key={f}><Check /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Band>

      <Band tint>
        <SectionHead title="Pricing questions." />
        <FAQ items={[
          { q: "How is the Team plan priced?", a: "By hiring team and volume rather than per-candidate, so cost stays predictable as you scale. Reach out for a quote tailored to your roles." },
          { q: "Is there a free trial of paid features?", a: "Yes. The Free plan lets you run real assessments today, and we'll enable paid features during an evaluation so you can test them on live roles." },
          { q: "What's included in Enterprise?", a: "Flexible deployment (cloud, VPC, on-prem), SSO/SCIM, SOC 2 and DPA, custom batteries, and a dedicated success manager with an SLA." },
          { q: "Do you offer nonprofit or education pricing?", a: "Yes — talk to sales about discounts for nonprofits, education, and early-stage startups." },
        ]} />
      </Band>

      <CTASection title="Not sure which plan fits?" sub="Tell us how you hire and we'll recommend the right plan — and show you the product on your roles." />
    </>
  );
}
