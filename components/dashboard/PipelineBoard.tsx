import { Card, Tag, Badge } from "antd";
import { AntdShell } from "./AntdShell";

type CardItem = { name: string; role: string; score?: number; tag: "strong" | "wait" };
type Column = { stage: string; cards: CardItem[] };

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
  return (
    <AntdShell>
      <div className="dash-board">
        {COLUMNS.map((col) => (
          <div className="dash-col" key={col.stage}>
            <div className="dc-head">
              <span>{col.stage}</span>
              <Badge count={col.cards.length} showZero color="var(--accent)" />
            </div>
            {col.cards.map((c) => (
              <Card key={c.name} size="small" className="dash-card">
                <div className="dcn">{c.name}</div>
                <div className="dcr">{c.role}</div>
                <div className="dcs">
                  <span className="dcs-score">{c.score ? `${c.score}` : "—"}</span>
                  <Tag color={c.tag === "strong" ? "green" : "default"}>
                    {c.tag === "strong" ? "Strong Hire" : "In progress"}
                  </Tag>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </AntdShell>
  );
}
