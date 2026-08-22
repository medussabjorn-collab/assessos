export type CompareRow = {
  dimension: string;
  prelim: { text: string; win?: boolean };
  competitor: { text: string; win?: boolean };
};

export type CompareData = {
  slug: string;
  competitor: string;
  tagline: string; // competitor's own positioning
  heroTitle: string;
  heroSub: string;
  verdict: string; // one-line "choose X if..."
  verdictCompetitor: string;
  rows: CompareRow[];
  choosePrelimIf: string[];
  chooseCompetitorIf: string[];
};

export const COMPARISONS: CompareData[] = [
  {
    slug: "hackerrank",
    competitor: "HackerRank",
    tagline: "End-to-end developer hiring platform with 6,000+ technical questions.",
    heroTitle: "Prelim vs. HackerRank",
    heroSub:
      "HackerRank is the right tool if you only hire engineers. Prelim is the right tool if you hire everyone else too.",
    verdict:
      "Choose Prelim when your enterprise needs one assessment layer across engineering, leadership, and non-IT — not a separate tool for each.",
    verdictCompetitor:
      "Choose HackerRank when your primary need is a proven, deep developer-hiring platform with extensive question content and a mature screening-to-interview workflow.",
    rows: [
      {
        dimension: "Hiring scope",
        prelim: { text: "Technical, leadership, and non-IT (finance, ops, sales, healthcare, legal) — one platform", win: true },
        competitor: { text: "Engineering and developer roles only" },
      },
      {
        dimension: "Scoring model",
        prelim: { text: "One unified model — 'strong hire' means the same thing for an engineer and a CFO", win: true },
        competitor: { text: "Developer-specific skills framework; separate tools needed for other functions" },
      },
      {
        dimension: "Technical question library",
        prelim: { text: "10,000+ challenges across technical and non-technical domains" },
        competitor: { text: "6,000+ technical questions and projects with strong developer-role taxonomy", win: true },
      },
      {
        dimension: "Coding environment",
        prelim: { text: "Browser IDE with live test execution, real repositories, 40+ languages" },
        competitor: { text: "Browser-based coding + collaborative live interview environment", win: true },
      },
      {
        dimension: "Leadership assessment",
        prelim: { text: "360°, situational judgment, and executive psychometrics built in", win: true },
        competitor: { text: "Not offered" },
      },
      {
        dimension: "Non-IT / functional roles",
        prelim: { text: "Validated batteries for finance, sales, ops, healthcare, legal", win: true },
        competitor: { text: "Not offered" },
      },
      {
        dimension: "Integrity & anti-cheating",
        prelim: { text: "Keystroke/paste telemetry, tab-switch alerts, screen monitoring, optional webcam proctoring" },
        competitor: { text: "Reliable, secure skills-based evaluation; flexible weighted scoring" },
      },
      {
        dimension: "Enterprise security",
        prelim: { text: "SOC 2 Type II, GDPR, cloud / VPC / on-prem deployment", win: true },
        competitor: { text: "Enterprise-grade; established market footprint" },
      },
      {
        dimension: "ATS integrations",
        prelim: { text: "Greenhouse, Lever, Workday, SAP, REST API" },
        competitor: { text: "Broad ATS and custom workflow integrations", win: true },
      },
      {
        dimension: "Candidate comparison across functions",
        prelim: { text: "Native — same model scores engineers and ops managers", win: true },
        competitor: { text: "Not possible — different tools, incomparable scales" },
      },
    ],
    choosePrelimIf: [
      "Your org hires across engineering, leadership, and non-IT functions and needs one platform",
      "You want comparable verdicts across job families — 'strong hire' should mean the same thing everywhere",
      "You need leadership and executive assessment alongside technical hiring",
      "Compliance, audit trails, and cross-functional reporting matter to your HR or legal team",
    ],
    chooseCompetitorIf: [
      "Your entire hiring need is engineering and developer roles",
      "You need the deepest possible developer-role question taxonomy",
      "You have a mature technical hiring workflow and want the most established platform in that category",
    ],
  },
  {
    slug: "codility",
    competitor: "Codility",
    tagline: "Assessment-science-led technical recruitment centered on realistic VS Code environments.",
    heroTitle: "Prelim vs. Codility",
    heroSub:
      "Codility sets the standard for realistic coding environments. Prelim is the standard for enterprises that also need to assess leaders and every other function.",
    verdict:
      "Choose Prelim when your enterprise needs one assessment layer across engineering, leadership, and non-IT — not a best-in-class coding tool that stops at engineering.",
    verdictCompetitor:
      "Choose Codility when realistic VS Code environments, code-quality signals, and engineering workforce skills mapping are your primary hiring priorities.",
    rows: [
      {
        dimension: "Hiring scope",
        prelim: { text: "Technical, leadership, and non-IT (finance, ops, sales, healthcare, legal) — one platform", win: true },
        competitor: { text: "Engineering and technical roles only" },
      },
      {
        dimension: "Coding environment fidelity",
        prelim: { text: "Browser IDE with live execution, real repositories, customizable scaffolding" },
        competitor: { text: "Native VS Code with terminal access, multi-file projects, package installation, full documentation", win: true },
      },
      {
        dimension: "Code quality signals",
        prelim: { text: "Reasoning-aware grading; inconsistency detection across the session" },
        competitor: { text: "Automated signals on code quality, maintainability, and complexity", win: true },
      },
      {
        dimension: "Assessment science",
        prelim: { text: "Validated rubrics across 60+ assessment types" },
        competitor: { text: "Strong assessment-science foundation; validity-centered methodology", win: true },
      },
      {
        dimension: "Leadership assessment",
        prelim: { text: "360°, situational judgment, and executive psychometrics built in", win: true },
        competitor: { text: "Not offered" },
      },
      {
        dimension: "Non-IT / functional roles",
        prelim: { text: "Validated batteries for finance, sales, ops, healthcare, legal", win: true },
        competitor: { text: "Not offered" },
      },
      {
        dimension: "Scoring model",
        prelim: { text: "One unified model across all job families — comparable verdicts enterprise-wide", win: true },
        competitor: { text: "Engineering-specific; a separate Skills Intelligence product maps existing capability" },
      },
      {
        dimension: "AI-era integrity controls",
        prelim: { text: "Keystroke/paste telemetry, screen monitoring, anomaly flags, optional webcam proctoring" },
        competitor: { text: "Identity verification, impersonation detection, plagiarism prevention, AI-specific tasks, desktop app at enterprise tier", win: true },
      },
      {
        dimension: "Enterprise security",
        prelim: { text: "SOC 2 Type II, GDPR, cloud / VPC / on-prem deployment", win: true },
        competitor: { text: "Accessibility compliance, regional hosting options, broad enterprise integrations" },
      },
      {
        dimension: "ATS integrations",
        prelim: { text: "Greenhouse, Lever, Workday, SAP, REST API" },
        competitor: { text: "Greenhouse, Lever, Ashby, Workday, SAP and more", win: true },
      },
    ],
    choosePrelimIf: [
      "Your org hires across engineering, leadership, and non-IT functions and needs one platform",
      "You want one scoring model so 'strong hire' means the same thing for an engineer and a VP of Sales",
      "You need leadership and executive assessment built in — not a separate product or vendor",
      "Cross-functional reporting and a single audit trail matter to your HR or compliance team",
    ],
    chooseCompetitorIf: [
      "Your entire hiring need is engineering and technical roles",
      "A native VS Code environment and rich code-quality analytics are strategic priorities",
      "Engineering workforce skills mapping (existing team, not just new hires) is a core requirement",
      "You want the most rigorously validated assessment-science methodology in the engineering hiring space",
    ],
  },
];

export const compareBySlug = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
