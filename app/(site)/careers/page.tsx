import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, CTASection } from "@/components/page";
import { Scale, Target, Users, Globe } from "@/components/icons";

export const metadata: Metadata = {
  title: "Careers",
  description: "Help build the assessment layer for defensible hiring. Open roles at Prelim, and what it's like to work here.",
};

const VALUES = [
  { Icon: Scale, title: "Evidence over instinct", desc: "We apply the same rigor to our own decisions that we build for customers." },
  { Icon: Target, title: "Ship judgment, not features", desc: "Every release should make a hiring decision more defensible, not just more automated." },
  { Icon: Users, title: "Fair by default", desc: "We build for candidates as much as for hiring teams — that shapes how we work too." },
  { Icon: Globe, title: "Remote-friendly, global", desc: "We hire the best people wherever they are, and we practice what we assess." },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        crumb="Company / Careers"
        title="Help build defensible hiring."
        sub="We're a small team building the assessment layer behind enterprise hiring. If evidence-based decisions matter to you, we'd like to talk."
        primary={{ label: "See open roles", href: "/contact" }}
        secondary={{ label: "About Prelim", href: "/about" }}
      />

      <Band>
        <SectionHead title="How we work." />
        <CardGrid items={VALUES} />
      </Band>

      <Band tint>
        <SectionHead title="Open roles." sub="We don't have a public roles board live yet — reach out and we'll share what's open." />
      </Band>

      <CTASection title="Don't see the right role?" sub="Tell us what you're great at. We're always interested in people who care about evidence-based hiring." />
    </>
  );
}
