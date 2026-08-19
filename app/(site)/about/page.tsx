import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, CTASection } from "@/components/page";
import { Scale, Target, ShieldCheck, Users } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Prelim builds the assessment layer for defensible hiring — measuring leadership, technical, and non-IT candidates on evidence, not instinct.",
};

const STATS = [
  { v: "2.4M+", l: "Assessments completed" },
  { v: "1,200+", l: "Hiring teams" },
  { v: "60+", l: "Assessment types" },
  { v: "84.9%", l: "Scoring accuracy" },
];

const VALUES = [
  { Icon: Scale, title: "Evidence over instinct", desc: "Every hiring decision should trace back to something you can defend — to a candidate, a manager, or a regulator." },
  { Icon: Target, title: "One rigor bar", desc: "The same standard belongs on every hire, whether it's a staff engineer or a regional controller." },
  { Icon: ShieldCheck, title: "Fair by design", desc: "Assessments are accessible, adaptive, and built to measure ability — not pedigree or test-taking tricks." },
  { Icon: Users, title: "Candidates first", desc: "A test people don't resent is a test people finish. Experience is a feature, not an afterthought." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumb="Company"
        title="Hiring judgment, made defensible."
        sub="Prelim is the assessment layer behind enterprise hiring. We help teams measure leadership, technical, and non-IT candidates on one structured model — so the best decision and the defensible decision are the same one."
        secondary={{ label: "See careers", href: "/contact" }}
      />

      <Band>
        <div className="about-stats rv">
          {STATS.map((s) => (
            <div className="as" key={s.l}>
              <div className="as-v tnum">{s.v}</div>
              <div className="as-l">{s.l}</div>
            </div>
          ))}
        </div>
      </Band>

      <Band tint>
        <SectionHead title="What we believe." sub="Four principles shape every assessment Prelim ships." />
        <CardGrid items={VALUES} />
      </Band>

      <CTASection title="Help us raise the bar on hiring." sub="Whether you want to hire with Prelim or build it with us — let's talk." />
    </>
  );
}
