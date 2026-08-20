const ROWS = [
  { initials: "AM", name: "Ava Meridian", role: "Staff Engineer", track: "Technical", score: 88.9, verdict: "strong" },
  { initials: "JB", name: "Jordan Blake", role: "VP of Engineering", track: "Leadership", score: 74.2, verdict: "consider" },
  { initials: "SO", name: "S. Okonkwo", role: "Operations Manager", track: "Non-IT", score: 81.3, verdict: "strong" },
  { initials: "TN", name: "T. Nakamura", role: "Sales Lead", track: "Non-IT", score: 74.1, verdict: "consider" },
  { initials: "SR", name: "Sam Rivera", role: "Financial Analyst", track: "Non-IT", score: 51.4, verdict: "no-hire" },
] as const;

const VERDICT_LABEL: Record<string, string> = { strong: "Strong Hire", consider: "Consider", "no-hire": "No Hire" };

export function CandidateTable() {
  return (
    <div className="cand-table">
      <div className="cand-table-head">
        <span>Candidate</span>
        <span>Track</span>
        <span>Score</span>
        <span>Verdict</span>
      </div>
      {ROWS.map((r) => (
        <div className="cand-table-row" key={r.name}>
          <span className="ctr-who">
            <span className="ctr-av">{r.initials}</span>
            <span>
              <span className="ctr-name">{r.name}</span>
              <span className="ctr-role">{r.role}</span>
            </span>
          </span>
          <span className="ctr-track">{r.track}</span>
          <span className="ctr-score tnum">{r.score}</span>
          <span className={`ctr-verdict ${r.verdict}`}>{VERDICT_LABEL[r.verdict]}</span>
        </div>
      ))}
    </div>
  );
}
