// Abstract client marks (fictional placeholder companies — no real trademarks).
// Each pairs a monogram with one of a few rotating geometric accents so the
// row reads as a set of distinct logos rather than a wall of identical badges.
const ACCENTS = ["diag", "dot", "arc", "chevron"] as const;
type Accent = (typeof ACCENTS)[number];

function AccentGlyph({ kind }: { kind: Accent }) {
  switch (kind) {
    case "diag":
      return <path d="M8 16L16 8" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" />;
    case "dot":
      return <circle cx="16" cy="8" r="2.1" fill="var(--accent-2)" />;
    case "arc":
      return <path d="M8 13a5 5 0 015-5" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" fill="none" />;
    case "chevron":
      return <path d="M8 11l3-3 3 3" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  }
}

export function ClientMark({ name, index }: { name: string; index: number }) {
  const mono = name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase() || "?";
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <span className="brand-mark client-mark">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="none" stroke="var(--line-2)" strokeWidth="1.2" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-2)" fontFamily="var(--font-sans)">{mono}</text>
        <AccentGlyph kind={accent} />
      </svg>
      <span className="lg">{name}</span>
    </span>
  );
}

// Real integration partners — identified by name + their real brand color,
// as a simple initial badge. Deliberately not a reproduction of each
// company's actual logo artwork (see CREDITS note on why).
const BRAND_COLOR: Record<string, string> = {
  Greenhouse: "#24A47F",
  Lever: "#5C3EE8",
  Workday: "#F89C0E",
  "SAP SuccessFactors": "#0FAAFF",
  Ashby: "#3E3E8A",
  iCIMS: "#0072CE",
  BambooHR: "#77C043",
  Slack: "#611F69",
};

export function IntegrationMark({ name }: { name: string }) {
  const initial = name.replace(/^SAP\s/, "").slice(0, 1).toUpperCase();
  const color = BRAND_COLOR[name] || "var(--accent)";
  return (
    <span className="brand-mark integration-mark">
      <span className="im-badge" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
        {initial}
      </span>
      <span className="lg">{name}</span>
    </span>
  );
}
