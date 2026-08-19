import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { Shield, Code, Users, ArrowUpRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "One defensible assessment model across leadership, technical, and non-IT hiring — plus volume, campus, and internal mobility.",
};

const PILLARS = [
  { Icon: Shield, cat: "Leadership", title: "Leadership Hiring", desc: "Assess the people who set direction with 360°, situational judgment, and executive psychometrics.", href: "/solutions/leadership-hiring" },
  { Icon: Code, cat: "Technical", title: "Technical Hiring", desc: "Prove real engineering ability in a live, proctored environment your engineers trust.", href: "/solutions/technical-hiring" },
  { Icon: Users, cat: "Non-IT", title: "Non-IT Hiring", desc: "One standard for finance, sales, operations, healthcare, and legal roles.", href: "/solutions/non-it-hiring" },
];

const MORE = [
  { title: "Volume & Campus", desc: "High-throughput screening with low-latency scoring for thousands of applicants." },
  { title: "Early Careers", desc: "Fair, adaptive assessments that surface potential over pedigree." },
  { title: "Internal Mobility", desc: "Benchmark existing talent for promotions, succession, and reskilling." },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        crumb="Solutions"
        title="One assessment platform for every hire that matters."
        sub="Most tools own a single lane. Prelim applies one defensible scoring model across the three hardest hiring problems in the enterprise — and everything around them."
        secondary={{ label: "See the platform", href: "/platform" }}
      />

      <Band>
        <SectionHead title="The three hardest hires." />
        <div className="cardgrid stagger">
          {PILLARS.map(({ Icon, cat, title, desc, href }) => (
            <Link className="card card-link" href={href} key={title}>
              <div className="ci"><Icon /></div>
              <span className="card-cat">{cat}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="card-go">Explore <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <Band tint>
        <SectionHead title="Built for the rest of your pipeline, too." sub="The same model scales from a single executive search to campus drives with thousands of candidates." />
        <div className="cardgrid stagger">
          {MORE.map((m) => (
            <div className="card" key={m.title}>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </Band>

      <CTASection />
    </>
  );
}
