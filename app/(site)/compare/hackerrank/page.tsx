import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { Check } from "@/components/icons";
import { compareBySlug } from "@/lib/compare";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { notFound } from "next/navigation";

const c = compareBySlug("hackerrank")!;

export const metadata: Metadata = {
  title: "Prelim vs. HackerRank – Which Assessment Platform Is Right for You?",
  description:
    "HackerRank owns technical hiring. Prelim owns technical, leadership, and non-IT hiring on one scoring model. See the full feature comparison and choose what fits your enterprise.",
  alternates: { canonical: "/compare/hackerrank/" },
};

export default function HackerRankComparePage() {
  if (!c) notFound();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Compare", href: "/compare/" },
        { name: "Prelim vs. HackerRank", href: "/compare/hackerrank/" },
      ]} />

      <PageHero
        crumb="Compare"
        title={c.heroTitle}
        sub={c.heroSub}
        secondary={{ label: "See all comparisons", href: "/compare" }}
      />

      <Band>
        <SectionHead title="Feature comparison." />
        <div className="compare-table rv" style={{ overflowX: "auto" }}>
          <table className="ct">
            <thead>
              <tr>
                <th>Dimension</th>
                <th className="ct-good">Prelim</th>
                <th className="ct-bad">HackerRank</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.dimension}>
                  <td><b>{r.dimension}</b></td>
                  <td className={r.prelim.win ? "ct-good-cell" : ""}>
                    {r.prelim.win && <span className="ct-check"><Check /></span>}{" "}
                    {r.prelim.text}
                  </td>
                  <td className={r.competitor.win ? "ct-good-cell" : ""}>
                    {r.competitor.win && <span className="ct-check"><Check /></span>}{" "}
                    {r.competitor.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <Band tint>
        <div className="split rv">
          <div>
            <SectionHead title="Choose Prelim if…" />
            <ul className="checklist">
              {c.choosePrelimIf.map((s) => (
                <li key={s}><span className="ct-check"><Check /></span> {s}</li>
              ))}
            </ul>
            <Link href="/platform" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-flex" }}>
              See how Prelim works
            </Link>
          </div>
          <div>
            <SectionHead title="Choose HackerRank if…" />
            <ul className="checklist muted">
              {c.chooseCompetitorIf.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Band>
        <SectionHead
          title="The bottom line."
          sub={c.verdict}
        />
      </Band>

      <CTASection
        title="See Prelim on your open roles."
        sub="Bring a technical role, a leadership search, and a non-IT opening. We'll run all three in one session so you can see one model score all three."
      />
    </>
  );
}
