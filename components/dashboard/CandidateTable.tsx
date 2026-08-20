"use client";

import { Table, Tag, type TableColumnsType } from "antd";

const ROWS = [
  { key: "Ava Meridian", initials: "AM", name: "Ava Meridian", role: "Staff Engineer", track: "Technical", score: 88.9, verdict: "strong" },
  { key: "Jordan Blake", initials: "JB", name: "Jordan Blake", role: "VP of Engineering", track: "Leadership", score: 74.2, verdict: "consider" },
  { key: "S. Okonkwo", initials: "SO", name: "S. Okonkwo", role: "Operations Manager", track: "Non-IT", score: 81.3, verdict: "strong" },
  { key: "T. Nakamura", initials: "TN", name: "T. Nakamura", role: "Sales Lead", track: "Non-IT", score: 74.1, verdict: "consider" },
  { key: "Sam Rivera", initials: "SR", name: "Sam Rivera", role: "Financial Analyst", track: "Non-IT", score: 51.4, verdict: "no-hire" },
] as const;

type Row = (typeof ROWS)[number];

const VERDICT_LABEL: Record<string, string> = { strong: "Strong Hire", consider: "Consider", "no-hire": "No Hire" };
const VERDICT_COLOR: Record<string, string> = { strong: "green", consider: "gold", "no-hire": "red" };

const columns: TableColumnsType<Row> = [
  {
    title: "Candidate",
    dataIndex: "name",
    key: "name",
    render: (_, r) => (
      <span className="ctr-who">
        <span className="ctr-av">{r.initials}</span>
        <span>
          <span className="ctr-name">{r.name}</span>
          <span className="ctr-role">{r.role}</span>
        </span>
      </span>
    ),
  },
  { title: "Track", dataIndex: "track", key: "track" },
  { title: "Score", dataIndex: "score", key: "score", render: (v: number) => <span className="tnum">{v.toFixed(1)}</span> },
  {
    title: "Verdict",
    dataIndex: "verdict",
    key: "verdict",
    render: (v: Row["verdict"]) => <Tag color={VERDICT_COLOR[v]}>{VERDICT_LABEL[v]}</Tag>,
  },
];

export function CandidateTable() {
  return <Table<Row> columns={columns} dataSource={[...ROWS]} pagination={false} size="middle" />;
}
