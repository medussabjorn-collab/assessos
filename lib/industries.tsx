import type { ComponentType, SVGProps } from "react";
import { Code, Building, Heart, Scale, Factory, Cart, Headset, Shield, Users, Server, Sparkles, Globe } from "@/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Track = {
  type: string;
  Icon: Icon;
  tagline: string;
  href: string;
};

export type Scenario = {
  role: string; // the req being filled
  challenge: string; // why it's hard to assess well
  approach: string; // what Prelim does differently
  metric: { value: string; label: string };
};

export type Industry = {
  slug: string;
  name: string;
  Icon: Icon;
  blurb: string; // short, for cards
  intro: string; // long, for the industry page hero
  tracks: Track[]; // the 3 hiring tracks, tailored
  focus: string[]; // what Prelim assesses in this industry
  scenario: Scenario; // a concrete, realistic hiring scenario for this industry
};

const leadership = (tagline: string): Track => ({ type: "Leadership Hiring", Icon: Shield, tagline, href: "/solutions/leadership-hiring" });
const technical = (tagline: string): Track => ({ type: "Technical Hiring", Icon: Code, tagline, href: "/solutions/technical-hiring" });
const nonIt = (tagline: string): Track => ({ type: "Non-IT Hiring", Icon: Users, tagline, href: "/solutions/non-it-hiring" });

