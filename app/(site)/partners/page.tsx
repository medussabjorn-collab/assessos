import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, CTASection } from "@/components/page";
import { Plug, Users, Globe, Building } from "@/components/icons";

export const metadata: Metadata = {
  title: "Partners",
  description: "Partner with Prelim: technology integrations, consulting and implementation partners, and referral partnerships.",
};

const TYPES = [
  { Icon: Plug, title: "Technology partners", desc: "Build a native integration between your ATS, HRIS, or hiring tool and Prelim's API." },
  { Icon: Users, title: "Consulting & implementation", desc: "Help enterprise customers design and roll out assessment programs on Prelim." },
  { Icon: Building, title: "Reseller & referral", desc: "Introduce Prelim to your customers and get compensated for qualified referrals." },
  { Icon: Globe, title: "Regional partners", desc: "Bring Prelim to new markets with localized content and support." },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        crumb="Company / Partners"
        title="Build and grow with Prelim."
        sub="We partner with technology, consulting, and regional teams to bring defensible hiring to more organizations."
        primary={{ label: "Apply to partner", href: "/contact" }}
        secondary={{ label: "See integrations", href: "/platform" }}
      />

      <Band>
        <SectionHead title="Ways to partner." />
        <CardGrid items={TYPES} />
      </Band>

      <CTASection title="Interested in partnering?" sub="Tell us about your product or practice and how you'd like to work with Prelim." />
    </>
  );
}
