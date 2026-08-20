export type CaseStudy = {
  slug: string;
  client: string;
  industrySlug: string; // links back to /industries/[slug]
  industryName: string;
  trackHref: string; // which solution this case study is mainly about
  trackName: string;
  logo: string; // short mark shown in the client badge
  headline: string;
  summary: string; // for the index card
  challenge: string[];
  approach: string[];
  results: { value: string; label: string }[];
  quote: { text: string; name: string; role: string };
  roles: string[]; // job titles this case study is directly about
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "astraflow-leadership",
    client: "Astraflow",
    industrySlug: "technology-saas",
    industryName: "Technology & SaaS",
    trackHref: "/solutions/leadership-hiring",
    trackName: "Leadership Hiring",
    logo: "AF",
    headline: "Astraflow cut its VP-of-Engineering search from nine weeks to three.",
    summary: "A Series C SaaS company replaced ad-hoc executive panels with a structured leadership assessment — and hired faster without lowering its bar.",
    challenge: [
      "Astraflow's leadership panels varied wildly by interviewer, and two strong finalists were rejected by one panelist's gut call each — with no shared record of why.",
      "The VP-of-Engineering search had been open for six weeks with no finalist, and the board was pressing for a hire before the next funding milestone.",
    ],
    approach: [
      "Prelim ran a 360°-input and situational-judgment battery mapped to Astraflow's own leadership competency model, so every panelist scored candidates against the same rubric.",
      "Executive psychometrics were combined with a live scenario — leading a team through a mid-sprint scope cut — to surface real decision-making under pressure.",
    ],
    results: [
      { value: "63%", label: "faster time-to-signed-offer" },
      { value: "3", label: "finalists, all panel-aligned on ranking" },
      { value: "0", label: "disputed decisions post-hire" },
    ],
    quote: { text: "We stopped arguing about gut calls. Prelim gives every panel the same scorecard — our shortlists got sharper and faster in one quarter.", name: "Dana Koenig", role: "VP Talent, Astraflow" },
    roles: ["VP of Engineering", "Director of Engineering", "Engineering Manager"],
  },
  {
    slug: "meridian-technical",
    client: "Meridian",
    industrySlug: "financial-services",
    industryName: "Financial Services",
    trackHref: "/solutions/technical-hiring",
    trackName: "Technical Hiring",
    logo: "MD",
    headline: "Meridian replaced take-home tests with live assessment and cut technical hiring time in half.",
    summary: "A mid-size bank's platform engineering team was losing candidates to a two-week take-home process — Prelim's live IDE closed the gap.",
    challenge: [
      "Meridian's take-home assignments took candidates 8+ hours to complete and often sat ungraded for a week, causing strong candidates to accept competing offers.",
      "Interviewers suspected some take-homes weren't original work, but had no reliable way to confirm it.",
    ],
    approach: [
      "Prelim's Live Coding IDE replaced the take-home with a 90-minute, proctored session against a realistic slice of Meridian's own platform code.",
      "AI-assisted anti-cheat flagged two sessions for review without rejecting either candidate outright — both flags were false positives, cleared by a human reviewer within the hour.",
    ],
    results: [
      { value: "87%", label: "faster time-to-shortlist" },
      { value: "12 days", label: "average req-to-offer, down from 26" },
      { value: "100%", label: "of finalists completed the assessment same-week" },
    ],
    quote: { text: "Candidates actually said the assessment felt fair. That's not something we'd heard about our old take-home in three years.", name: "Priya Shah", role: "Head of Engineering, Meridian" },
    roles: ["Platform Engineer", "Backend Engineer", "Staff Engineer"],
  },
  {
    slug: "helix-non-it",
    client: "Helix",
    industrySlug: "healthcare",
    industryName: "Healthcare",
    trackHref: "/solutions/non-it-hiring",
    trackName: "Non-IT Hiring",
    logo: "HX",
    headline: "Helix Health cut 90-day clinical-role turnover by 42% with scenario-based screening.",
    summary: "A multi-site clinic network needed to screen hundreds of clinical hires per quarter without sacrificing patient-communication quality.",
    challenge: [
      "Helix's reference-check-only process couldn't predict how candidates would handle tense patient interactions, and 90-day turnover in clinical roles was costing the network real money.",
      "Volume made structured, multi-person panel interviews impractical at every site.",
    ],
    approach: [
      "Prelim deployed a clinical-knowledge and patient-communication scenario battery inside Helix's own VPC, satisfying its compliance team's data-residency requirement.",
      "Scores fed directly into Helix's ATS, so site managers saw a ranked shortlist without leaving their existing workflow.",
    ],
    results: [
      { value: "42%", label: "fewer 90-day clinical role exits" },
      { value: "6", label: "sites screening consistently on one standard" },
      { value: "0", label: "candidate data used outside Helix's own VPC" },
    ],
    quote: { text: "We finally had one bar for every site. It's not just faster hiring — it's hiring we can defend.", name: "Marcus Webb", role: "VP People, Helix" },
    roles: ["Registered Nurse", "Medical Assistant", "Patient Care Coordinator"],
  },
];

export const caseStudyBySlug = (slug: string) => CASE_STUDIES.find((c) => c.slug === slug);
