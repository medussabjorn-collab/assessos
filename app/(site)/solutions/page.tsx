import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { Shield, Code, Users, ArrowUpRight, Check } from "@/components/icons";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "One Assessment Platform for Engineering, Leadership & Non-IT Hiring | Prelim",
  description:
    "Stop running separate tools for each job family. Prelim applies one scoring model across technical, leadership, and non-IT hires — comparable verdicts, one platform, enterprise-ready.",
  alternates: { canonical: "/solutions/" },
};

const PILLARS = [
  { Icon: Shield, cat: "Leadership", title: "Leadership Hiring", desc: "Assess the people who set direction with 360°, situational judgment, and executive psychometrics.", href: "/solutions/leadership-hiring" },
  { Icon: Code, cat: "Technical", title: "Technical Hiring", desc: "Prove real engineering ability in a live, proctored environment your engineers trust.", href: "/solutions/technical-hiring" },
  { Icon: Users, cat: "Non-IT", title: "Non-IT Hiring", desc: "One standard for finance, sales, operations, healthcare, and legal roles.", href: "/solutions/non-it-hiring" },
];

const COMPARE_ROWS = [
  { problem: "Engineering hires", before: "Separate coding platform (HackerRank, Codility)", after: "Technical Assessment — same model, integrated" },
  { problem: "Leadership hires", before: "Boutique search firm or personality test", after: "Leadership Assessment — 360°, SJT, psychometrics" },
  { problem: "Non-IT hires (ops, finance, sales)", before: "Panel gut feel or generic questionnaire", after: "Non-IT Functional — validated batteries per role" },
  { problem: "Comparing candidates across functions", before: "Impossible — different tools, different scales", after: "One scoring model — 'strong hire' means the same thing everywhere" },
  { problem: "Compliance and audit trail", before: "Patchwork of vendor reports", after: "Centralized, evidence-linked, audit-ready" },
];

const MORE = [
  { title: "Volume & Campus", desc: "High-throughput screening with low-latency scoring for thousands of applicants." },
  { title: "Early Careers", desc: "Fair, adaptive assessments that surface potential over pedigree." },
  { title: "Internal Mobility", desc: "Benchmark existing talent for promotions, succession, and reskilling." },
];

export default function SolutionsPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Solutions", href: "/solutions/" },
      ]} />
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
        <SectionHead
          title="Why one platform beats three."
          sub="Most enterprises stitch together a technical assessment tool, an exec search firm, and gut feel for everything else. The result: incomparable verdicts, no shared bar, and audit trails that don't hold up."
        />
        <div className="compare-table rv" style={{ overflowX: "auto" }}>
          <table className="ct">
            <thead>
              <tr>
                <th>Hiring problem</th>
                <th className="ct-bad">Fragmented status quo</th>
                <th className="ct-good">Prelim</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.problem}>
                  <td><b>{r.problem}</b></td>
                  <td className="ct-bad-cell"><span className="ct-x">✗</span> {r.before}</td>
                  <td className="ct-good-cell"><span className="ct-check"><Check /></span> {r.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <Band>
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