export const INDUSTRIES: Industry[] = [
  {
    slug: "technology-saas",
    name: "Technology & SaaS",
    Icon: Code,
    blurb: "Engineering depth, product sense, and on-call judgment for high-growth teams.",
    intro: "From staff engineers to VPs of Product, tech hiring lives or dies on real ability. Prelim measures how candidates actually build, lead, and go to market — not how well they interview.",
    tracks: [
      leadership("Hire directors and VPs who can scale an eng or product org, not just run one."),
      technical("Assess real engineering ability with a live coding IDE and system-design tasks."),
      nonIt("Bring the same rigor to the sales, CS, and ops roles that make SaaS grow."),
    ],
    focus: ["Live coding & system design", "Product and technical judgment", "Go-to-market and RevOps aptitude", "Leadership at scale"],
    scenario: {
      role: "Staff Backend Engineer, Series C SaaS",
      challenge: "Take-home tasks were gameable and burned two weeks per hire, while whiteboard rounds rewarded memorized patterns over real system-design ability.",
      approach: "Prelim ran a live-repo assessment against a simplified slice of the candidate's actual future codebase, scoring architecture trade-offs and debugging under time pressure.",
      metric: { value: "9 days", label: "to signed offer, down from 6 weeks" },
    },
  },
  {
    slug: "financial-services",
    name: "Financial Services",
    Icon: Building,
    blurb: "Excel modeling, analytical reasoning, regulatory knowledge, and integrity signals.",
    intro: "In finance, a bad hire is a compliance and P&L risk. Prelim brings defensible, audit-ready assessment to every seat — from analysts to executives — with the controls procurement demands.",
    tracks: [
      leadership("Vet executives on judgment, integrity, and decisions made under regulatory pressure."),
      technical("Screen quant and platform engineers on realistic, secure engineering tasks."),
      nonIt("Test analysts on Excel modeling, analytical reasoning, and regulatory knowledge."),
    ],
    focus: ["Financial modeling & analysis", "Regulatory and compliance knowledge", "Integrity and risk judgment", "Audit-ready reporting"],
    scenario: {
      role: "Senior Credit Analyst, regional bank",
      challenge: "Case-study interviews couldn't consistently probe Excel modeling depth, and panels disagreed on what 'strong analytical reasoning' actually looked like.",
      approach: "Prelim's finance battery scored a live modeling exercise plus a regulatory-knowledge module, producing one rubric every interviewer could point to.",
      metric: { value: "31%", label: "fewer disputed panel decisions" },
    },
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    Icon: Heart,
    blurb: "Clinical knowledge, patient-communication scenarios, and compliance awareness.",
    intro: "Healthcare hiring balances clinical competence with communication and compliance. Prelim assesses all three fairly and accessibly, with deployment that keeps sensitive data inside your perimeter.",
    tracks: [
      leadership("Assess clinical and operational leaders on decisions that carry real risk."),
      technical("Evaluate health-tech engineers on secure, compliant, real-world builds."),
      nonIt("Measure clinical knowledge and patient-communication skills at scale."),
    ],
    focus: ["Clinical knowledge", "Patient communication scenarios", "Compliance and safety awareness", "Data residency & privacy"],
    scenario: {
      role: "Charge Nurse, multi-site clinic network",
      challenge: "Reference checks alone couldn't predict how candidates handled tense patient-communication moments, and volume made structured panel interviews impractical.",
      approach: "A scenario-based assessment scored triage judgment and patient communication, deployed inside the network's own VPC to satisfy its compliance team.",
      metric: { value: "42%", label: "fewer 90-day clinical role exits" },
    },
  },
  {
    slug: "legal",
    name: "Legal",
    Icon: Scale,
    blurb: "Legal research, contract drafting, and compliance reasoning under pressure.",
    intro: "Legal hiring rewards precision and judgment. Prelim measures research, drafting, and reasoning through realistic work samples — so you see how a candidate thinks, not just where they studied.",
    tracks: [
      leadership("Assess partners and general counsel on judgment and governance."),
      technical("Vet legal-tech engineers on practical, real-world engineering tasks."),
      nonIt("Test legal research, contract drafting, and compliance reasoning."),
    ],
    focus: ["Legal research & analysis", "Contract drafting work samples", "Compliance reasoning", "Governance judgment"],
    scenario: {
      role: "Mid-level Associate, corporate practice group",
      challenge: "Writing samples from prior firms said little about how a candidate reasons under time pressure on unfamiliar fact patterns.",
      approach: "Prelim scored a live contract-drafting exercise and a compliance-reasoning scenario against the same rubric every partner on the panel had reviewed in advance.",
      metric: { value: "2.3x", label: "more candidates cleared to final round" },
    },
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    Icon: Factory,
    blurb: "Process reasoning, safety judgment, and operations aptitude for the plant floor.",
    intro: "Manufacturing hiring spans the plant floor to the C-suite. Prelim measures process reasoning, safety judgment, and technical skill so you place the right people where reliability matters most.",
    tracks: [
      leadership("Hire plant and operations leaders on safety culture and process judgment."),
      technical("Assess automation and controls engineers on real, applied problems."),
      nonIt("Measure operations, quality, and supply-chain aptitude across roles."),
    ],
    focus: ["Process & operations reasoning", "Safety judgment", "Automation and controls skills", "Supply-chain aptitude"],
    scenario: {
      role: "Shift Supervisor, automotive parts plant",
      challenge: "Tenure and prior-plant references correlated poorly with actual safety judgment once someone was running a live floor.",
      approach: "A process-reasoning and safety-scenario battery scored how candidates prioritized under a simulated line stoppage, independent of years of experience.",
      metric: { value: "18%", label: "drop in first-year safety incidents" },
    },
  },
  {
    slug: "retail-ecommerce",
    name: "Retail & E-commerce",
    Icon: Cart,
    blurb: "Customer judgment and operations for high-volume, seasonal hiring.",
    intro: "Retail and e-commerce hire fast, at volume, and seasonally. Prelim's low-latency scoring lets you screen thousands fairly — from store associates to the engineers keeping storefronts fast.",
    tracks: [
      leadership("Vet retail and e-commerce leaders on customer and operations judgment."),
      technical("Screen platform and data engineers who keep storefronts fast and reliable."),
      nonIt("Assess high-volume store, support, and merchandising roles at speed."),
    ],
    focus: ["Customer judgment", "High-volume, low-latency screening", "Operations & merchandising aptitude", "Storefront engineering skills"],
    scenario: {
      role: "Seasonal store lead, 400-location retailer",
      challenge: "Peak-season hiring needed thousands of screens in six weeks, and manual phone screens couldn't keep pace without cutting corners on quality.",
      approach: "Low-latency operations and customer-judgment scoring let store managers see a ranked shortlist within minutes of each candidate finishing.",
      metric: { value: "207ms", label: "median scoring latency at 4,000+ concurrent tests" },
    },
  },
  {
    slug: "bpo-support",
    name: "BPO & Support",
    Icon: Headset,
    blurb: "Communication, problem-solving, and throughput at contact-center scale.",
    intro: "Contact-center hiring is a throughput game where quality still matters. Prelim screens for communication and problem-solving at scale, so you fill seats fast without lowering the bar.",
    tracks: [
      leadership("Hire operations leaders who run high-throughput support teams well."),
      technical("Assess tooling and automation engineers who scale support operations."),
      nonIt("Screen communication and problem-solving at contact-center volume."),
    ],
    focus: ["Communication skills", "Problem-solving under pressure", "High-throughput screening", "Support tooling & automation"],
    scenario: {
      role: "Tier 2 Support Agent, 24/7 contact center",
      challenge: "Turnover meant the team hired hundreds monthly, but resume-based screening let weak communicators through and hurt CSAT.",
      approach: "A communication and problem-solving battery scored candidates on realistic escalation scenarios, at the throughput a 24/7 center needs.",
      metric: { value: "8pt", label: "CSAT improvement within one quarter" },
    },
  },
  {
    slug: "insurance",
    name: "Insurance",
    Icon: Shield,
    blurb: "Actuarial reasoning, underwriting judgment, and claims-handling skills.",
    intro: "Insurance runs on judgment under uncertainty. Prelim assesses actuarial reasoning, underwriting decisions, and claims handling — with the compliance and audit trail carriers require.",
    tracks: [
      leadership("Vet executives on risk appetite, governance, and regulatory judgment."),
      technical("Assess actuarial, data, and platform engineers on real, applied problems."),
      nonIt("Test underwriting judgment, claims handling, and analytical reasoning."),
    ],
    focus: ["Actuarial & analytical reasoning", "Underwriting judgment", "Claims-handling scenarios", "Regulatory compliance"],
    scenario: {
      role: "Underwriter II, commercial lines carrier",
      challenge: "Underwriting judgment is hard to interview for — candidates could describe the right process without demonstrating it under realistic ambiguity.",
      approach: "Prelim scored a live underwriting scenario with incomplete information, benchmarked against how experienced underwriters at the carrier actually decided.",
      metric: { value: "27%", label: "reduction in early-tenure underwriting errors" },
    },
  },
  {
    slug: "energy-utilities",
    name: "Energy & Utilities",
    Icon: Factory,
    blurb: "Field operations, safety judgment, and technical reliability skills.",
    intro: "Energy and utilities can't afford unreliable hires. Prelim measures safety judgment, operations aptitude, and engineering skill for roles where uptime and compliance are non-negotiable.",
    tracks: [
      leadership("Hire operations and grid leaders on safety culture and reliability judgment."),
      technical("Assess field, controls, and platform engineers on applied problems."),
      nonIt("Measure operations, compliance, and field-service aptitude."),
    ],
    focus: ["Safety & reliability judgment", "Field operations aptitude", "Controls & engineering skills", "Regulatory compliance"],
    scenario: {
      role: "Grid Operations Engineer, regional utility",
      challenge: "A single reliability misjudgment carries outsized cost, but certifications alone don't reveal how someone reasons through cascading-failure scenarios.",
      approach: "A field-operations and controls-engineering assessment scored applied troubleshooting on realistic grid scenarios, not just credential checklists.",
      metric: { value: "3x", label: "faster screening for critical field roles" },
    },
  },
  {
    slug: "telecommunications",
    name: "Telecommunications",
    Icon: Server,
    blurb: "Network engineering, customer operations, and platform reliability.",
    intro: "Telecom hires span network engineers to high-volume support. Prelim screens for technical depth and customer aptitude at the scale carriers hire, without lowering the bar.",
    tracks: [
      leadership("Vet leaders on network reliability, scale, and customer judgment."),
      technical("Assess network and platform engineers on realistic, applied tasks."),
      nonIt("Screen sales, care, and field roles at high volume and speed."),
    ],
    focus: ["Network & platform engineering", "Reliability at scale", "High-volume support aptitude", "Customer judgment"],
    scenario: {
      role: "Network Reliability Engineer, national carrier",
      challenge: "On-call incidents demanded engineers who reason clearly under pressure, but interviews rewarded rehearsed answers over live troubleshooting.",
      approach: "Prelim's technical track simulated a degraded-network incident and scored root-cause reasoning and communication during resolution.",
      metric: { value: "22%", label: "faster mean-time-to-resolution among new hires" },
    },
  },
  {
    slug: "media-entertainment",
    name: "Media & Entertainment",
    Icon: Sparkles,
    blurb: "Creative judgment, product craft, and audience-scale engineering.",
    intro: "Media hires balance creative craft with technical scale. Prelim assesses product judgment, engineering ability, and the operational roles that keep content flowing to audiences.",
    tracks: [
      leadership("Assess leaders on creative judgment, product vision, and scale."),
      technical("Evaluate streaming, data, and platform engineers on real problems."),
      nonIt("Measure production, marketing, and operations aptitude."),
    ],
    focus: ["Product & creative judgment", "Streaming and platform engineering", "Audience-scale operations", "Marketing aptitude"],
    scenario: {
      role: "Senior Product Manager, streaming platform",
      challenge: "Portfolio reviews showcased past work but said little about how a candidate would prioritize trade-offs on the team's actual roadmap.",
      approach: "A situational-judgment exercise placed candidates inside a realistic prioritization scenario and scored the reasoning behind their trade-offs.",
      metric: { value: "70%", label: "of finalists rated 'strong hire' by every panelist" },
    },
  },
  {
    slug: "education",
    name: "Education",
    Icon: Users,
    blurb: "Instructional skill, communication, and academic-operations judgment.",
    intro: "Education hiring rewards communication and judgment as much as knowledge. Prelim assesses instructional skill, subject knowledge, and the operations roles that keep institutions running.",
    tracks: [
      leadership("Vet academic and administrative leaders on judgment and governance."),
      technical("Assess ed-tech engineers on secure, accessible, real-world builds."),
      nonIt("Measure instructional skill, communication, and subject knowledge."),
    ],
    focus: ["Instructional & communication skill", "Subject-matter knowledge", "Accessibility & fairness", "Academic operations"],
    scenario: {
      role: "Department Chair, secondary school network",
      challenge: "Demo lessons were inconsistent across interview panels, and there was no shared standard for what 'strong instructional judgment' meant.",
      approach: "A structured instructional-scenario assessment scored communication and subject knowledge against one accessible, rubric-based standard.",
      metric: { value: "100%", label: "of candidates screened with accommodations honored" },
    },
  },
  {
    slug: "government-public-sector",
    name: "Government & Public Sector",
    Icon: Building,
    blurb: "Policy judgment, compliance, and fair, defensible assessment at scale.",
    intro: "Public-sector hiring must be fair, defensible, and compliant. Prelim brings audit-ready, accessible assessment to government roles — with deployment options that meet strict data requirements.",
    tracks: [
      leadership("Assess public leaders on policy judgment and governance."),
      technical("Vet civic-tech engineers on secure, accessible, compliant builds."),
      nonIt("Measure policy analysis, administration, and service aptitude."),
    ],
    focus: ["Fair, defensible scoring", "Policy & analytical reasoning", "Accessibility compliance", "On-prem / VPC deployment"],
    scenario: {
      role: "Policy Analyst, state agency",
      challenge: "Civil-service hiring must withstand appeal, but panel-based interviews left decisions difficult to defend on paper.",
      approach: "Prelim scored policy-analysis reasoning against a published rubric and deployed on-prem to satisfy the agency's data-residency requirement.",
      metric: { value: "0", label: "successful appeals on assessment grounds to date" },
    },
  },
  {
    slug: "real-estate-construction",
    name: "Real Estate & Construction",
    Icon: Factory,
    blurb: "Project judgment, safety, and operations aptitude across the build cycle.",
    intro: "From project managers to field crews, construction and real estate hire for judgment and reliability. Prelim measures operations aptitude, safety judgment, and technical skill across the build cycle.",
    tracks: [
      leadership("Hire project and portfolio leaders on judgment and delivery."),
      technical("Assess proptech and systems engineers on applied problems."),
      nonIt("Measure project management, safety, and operations aptitude."),
    ],
    focus: ["Project & operations judgment", "Safety awareness", "Estimating & analytical skills", "Field reliability"],
    scenario: {
      role: "Project Manager, commercial general contractor",
      challenge: "Cost overruns often traced back to project managers who interviewed well but struggled with real-time trade-off judgment on-site.",
      approach: "A project-judgment scenario scored how candidates re-sequenced work and managed risk when a simulated schedule slipped mid-project.",
      metric: { value: "14%", label: "fewer schedule overruns on projects led by assessed hires" },
    },
  },
  {
    slug: "transportation-logistics",
    name: "Transportation & Logistics",
    Icon: Cart,
    blurb: "Operations reasoning, safety, and high-volume workforce screening.",
    intro: "Logistics hires at volume where reliability is everything. Prelim's low-latency scoring screens operations, safety, and technical roles fast — without sacrificing quality.",
    tracks: [
      leadership("Vet operations leaders on network judgment and reliability."),
      technical("Assess routing, data, and platform engineers on real problems."),
      nonIt("Screen high-volume operations and driver roles at speed."),
    ],
    focus: ["Operations & routing reasoning", "Safety judgment", "High-volume screening", "Supply-chain aptitude"],
    scenario: {
      role: "Dispatch Operations Lead, regional carrier",
      challenge: "Peak-volume hiring needed hundreds of operations screens weekly, but manual review couldn't keep pace without sacrificing quality.",
      approach: "Low-latency operations-reasoning and safety-judgment scoring let dispatch managers rank candidates the same day they applied.",
      metric: { value: "4x", label: "throughput increase in candidate screening" },
    },
  },
  {
    slug: "hospitality-travel",
    name: "Hospitality & Travel",
    Icon: Globe,
    blurb: "Service judgment, communication, and high-volume seasonal screening.",
    intro: "Hospitality lives and dies on service. Prelim screens for communication and judgment at the volume and seasonality this industry hires — so you fill seats fast with the right people.",
    tracks: [
      leadership("Hire property and operations leaders on service and P&L judgment."),
      technical("Assess booking and platform engineers who keep systems reliable."),
      nonIt("Measure service, communication, and operations aptitude at scale."),
    ],
    focus: ["Service & communication judgment", "High-volume, seasonal screening", "Operations aptitude", "Fair candidate experience"],
    scenario: {
      role: "Front Desk Supervisor, resort property group",
      challenge: "Seasonal ramp-up meant hiring hundreds of service roles in weeks, with guest-satisfaction scores riding on judgment interviews couldn't reliably surface.",
      approach: "A service-judgment scenario battery scored realistic guest-recovery situations, screened at the volume and speed the season required.",
      metric: { value: "19%", label: "improvement in guest-satisfaction scores" },
    },
  },
  {
    slug: "pharma-life-sciences",
    name: "Pharma & Life Sciences",
    Icon: Heart,
    blurb: "Scientific reasoning, regulatory rigor, and quality judgment.",
    intro: "Life sciences hiring demands scientific rigor and regulatory discipline. Prelim assesses reasoning, domain knowledge, and quality judgment — with the compliance and audit trail the industry requires.",
    tracks: [
      leadership("Assess R&D and commercial leaders on scientific and regulatory judgment."),
      technical("Evaluate bioinformatics and platform engineers on real, secure tasks."),
      nonIt("Measure scientific knowledge, quality, and regulatory reasoning."),
    ],
    focus: ["Scientific reasoning", "Regulatory & quality rigor", "Domain knowledge", "Audit-ready reporting"],
    scenario: {
      role: "Associate Director, Regulatory Affairs",
      challenge: "Regulatory judgment is high-stakes and rarely tested directly — resumes showed prior filings but not how a candidate reasons through a novel submission.",
      approach: "A scientific-reasoning and regulatory-rigor assessment scored candidates against realistic, audit-style scenarios with full evidence trails.",
      metric: { value: "100%", label: "of scores traceable to specific evidence for audit" },
    },
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    Icon: Scale,
    blurb: "Analytical rigor, client judgment, and communication under pressure.",
    intro: "Consulting and professional services sell judgment. Prelim measures analytical rigor, client communication, and problem-solving through realistic work samples — so you hire people clients trust.",
    tracks: [
      leadership("Vet partners and principals on client judgment and delivery."),
      technical("Assess data and platform engineers on applied, real-world problems."),
      nonIt("Test analytical reasoning, client communication, and problem-solving."),
    ],
    focus: ["Analytical & case reasoning", "Client communication", "Problem-solving work samples", "Judgment under pressure"],
    scenario: {
      role: "Senior Consultant, management consulting firm",
      challenge: "Traditional case interviews measured performance under artificial pressure but varied wildly by interviewer, making offers hard to compare fairly.",
      approach: "Prelim standardized the case exercise and scored analytical reasoning and client communication against one rubric across every interviewer.",
      metric: { value: "41%", label: "reduction in offer-decision time" },
    },
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
