export type Guide = {
  slug: string;
  title: string;
  dek: string;
  readMins: number;
  audience: string;
  steps: { title: string; body: string }[];
  related?: { label: string; href: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "rolling-out-structured-assessment",
    title: "Rolling out structured assessment across your hiring team",
    dek: "A practical playbook for moving from ad-hoc panels to one shared standard, without stalling your pipeline.",
    readMins: 8,
    audience: "Heads of Talent, Recruiting leaders",
    steps: [
      { title: "Start with your highest-volume role", body: "Don't try to standardize everything at once. Pick the single role you hire most often — it's where inconsistency costs the most, and where a win is easiest to prove to the rest of the org." },
      { title: "Build the rubric before the assessment", body: "Agree on what 'strong hire' looks like for this role in plain language before you design a single test question. The rubric is the artifact that keeps every future panel aligned, not the test itself." },
      { title: "Pilot on real requisitions, not hypotheticals", body: "Run the new assessment alongside your existing process on 3–5 live reqs. Compare outcomes, not opinions — did the assessment surface anyone the old process would have missed or wrongly advanced?" },
      { title: "Get hiring-manager buy-in with their own data", body: "Show each hiring manager how the assessment scored candidates they already have an opinion on. Agreement builds trust fast; disagreement is where the real conversation about bias and blind spots starts." },
      { title: "Roll out role by role, not company-wide", body: "Expand to your next two or three highest-volume roles once the pilot role is stable. A phased rollout gives you a working reference case for every new team you bring on board." },
      { title: "Review the data quarterly", body: "Look at time-to-shortlist, panel agreement rate, and 90-day retention for assessed hires versus your baseline. Structured assessment should show measurable movement within two quarters — if it doesn't, the rubric needs revisiting, not the whole program." },
    ],
    related: [
      { label: "Platform Overview", href: "/platform" },
      { label: "Analytics & Reporting", href: "/products/analytics-reporting" },
      { label: "Book a Demo", href: "/contact" },
    ],
  },
  {
    slug: "writing-a-defensible-scorecard",
    title: "Writing a scorecard you can defend to any candidate or auditor",
    dek: "The difference between a score that holds up and one that gets challenged comes down to five things.",
    readMins: 6,
    audience: "Hiring managers, People Ops",
    steps: [
      { title: "Anchor every score to a specific example", body: "\"Strong communicator\" is an opinion. \"Explained a technical trade-off to a non-technical stakeholder in under two minutes, unprompted\" is evidence. Write scorecards in the second register." },
      { title: "Separate the observation from the judgment", body: "Record what the candidate actually did or said first, then your rating. Mixing them together is how unconscious bias sneaks into an otherwise well-intentioned scorecard." },
      { title: "Use the same scale for everyone in the req", body: "A scorecard only works as a comparison tool if every candidate for the role is rated against the identical scale and identical questions. Ad-hoc follow-ups are fine — the core rubric shouldn't change mid-pipeline." },
      { title: "Note what you didn't get to assess", body: "If a candidate wasn't asked about a competency due to time, say so explicitly rather than leaving it blank or guessing. An honest gap is defensible; a silent assumption isn't." },
      { title: "Keep the paper trail", body: "Store scorecards with the assessment evidence they reference, not just the final number. If a decision is ever challenged — by a candidate, a regulator, or your own leadership — the evidence needs to be one click away, not a memory." },
    ],
    related: [
      { label: "Analytics & Reporting", href: "/products/analytics-reporting" },
      { label: "Security & Trust", href: "/security" },
      { label: "Platform Overview", href: "/platform" },
    ],
  },
  {
    slug: "calibrating-panels-across-interviewers",
    title: "Calibrating panels so five interviewers score like one",
    dek: "Panel disagreement isn't a sign of thoroughness. It's usually a sign of an uncalibrated rubric.",
    readMins: 5,
    audience: "Interview panels, Engineering managers",
    steps: [
      { title: "Run a calibration session before the pipeline opens", body: "Have every panelist independently score the same two or three sample transcripts against the rubric, then compare. Large gaps reveal exactly where the rubric is ambiguous, before it costs you a real candidate." },
      { title: "Define what each score point actually means", body: "A '4 out of 5' means something different to every interviewer unless you write down what separates a 3 from a 4 from a 5, with a concrete example for each. Vague scales are where calibration breaks down first." },
      { title: "Debrief disagreements, don't average them", body: "When two panelists land far apart on the same candidate, the fix isn't splitting the difference — it's a short conversation about what each of them actually observed. The gap itself is useful signal." },
      { title: "Rotate a lightweight audit", body: "Periodically have a third party — a lead, a peer team, or a structured tool — re-score a handful of already-decided candidates. Drift happens gradually; a quarterly spot-check catches it before it compounds." },
    ],
    related: [
      { label: "Analytics & Reporting", href: "/products/analytics-reporting" },
      { label: "Technical Assessment", href: "/products/technical-assessment" },
      { label: "Platform Overview", href: "/platform" },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
