"use client";

import { useInView } from "./useInView";

type Card = { name: string; role: string; score?: number; tag: "strong" | "wait" };
type Column = { stage: string; cards: Card[] };

const COLUMNS: Column[] = [
  {
    stage: "Build",
    cards: [
      { name: "REQ-4471", role: "Staff Engineer", tag: "wait" },
      { name: "REQ-5122", role: "VP Engineering", tag: "wait" },
    ],
  },
  {
    stage: "Assess",
    cards: [
      { name: "D. Okafor", role: "Backend Engineer", tag: "wait" },
      { name: "L. Marchetti", role: "Financial Analyst", tag: "wait" },
      { name: "R. Singh", role: "Product Manager", tag: "wait" },
    ],
  },
  {
    stage: "Score",
    cards: [
      { name: "Ava Meridian", role: "Staff Engineer", score: 88.9, tag: "strong" },
      { name: "T. Nakamura", role: "Sales Lead", score: 74.1, tag: "wait" },
    ],
  },
  {
    stage: "Decide",
    cards: [
      { name: "Jordan Blake", role: "VP Engineering", score: 74.2, tag: "strong" },
      { name: "S. Okonkwo", role: "Ops Manager", score: 81.3, tag: "strong" },
    ],
  },
];

export function PipelineBoard() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <div ref={ref} className={`dash-board${inView ? " in" : ""}`}>
      {COLUMNS.map((col) => (
        <div className="dash-col" key={col.stage}>
          <div className="dc-head">
            <span>{col.stage}</span>
            <span className="dc-count">{col.cards.length}</span>
          </div>
          {col.cards.map((c, i) => (
            <div className="dash-card" style={{ transitionDelay: `${i * 90}ms` }} key={c.name}>
              <div className="dcn">{c.name}</div>
              <div className="dcr">{c.role}</div>
              <div className="dcs">
                <span className="dcs-score">{c.score ? `${c.score}` : "—"}</span>
                <span className={`dcs-tag ${c.tag}`}>
                  {c.tag === "strong" ? "Strong Hire" : "In progress"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
