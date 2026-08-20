import type { ComponentType, SVGProps } from "react";
import { Code, Building, Heart, Scale, Factory, Cart, Headset, Shield, Users, Server, Sparkles, Globe } from "@/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Track = {
  type: string;
  Icon: Icon;
  tagline: string;
  href: string;
  roles: string[]; // representative job titles Prelim assesses for this track
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
  overview: { title: string; body: string }; // deeper explanation of the industry's hiring problem
  faq: { q: string; a: string }[]; // industry-specific questions
};

const leadership = (tagline: string, roles: string[]): Track => ({ type: "Leadership Hiring", Icon: Shield, tagline, href: "/solutions/leadership-hiring", roles });
const technical = (tagline: string, roles: string[]): Track => ({ type: "Technical Hiring", Icon: Code, tagline, href: "/solutions/technical-hiring", roles });
const nonIt = (tagline: string, roles: string[]): Track => ({ type: "Non-IT Hiring", Icon: Users, tagline, href: "/solutions/non-it-hiring", roles });

export const INDUSTRIES: Industry[] = [
  {
    slug: "technology-saas",
    name: "Technology & SaaS",
    Icon: Code,
    blurb: "Engineering depth, product sense, and on-call judgment for high-growth teams.",
    intro: "From staff engineers to VPs of Product, tech hiring lives or dies on real ability. Prelim measures how candidates actually build, lead, and go to market — not how well they interview.",
    tracks: [
      { type: "Engineering Leadership", Icon: Shield, tagline: "Hire directors and VPs who can scale an eng or product org, not just run one.", href: "/solutions/leadership-hiring", roles: ["VP of Engineering", "Director of Engineering", "Engineering Manager", "Head of Product", "CTO"] },
      { type: "Backend & Platform", Icon: Code, tagline: "Distributed systems, APIs, and infrastructure — assessed with a live coding IDE and system-design tasks.", href: "/solutions/technical-hiring", roles: ["Backend Engineer", "Platform Engineer", "Staff Engineer", "Site Reliability Engineer"] },
      { type: "Frontend & Product Eng", Icon: Sparkles, tagline: "UI craft and product sense, assessed on real feature work, not algorithm trivia.", href: "/solutions/technical-hiring", roles: ["Frontend Engineer", "Full-Stack Engineer", "Product Engineer", "UI Engineer"] },
      { type: "Data, ML & Infra", Icon: Server, tagline: "Data pipelines, ML systems, and DevOps — assessed on realistic operational scenarios.", href: "/solutions/technical-hiring", roles: ["Data Engineer", "ML Engineer", "DevOps Engineer", "Cloud Infrastructure Engineer"] },
    ],
    focus: ["Live coding & system design", "Product and technical judgment", "Data & infrastructure aptitude", "Leadership at scale"],
    scenario: {
      role: "Staff Backend Engineer, Series C SaaS",
      challenge: "Take-home tasks were gameable and burned two weeks per hire, while whiteboard rounds rewarded memorized patterns over real system-design ability.",
      approach: "Prelim ran a live-repo assessment against a simplified slice of the candidate's actual future codebase, scoring architecture trade-offs and debugging under time pressure.",
      metric: { value: "9 days", label: "to signed offer, down from 6 weeks" },
    },
    overview: {
      title: "Engineering culture runs on trust in your process.",
      body: "Tech and SaaS companies compete for the same small pool of strong engineers and product leaders, and a slow or inconsistent hiring process is the fastest way to lose them to a competitor. Prelim gives you a rigor bar that scales from your first ten engineers to your thousandth — live coding for backend, frontend, and data/infra depth, and situational judgment for the leaders who'll scale your org.",
    },
    faq: [
      { q: "Does Prelim work for both IC and management tracks?", a: "Yes. Technical Hiring covers individual-contributor engineering roles; Leadership Hiring covers engineering and product management, scored on judgment and org-scaling ability rather than raw coding depth." },
      { q: "Can we test candidates on our own stack?", a: "Yes. Prelim supports custom repositories and environments so candidates work against something close to your actual codebase, not a generic exercise." },
      { q: "How fast can we stand up an assessment for a new role?", a: "Most teams go from job description to a live assessment the same day using the AI Test Builder, then adjust before it goes out to candidates." },
    ],
  },
  {
    slug: "financial-services",
    name: "Financial Services",
    Icon: Building,
    blurb: "Excel modeling, analytical reasoning, regulatory knowledge, and integrity signals.",
    intro: "In finance, a bad hire is a compliance and P&L risk. Prelim brings defensible, audit-ready assessment to every seat — from analysts to executives — with the controls procurement demands.",
    tracks: [
      leadership("Vet executives on judgment, integrity, and decisions made under regulatory pressure.", ["Chief Risk Officer", "VP of Finance", "Head of Compliance", "Branch Manager", "Managing Director"]),
      technical("Screen quant and platform engineers on realistic, secure engineering tasks.", ["Quant Developer", "Trading Systems Engineer", "Data Engineer", "Platform Engineer"]),
      nonIt("Test analysts on Excel modeling, analytical reasoning, and regulatory knowledge.", ["Financial Analyst", "Credit Analyst", "Underwriter", "Loan Officer", "Compliance Officer", "Auditor", "Treasury Analyst", "Wealth Manager"]),
    ],
    focus: ["Financial modeling & analysis", "Regulatory and compliance knowledge", "Integrity and risk judgment", "Audit-ready reporting"],
    scenario: {
      role: "Senior Credit Analyst, regional bank",
      challenge: "Case-study interviews couldn't consistently probe Excel modeling depth, and panels disagreed on what 'strong analytical reasoning' actually looked like.",
      approach: "Prelim's finance battery scored a live modeling exercise plus a regulatory-knowledge module, producing one rubric every interviewer could point to.",
      metric: { value: "31%", label: "fewer disputed panel decisions" },
    },
    overview: {
      title: "A bad hire in finance is a compliance risk, not just a cost.",
      body: "Financial services hiring has to satisfy two audiences at once: a hiring manager who needs someone who can actually do the analytical work, and a compliance function that needs a defensible, auditable record of why. Prelim's finance batteries score modeling ability and regulatory knowledge with the same rigor your risk team applies elsewhere, and every verdict comes with the evidence trail examiners expect to see.",
    },
    faq: [
      { q: "Can assessments be customized for regulatory requirements specific to our jurisdiction?", a: "Yes. Content can be tailored to jurisdiction-specific regulatory knowledge, and deployment can run in-region to satisfy data residency requirements." },
      { q: "Do you support high-volume analyst hiring, like campus programs?", a: "Yes. The same finance battery scales from a single senior hire to a full graduate class, with consistent scoring across every candidate." },
      { q: "How is candidate data protected for sensitive financial roles?", a: "SOC 2 Type II controls, optional VPC or on-prem deployment, and candidate data that's never used to train models — the same standard we apply enterprise-wide." },
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    Icon: Heart,
    blurb: "Clinical knowledge, patient-communication scenarios, and compliance awareness.",
    intro: "Healthcare hiring balances clinical competence with communication and compliance. Prelim assesses all three fairly and accessibly, with deployment that keeps sensitive data inside your perimeter.",
    tracks: [
      leadership("Assess clinical and operational leaders on decisions that carry real risk.", ["Chief Nursing Officer", "Clinical Director", "Practice Manager", "VP of Clinical Operations"]),
      technical("Evaluate health-tech engineers on secure, compliant, real-world builds.", ["Health IT Engineer", "Clinical Systems Analyst", "EHR Integration Engineer"]),
      nonIt("Measure clinical knowledge and patient-communication skills at scale.", ["Registered Nurse", "Medical Assistant", "Patient Care Coordinator", "Clinical Documentation Specialist", "Physician", "Pharmacist"]),
    ],
    focus: ["Clinical knowledge", "Patient communication scenarios", "Compliance and safety awareness", "Data residency & privacy"],
    scenario: {
      role: "Charge Nurse, multi-site clinic network",
      challenge: "Reference checks alone couldn't predict how candidates handled tense patient-communication moments, and volume made structured panel interviews impractical.",
      approach: "A scenario-based assessment scored triage judgment and patient communication, deployed inside the network's own VPC to satisfy its compliance team.",
      metric: { value: "42%", label: "fewer 90-day clinical role exits" },
    },
    overview: {
      title: "Clinical competence and bedside manner both matter. Neither is easy to interview for.",
      body: "Healthcare hiring has to move fast — units run short-staffed while a req sits open — without cutting corners on the two things that actually predict whether someone thrives on the floor: clinical knowledge and how they communicate with patients under stress. Prelim assesses both directly through realistic scenarios, and keeps every candidate's health-adjacent data inside the deployment boundary your compliance team requires.",
    },
    faq: [
      { q: "Can this be used for both clinical and administrative healthcare roles?", a: "Yes. Clinical batteries cover nursing, allied health, and physician-adjacent roles; non-clinical administrative and operations roles use Prelim's broader non-IT batteries." },
      { q: "How do you keep patient-adjacent candidate data compliant?", a: "Deployment options include a dedicated VPC or fully on-prem hosting, so sensitive data never has to leave your environment." },
      { q: "Can assessments accommodate candidates with disabilities?", a: "Yes. Every assessment supports screen readers, extended time, and other accommodations by default, not as a special request." },
    ],
  },
  {
    slug: "legal",
    name: "Legal",
    Icon: Scale,
    blurb: "Legal research, contract drafting, and compliance reasoning under pressure.",
    intro: "Legal hiring rewards precision and judgment. Prelim measures research, drafting, and reasoning through realistic work samples — so you see how a candidate thinks, not just where they studied.",
    tracks: [
      leadership("Assess partners and general counsel on judgment and governance.", ["General Counsel", "Managing Partner", "Practice Group Leader"]),
      technical("Vet legal-tech engineers on practical, real-world engineering tasks.", ["Legal Tech Engineer", "eDiscovery Engineer", "Contract Automation Developer"]),
      nonIt("Test legal research, contract drafting, and compliance reasoning.", ["Associate Attorney", "Paralegal", "Legal Researcher", "Contract Manager", "Compliance Counsel"]),
    ],
    focus: ["Legal research & analysis", "Contract drafting work samples", "Compliance reasoning", "Governance judgment"],
    scenario: {
      role: "Mid-level Associate, corporate practice group",
      challenge: "Writing samples from prior firms said little about how a candidate reasons under time pressure on unfamiliar fact patterns.",
      approach: "Prelim scored a live contract-drafting exercise and a compliance-reasoning scenario against the same rubric every partner on the panel had reviewed in advance.",
      metric: { value: "2.3x", label: "more candidates cleared to final round" },
    },
    overview: {
      title: "Pedigree isn't the same as judgment.",
      body: "Legal hiring has historically leaned hard on where a candidate went to school and where they've worked, because those signals were easier to check than actual reasoning ability. Prelim measures the thing that actually matters — how a candidate researches, drafts, and reasons through an unfamiliar fact pattern under real time pressure — so firms can widen the funnel without lowering the bar.",
    },
    faq: [
      { q: "Can assessments be tailored to our practice area?", a: "Yes. Legal research and drafting exercises can be built around the specific practice area — corporate, litigation, IP, and more — rather than generic legal scenarios." },
      { q: "Do associates and paralegals need different assessments?", a: "Yes. Prelim scales the complexity and rubric to the seniority and role, from summer associate through lateral partner." },
      { q: "How do you prevent AI-assisted drafting from skewing results?", a: "Anti-cheating and integrity signals are tuned for the AI era, flagging anomalies for human review rather than silently rejecting candidates." },
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    Icon: Factory,
    blurb: "Process reasoning, safety judgment, and operations aptitude for the plant floor.",
    intro: "Manufacturing hiring spans the plant floor to the C-suite. Prelim measures process reasoning, safety judgment, and technical skill so you place the right people where reliability matters most.",
    tracks: [
      leadership("Hire plant and operations leaders on safety culture and process judgment.", ["Plant Manager", "VP of Operations", "Director of Manufacturing"]),
      technical("Assess automation and controls engineers on real, applied problems.", ["Automation Engineer", "Controls Engineer", "Manufacturing Systems Engineer"]),
      nonIt("Measure operations, quality, and supply-chain aptitude across roles.", ["Quality Manager", "Production Supervisor", "Supply Chain Analyst", "Process Engineer", "Safety Coordinator"]),
    ],
    focus: ["Process & operations reasoning", "Safety judgment", "Automation and controls skills", "Supply-chain aptitude"],
    scenario: {
      role: "Shift Supervisor, automotive parts plant",
      challenge: "Tenure and prior-plant references correlated poorly with actual safety judgment once someone was running a live floor.",
      approach: "A process-reasoning and safety-scenario battery scored how candidates prioritized under a simulated line stoppage, independent of years of experience.",
      metric: { value: "18%", label: "drop in first-year safety incidents" },
    },
    overview: {
      title: "The gap between a good resume and a safe floor supervisor is real.",
      body: "Manufacturing hiring spans the plant floor to the C-suite, and the roles in between — shift leads, process engineers, quality managers — carry real safety and throughput consequences if the wrong person gets the job. Prelim's process-reasoning and safety-judgment scenarios test how candidates actually think under the kind of pressure a live production line creates, independent of how polished they are in an interview room.",
    },
    faq: [
      { q: "Can assessments reflect our specific safety protocols?", a: "Yes. Safety-judgment scenarios can be built around your actual procedures and common failure modes, not generic industrial safety trivia." },
      { q: "Do you support hourly and shift-based hiring at volume?", a: "Yes. Low-latency scoring makes it practical to screen large hourly applicant pools quickly without sacrificing assessment quality." },
      { q: "Can this assess both floor supervisors and engineering roles?", a: "Yes. Leadership and Non-IT tracks cover operations and safety leadership; Technical Hiring covers automation and controls engineering." },
    ],
  },
  {
    slug: "retail-ecommerce",
    name: "Retail & E-commerce",
    Icon: Cart,
    blurb: "Customer judgment and operations for high-volume, seasonal hiring.",
    intro: "Retail and e-commerce hire fast, at volume, and seasonally. Prelim's low-latency scoring lets you screen thousands fairly — from store associates to the engineers keeping storefronts fast.",
    tracks: [
      leadership("Vet retail and e-commerce leaders on customer and operations judgment.", ["VP of Retail Operations", "Regional Store Director", "Head of E-commerce"]),
      technical("Screen platform and data engineers who keep storefronts fast and reliable.", ["E-commerce Platform Engineer", "Data Engineer", "Site Reliability Engineer"]),
      nonIt("Assess high-volume store, support, and merchandising roles at speed.", ["Store Manager", "Merchandiser", "Customer Service Representative", "Inventory Analyst", "Buyer"]),
    ],
    focus: ["Customer judgment", "High-volume, low-latency screening", "Operations & merchandising aptitude", "Storefront engineering skills"],
    scenario: {
      role: "Seasonal store lead, 400-location retailer",
      challenge: "Peak-season hiring needed thousands of screens in six weeks, and manual phone screens couldn't keep pace without cutting corners on quality.",
      approach: "Low-latency operations and customer-judgment scoring let store managers see a ranked shortlist within minutes of each candidate finishing.",
      metric: { value: "207ms", label: "median scoring latency at 4,000+ concurrent tests" },
    },
    overview: {
      title: "Volume and quality don't have to trade off.",
      body: "Retail and e-commerce hire in bursts — seasonal ramp-ups, new store openings, launch-driven engineering pushes — and the old choice was speed or rigor, never both. Prelim's low-latency scoring handles thousands of concurrent candidates while still applying the same structured judgment your best manual screeners would, so a hiring spike doesn't mean a quality dip.",
    },
    faq: [
      { q: "Can Prelim handle a seasonal hiring surge?", a: "Yes. The platform is built for high-concurrency screening, tested at 4,000+ simultaneous assessments without degraded latency." },
      { q: "Does this work for both store-level and corporate/engineering roles?", a: "Yes. Non-IT batteries cover store, support, and merchandising roles; Technical Hiring covers the engineers keeping storefronts and platforms running." },
      { q: "Can we brand or customize the candidate experience?", a: "Assessment content and instructions can be tailored to your voice, and the candidate experience is designed to be fast and respectful even at high volume." },
    ],
  },
  {
    slug: "bpo-support",
    name: "BPO & Support",
    Icon: Headset,
    blurb: "Communication, problem-solving, and throughput at contact-center scale.",
    intro: "Contact-center hiring is a throughput game where quality still matters. Prelim screens for communication and problem-solving at scale, so you fill seats fast without lowering the bar.",
    tracks: [
      leadership("Hire operations leaders who run high-throughput support teams well.", ["Operations Director", "Contact Center Manager", "VP of Customer Experience"]),
      technical("Assess tooling and automation engineers who scale support operations.", ["Support Tooling Engineer", "Automation Engineer", "IVR/Telephony Engineer"]),
      nonIt("Screen communication and problem-solving at contact-center volume.", ["Customer Support Representative", "Technical Support Agent", "Team Lead", "Quality Analyst"]),
    ],
    focus: ["Communication skills", "Problem-solving under pressure", "High-throughput screening", "Support tooling & automation"],
    scenario: {
      role: "Tier 2 Support Agent, 24/7 contact center",
      challenge: "Turnover meant the team hired hundreds monthly, but resume-based screening let weak communicators through and hurt CSAT.",
      approach: "A communication and problem-solving battery scored candidates on realistic escalation scenarios, at the throughput a 24/7 center needs.",
      metric: { value: "8pt", label: "CSAT improvement within one quarter" },
    },
    overview: {
      title: "Throughput hiring doesn't have to mean throwaway hiring.",
      body: "Contact-center and BPO hiring runs at a scale most other functions never see — hundreds of hires a month isn't unusual — and that volume tempts teams into resume-only screening that lets weak communicators through. Prelim's communication and problem-solving battery scores every candidate against the same bar, fast enough to keep pace with your throughput requirements without becoming the bottleneck.",
    },
    faq: [
      { q: "Can Prelim keep up with hundreds of hires per month?", a: "Yes. Low-latency, high-concurrency scoring is built for exactly this volume, with auto-ranking so recruiters see a prioritized queue, not a raw pile of scores." },
      { q: "Does this cover multilingual support teams?", a: "Yes. Assessments support multiple languages and can be localized for region-specific support operations." },
      { q: "Can we assess for tooling and process-improvement roles too?", a: "Yes. Technical Hiring and Leadership tracks cover the engineers and operations leaders who build and run your support tooling." },
    ],
  },
  {
    slug: "insurance",
    name: "Insurance",
    Icon: Shield,
    blurb: "Actuarial reasoning, underwriting judgment, and claims-handling skills.",
    intro: "Insurance runs on judgment under uncertainty. Prelim assesses actuarial reasoning, underwriting decisions, and claims handling — with the compliance and audit trail carriers require.",
    tracks: [
      leadership("Vet executives on risk appetite, governance, and regulatory judgment.", ["Chief Underwriting Officer", "VP of Claims", "Regional Sales Director"]),
      technical("Assess actuarial, data, and platform engineers on real, applied problems.", ["Actuarial Data Scientist", "Claims Systems Engineer", "Platform Engineer"]),
      nonIt("Test underwriting judgment, claims handling, and analytical reasoning.", ["Underwriter", "Claims Adjuster", "Actuary", "Insurance Agent", "Risk Analyst"]),
    ],
    focus: ["Actuarial & analytical reasoning", "Underwriting judgment", "Claims-handling scenarios", "Regulatory compliance"],
    scenario: {
      role: "Underwriter II, commercial lines carrier",
      challenge: "Underwriting judgment is hard to interview for — candidates could describe the right process without demonstrating it under realistic ambiguity.",
      approach: "Prelim scored a live underwriting scenario with incomplete information, benchmarked against how experienced underwriters at the carrier actually decided.",
      metric: { value: "27%", label: "reduction in early-tenure underwriting errors" },
    },
    overview: {
      title: "Underwriting is judgment under incomplete information. Score it that way.",
      body: "Insurance carriers hire for a skill that's genuinely hard to see in an interview: making a sound call with imperfect data, consistently, under time pressure. Prelim's underwriting and claims scenarios put candidates in exactly that position, so you're measuring the actual competency the seat requires rather than how confidently someone describes their process.",
    },
    faq: [
      { q: "Can assessments reflect our specific lines of business?", a: "Yes. Underwriting and claims scenarios can be tailored to commercial, personal, or specialty lines to match how your teams actually work." },
      { q: "How do you handle regulatory examination requirements?", a: "Every score is evidence-linked and exportable, giving you an audit-ready record for regulatory review." },
      { q: "Can this support actuarial and data science hiring too?", a: "Yes. Technical Hiring covers actuarial, data, and platform engineering roles alongside the underwriting and claims batteries." },
    ],
  },
  {
    slug: "energy-utilities",
    name: "Energy & Utilities",
    Icon: Factory,
    blurb: "Field operations, safety judgment, and technical reliability skills.",
    intro: "Energy and utilities can't afford unreliable hires. Prelim measures safety judgment, operations aptitude, and engineering skill for roles where uptime and compliance are non-negotiable.",
    tracks: [
      leadership("Hire operations and grid leaders on safety culture and reliability judgment.", ["Director of Grid Operations", "VP of Engineering", "Plant Manager"]),
      technical("Assess field, controls, and platform engineers on applied problems.", ["Controls Engineer", "SCADA Engineer", "Grid Software Engineer"]),
      nonIt("Measure operations, compliance, and field-service aptitude.", ["Field Technician", "Operations Analyst", "Safety Officer", "Energy Trader"]),
    ],
    focus: ["Safety & reliability judgment", "Field operations aptitude", "Controls & engineering skills", "Regulatory compliance"],
    scenario: {
      role: "Grid Operations Engineer, regional utility",
      challenge: "A single reliability misjudgment carries outsized cost, but certifications alone don't reveal how someone reasons through cascading-failure scenarios.",
      approach: "A field-operations and controls-engineering assessment scored applied troubleshooting on realistic grid scenarios, not just credential checklists.",
      metric: { value: "3x", label: "faster screening for critical field roles" },
    },
    overview: {
      title: "Reliability isn't optional when the grid is the product.",
      body: "Energy and utilities operate infrastructure where a single misjudgment can cascade into an outage affecting thousands of customers, so hiring for field, controls, and operations roles has to prioritize sound judgment over interview polish. Prelim's applied troubleshooting and safety-judgment scenarios reveal how a candidate actually reasons through a developing incident, before they're the one making that call on your grid.",
    },
    faq: [
      { q: "Can scenarios reflect our specific equipment and protocols?", a: "Yes. Field-operations exercises can be built around your actual systems and incident types rather than generic utility scenarios." },
      { q: "Does this support both union and non-union hiring processes?", a: "Yes. Assessment content and process can be adapted to fit your existing hiring workflow and any applicable agreements." },
      { q: "Can Prelim assess control-room and SCADA-adjacent technical roles?", a: "Yes. Technical Hiring covers controls and platform engineers with applied, realistic troubleshooting tasks." },
    ],
  },
  {
    slug: "telecommunications",
    name: "Telecommunications",
    Icon: Server,
    blurb: "Network engineering, customer operations, and platform reliability.",
    intro: "Telecom hires span network engineers to high-volume support. Prelim screens for technical depth and customer aptitude at the scale carriers hire, without lowering the bar.",
    tracks: [
      leadership("Vet leaders on network reliability, scale, and customer judgment.", ["VP of Network Operations", "Director of Customer Care", "Regional Manager"]),
      technical("Assess network and platform engineers on realistic, applied tasks.", ["Network Engineer", "RF Engineer", "Platform Engineer"]),
      nonIt("Screen sales, care, and field roles at high volume and speed.", ["Customer Care Representative", "Field Technician", "Sales Executive", "Account Manager"]),
    ],
    focus: ["Network & platform engineering", "Reliability at scale", "High-volume support aptitude", "Customer judgment"],
    scenario: {
      role: "Network Reliability Engineer, national carrier",
      challenge: "On-call incidents demanded engineers who reason clearly under pressure, but interviews rewarded rehearsed answers over live troubleshooting.",
      approach: "Prelim's technical track simulated a degraded-network incident and scored root-cause reasoning and communication during resolution.",
      metric: { value: "22%", label: "faster mean-time-to-resolution among new hires" },
    },
    overview: {
      title: "Network reliability at carrier scale needs engineers who reason well live.",
      body: "Telecom hiring spans network engineers keeping the infrastructure up to the high-volume care and sales teams serving millions of subscribers — two very different hiring problems under one roof. Prelim's live troubleshooting scenarios test how engineers actually diagnose degraded systems, while the same platform screens support and sales roles at the volume carriers hire, without stretching your team thin on either end.",
    },
    faq: [
      { q: "Can technical assessments simulate a real network incident?", a: "Yes. Candidates work through a live, degraded-system scenario and are scored on root-cause reasoning and communication during resolution, not just the final fix." },
      { q: "Does Prelim scale for high-volume care and retail hiring?", a: "Yes. Non-IT batteries handle high-volume support and sales screening with low-latency scoring built for that scale." },
      { q: "Can we assess network engineers on our specific stack?", a: "Custom environments and repositories let candidates work against something close to your actual infrastructure." },
    ],
  },
  {
    slug: "media-entertainment",
    name: "Media & Entertainment",
    Icon: Sparkles,
    blurb: "Creative judgment, product craft, and audience-scale engineering.",
    intro: "Media hires balance creative craft with technical scale. Prelim assesses product judgment, engineering ability, and the operational roles that keep content flowing to audiences.",
    tracks: [
      leadership("Assess leaders on creative judgment, product vision, and scale.", ["VP of Content", "Head of Product", "Executive Producer"]),
      technical("Evaluate streaming, data, and platform engineers on real problems.", ["Streaming Platform Engineer", "Data Engineer", "Broadcast Systems Engineer"]),
      nonIt("Measure production, marketing, and operations aptitude.", ["Producer", "Content Marketing Manager", "Talent Coordinator", "Distribution Manager"]),
    ],
    focus: ["Product & creative judgment", "Streaming and platform engineering", "Audience-scale operations", "Marketing aptitude"],
    scenario: {
      role: "Senior Product Manager, streaming platform",
      challenge: "Portfolio reviews showcased past work but said little about how a candidate would prioritize trade-offs on the team's actual roadmap.",
      approach: "A situational-judgment exercise placed candidates inside a realistic prioritization scenario and scored the reasoning behind their trade-offs.",
      metric: { value: "70%", label: "of finalists rated 'strong hire' by every panelist" },
    },
    overview: {
      title: "Creative judgment is real signal. It's just hard to standardize.",
      body: "Media hiring has long relied on portfolio reviews that show what a candidate has already made, but say little about how they'd make the next decision on your actual roadmap. Prelim's situational-judgment exercises put candidates inside a realistic prioritization scenario for your product or platform, scoring the reasoning behind the trade-off rather than just the polish of the portfolio.",
    },
    faq: [
      { q: "Can this assess both creative and engineering roles?", a: "Yes. Leadership tracks cover creative and product judgment; Technical Hiring covers streaming, data, and platform engineering." },
      { q: "How do you evaluate something as subjective as creative judgment?", a: "Scenarios are scored against a structured rubric focused on reasoning and trade-offs, not personal taste, so panelists stay aligned." },
      { q: "Can Prelim handle hiring for live or audience-scale events?", a: "Non-IT batteries cover the production and operations roles that keep audience-scale events and releases running smoothly." },
    ],
  },
  {
    slug: "education",
    name: "Education",
    Icon: Users,
    blurb: "Instructional skill, communication, and academic-operations judgment.",
    intro: "Education hiring rewards communication and judgment as much as knowledge. Prelim assesses instructional skill, subject knowledge, and the operations roles that keep institutions running.",
    tracks: [
      leadership("Vet academic and administrative leaders on judgment and governance.", ["Principal", "Academic Dean", "Director of Curriculum"]),
      technical("Assess ed-tech engineers on secure, accessible, real-world builds.", ["Ed-Tech Engineer", "LMS Administrator", "Data Analyst"]),
      nonIt("Measure instructional skill, communication, and subject knowledge.", ["Teacher", "Instructional Coordinator", "Admissions Counselor", "Student Services Advisor"]),
    ],
    focus: ["Instructional & communication skill", "Subject-matter knowledge", "Accessibility & fairness", "Academic operations"],
    scenario: {
      role: "Department Chair, secondary school network",
      challenge: "Demo lessons were inconsistent across interview panels, and there was no shared standard for what 'strong instructional judgment' meant.",
      approach: "A structured instructional-scenario assessment scored communication and subject knowledge against one accessible, rubric-based standard.",
      metric: { value: "100%", label: "of candidates screened with accommodations honored" },
    },
    overview: {
      title: "A great demo lesson and a great teacher aren't always the same thing.",
      body: "Education hiring depends on instructional skill and communication as much as subject-matter knowledge, but demo lessons vary wildly by panel and rarely get scored against a shared standard. Prelim brings one accessible, rubric-based assessment to instructional and administrative hiring alike, so a strong score means the same thing whether it came from one interviewer or five.",
    },
    faq: [
      { q: "Can assessments be built for specific subjects or grade levels?", a: "Yes. Subject-matter and instructional scenarios can be tailored to the grade level and subject the role actually requires." },
      { q: "Does Prelim support hiring for administrative and operations roles too?", a: "Yes. Non-IT batteries cover academic operations, administration, and support roles alongside instructional hiring." },
      { q: "How does Prelim ensure fairness across a diverse candidate pool?", a: "Every assessment is accessible by default — screen-reader support and extended time — and scored against one published rubric for every candidate." },
    ],
  },
  {
    slug: "government-public-sector",
    name: "Government & Public Sector",
    Icon: Building,
    blurb: "Policy judgment, compliance, and fair, defensible assessment at scale.",
    intro: "Public-sector hiring must be fair, defensible, and compliant. Prelim brings audit-ready, accessible assessment to government roles — with deployment options that meet strict data requirements.",
    tracks: [
      leadership("Assess public leaders on policy judgment and governance.", ["Agency Director", "Deputy Commissioner", "Program Manager"]),
      technical("Vet civic-tech engineers on secure, accessible, compliant builds.", ["Civic-Tech Engineer", "GIS Analyst", "IT Systems Administrator"]),
      nonIt("Measure policy analysis, administration, and service aptitude.", ["Policy Analyst", "Program Coordinator", "Case Worker", "Compliance Officer"]),
    ],
    focus: ["Fair, defensible scoring", "Policy & analytical reasoning", "Accessibility compliance", "On-prem / VPC deployment"],
    scenario: {
      role: "Policy Analyst, state agency",
      challenge: "Civil-service hiring must withstand appeal, but panel-based interviews left decisions difficult to defend on paper.",
      approach: "Prelim scored policy-analysis reasoning against a published rubric and deployed on-prem to satisfy the agency's data-residency requirement.",
      metric: { value: "0", label: "successful appeals on assessment grounds to date" },
    },
    overview: {
      title: "Public-sector hiring has to be fair and provably so.",
      body: "Government hiring operates under a higher bar for defensibility than most private-sector hiring ever faces — decisions can be appealed, and the process itself gets scrutinized. Prelim's structured, evidence-linked scoring gives agencies a process that holds up: every candidate assessed against the same published rubric, with deployment options that satisfy strict data-residency and accessibility requirements.",
    },
    faq: [
      { q: "Can Prelim meet strict data-residency requirements?", a: "Yes. On-prem and dedicated VPC deployment keep candidate data inside the boundary your agency requires." },
      { q: "Are assessments accessible under Section 508 and similar standards?", a: "Yes. Accessibility — screen-reader support, extended time, and accommodations — is built in by default, not a special request." },
      { q: "How does Prelim support hiring processes that can be legally challenged?", a: "Every score is evidence-linked and exportable, giving you a documented, defensible record for any appeal or audit." },
    ],
  },
  {
    slug: "real-estate-construction",
    name: "Real Estate & Construction",
    Icon: Factory,
    blurb: "Project judgment, safety, and operations aptitude across the build cycle.",
    intro: "From project managers to field crews, construction and real estate hire for judgment and reliability. Prelim measures operations aptitude, safety judgment, and technical skill across the build cycle.",
    tracks: [
      leadership("Hire project and portfolio leaders on judgment and delivery.", ["VP of Construction", "Project Executive", "Development Director"]),
      technical("Assess proptech and systems engineers on applied problems.", ["BIM Engineer", "PropTech Developer", "Estimating Systems Analyst"]),
      nonIt("Measure project management, safety, and operations aptitude.", ["Project Manager", "Site Superintendent", "Estimator", "Property Manager", "Leasing Agent"]),
    ],
    focus: ["Project & operations judgment", "Safety awareness", "Estimating & analytical skills", "Field reliability"],
    scenario: {
      role: "Project Manager, commercial general contractor",
      challenge: "Cost overruns often traced back to project managers who interviewed well but struggled with real-time trade-off judgment on-site.",
      approach: "A project-judgment scenario scored how candidates re-sequenced work and managed risk when a simulated schedule slipped mid-project.",
      metric: { value: "14%", label: "fewer schedule overruns on projects led by assessed hires" },
    },
    overview: {
      title: "A project manager's real test is what happens when the schedule slips.",
      body: "Construction and real estate hiring spans project managers whose decisions carry direct cost consequences to field crews whose judgment affects safety on-site. Prelim's project-judgment scenarios put candidates through a realistic schedule crisis and score how they re-prioritize and manage risk, which turns out to predict delivery performance far better than years of experience alone.",
    },
    faq: [
      { q: "Can this assess both office-based project managers and field crews?", a: "Yes. Leadership and Non-IT tracks cover project and portfolio management; safety and operations aptitude batteries cover field roles." },
      { q: "Does Prelim support proptech and systems engineering hiring?", a: "Yes. Technical Hiring covers proptech and systems engineers with realistic, applied technical tasks." },
      { q: "Can assessments reflect our specific project types?", a: "Yes. Scenarios can be tailored to commercial, residential, or infrastructure project contexts to match how your teams actually work." },
    ],
  },
  {
    slug: "transportation-logistics",
    name: "Transportation & Logistics",
    Icon: Cart,
    blurb: "Operations reasoning, safety, and high-volume workforce screening.",
    intro: "Logistics hires at volume where reliability is everything. Prelim's low-latency scoring screens operations, safety, and technical roles fast — without sacrificing quality.",
    tracks: [
      leadership("Vet operations leaders on network judgment and reliability.", ["VP of Logistics", "Fleet Operations Director", "Supply Chain VP"]),
      technical("Assess routing, data, and platform engineers on real problems.", ["Routing Systems Engineer", "Data Engineer", "Telematics Engineer"]),
      nonIt("Screen high-volume operations and driver roles at speed.", ["Dispatcher", "Driver", "Warehouse Supervisor", "Logistics Coordinator"]),
    ],
    focus: ["Operations & routing reasoning", "Safety judgment", "High-volume screening", "Supply-chain aptitude"],
    scenario: {
      role: "Dispatch Operations Lead, regional carrier",
      challenge: "Peak-volume hiring needed hundreds of operations screens weekly, but manual review couldn't keep pace without sacrificing quality.",
      approach: "Low-latency operations-reasoning and safety-judgment scoring let dispatch managers rank candidates the same day they applied.",
      metric: { value: "4x", label: "throughput increase in candidate screening" },
    },
    overview: {
      title: "Logistics runs on reliability at a volume most functions never see.",
      body: "Transportation and logistics hire constantly — driver, dispatch, and operations roles turn over fast, and a slow screening process directly costs you capacity. Prelim's low-latency operations-reasoning and safety-judgment scoring keeps pace with that volume, so screening speed stops being the bottleneck between an open req and a filled route.",
    },
    faq: [
      { q: "Can Prelim handle continuous, high-volume driver and operations hiring?", a: "Yes. Low-latency scoring and auto-ranking are built for exactly this throughput, screening thousands of candidates without a backlog." },
      { q: "Does this support routing and logistics technology roles?", a: "Yes. Technical Hiring covers routing, data, and platform engineers with realistic, applied problems." },
      { q: "Can safety-judgment scenarios reflect our specific operations?", a: "Yes. Scenarios can be tailored to your fleet type and operational context rather than generic logistics situations." },
    ],
  },
  {
    slug: "hospitality-travel",
    name: "Hospitality & Travel",
    Icon: Globe,
    blurb: "Service judgment, communication, and high-volume seasonal screening.",
    intro: "Hospitality lives and dies on service. Prelim screens for communication and judgment at the volume and seasonality this industry hires — so you fill seats fast with the right people.",
    tracks: [
      leadership("Hire property and operations leaders on service and P&L judgment.", ["General Manager", "VP of Guest Experience", "Regional Director of Operations"]),
      technical("Assess booking and platform engineers who keep systems reliable.", ["Booking Platform Engineer", "Reservations Systems Engineer", "Data Engineer"]),
      nonIt("Measure service, communication, and operations aptitude at scale.", ["Front Desk Agent", "Concierge", "Event Coordinator", "Guest Services Manager"]),
    ],
    focus: ["Service & communication judgment", "High-volume, seasonal screening", "Operations aptitude", "Fair candidate experience"],
    scenario: {
      role: "Front Desk Supervisor, resort property group",
      challenge: "Seasonal ramp-up meant hiring hundreds of service roles in weeks, with guest-satisfaction scores riding on judgment interviews couldn't reliably surface.",
      approach: "A service-judgment scenario battery scored realistic guest-recovery situations, screened at the volume and speed the season required.",
      metric: { value: "19%", label: "improvement in guest-satisfaction scores" },
    },
    overview: {
      title: "Service quality is a hiring problem before it's a training problem.",
      body: "Hospitality and travel hire at volume and seasonally, and the instinct is often to train the service mindset in after the fact. Prelim's service-judgment scenarios measure that instinct before the offer goes out — how a candidate actually handles a guest-recovery situation — so seasonal ramp-ups don't come at the cost of the experience your brand promises.",
    },
    faq: [
      { q: "Can Prelim handle seasonal, high-volume hiring surges?", a: "Yes. Low-latency scoring supports large seasonal applicant pools without slowing down time-to-hire." },
      { q: "Does this cover both front-line and operations/technology roles?", a: "Yes. Non-IT batteries cover service and operations roles; Technical Hiring covers booking and platform engineers." },
      { q: "Can scenarios reflect our specific property type or brand standards?", a: "Yes. Service-judgment scenarios can be tailored to your brand's actual guest-recovery standards and property type." },
    ],
  },
  {
    slug: "pharma-life-sciences",
    name: "Pharma & Life Sciences",
    Icon: Heart,
    blurb: "Scientific reasoning, regulatory rigor, and quality judgment.",
    intro: "Life sciences hiring demands scientific rigor and regulatory discipline. Prelim assesses reasoning, domain knowledge, and quality judgment — with the compliance and audit trail the industry requires.",
    tracks: [
      leadership("Assess R&D and commercial leaders on scientific and regulatory judgment.", ["VP of R&D", "Director of Regulatory Affairs", "Head of Clinical Operations"]),
      technical("Evaluate bioinformatics and platform engineers on real, secure tasks.", ["Bioinformatics Engineer", "Lab Systems Engineer", "Data Scientist"]),
      nonIt("Measure scientific knowledge, quality, and regulatory reasoning.", ["Research Associate", "Regulatory Affairs Specialist", "Clinical Research Coordinator", "Quality Assurance Specialist"]),
    ],
    focus: ["Scientific reasoning", "Regulatory & quality rigor", "Domain knowledge", "Audit-ready reporting"],
    scenario: {
      role: "Associate Director, Regulatory Affairs",
      challenge: "Regulatory judgment is high-stakes and rarely tested directly — resumes showed prior filings but not how a candidate reasons through a novel submission.",
      approach: "A scientific-reasoning and regulatory-rigor assessment scored candidates against realistic, audit-style scenarios with full evidence trails.",
      metric: { value: "100%", label: "of scores traceable to specific evidence for audit" },
    },
    overview: {
      title: "Regulatory rigor doesn't have to slow down scientific hiring.",
      body: "Pharma and life sciences hiring demands both deep domain knowledge and the discipline to work within regulatory constraints — two things that are hard to fully verify from a CV and reference calls alone. Prelim's scientific-reasoning and regulatory-rigor scenarios test how candidates actually apply domain knowledge under realistic constraints, with an evidence trail built for audit from day one.",
    },
    faq: [
      { q: "Can assessments reflect our specific therapeutic area or function?", a: "Yes. Scientific-reasoning content can be tailored to R&D, regulatory affairs, clinical operations, or commercial roles." },
      { q: "How does Prelim support GxP and audit requirements?", a: "Every score links to specific evidence — the response, the rubric, and the benchmark — for a complete, audit-ready record." },
      { q: "Does this cover bioinformatics and computational roles?", a: "Yes. Technical Hiring covers bioinformatics and platform engineers with real, applied technical tasks." },
    ],
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    Icon: Scale,
    blurb: "Analytical rigor, client judgment, and communication under pressure.",
    intro: "Consulting and professional services sell judgment. Prelim measures analytical rigor, client communication, and problem-solving through realistic work samples — so you hire people clients trust.",
    tracks: [
      leadership("Vet partners and principals on client judgment and delivery.", ["Partner", "Managing Director", "Practice Lead"]),
      technical("Assess data and platform engineers on applied, real-world problems.", ["Data Engineer", "Analytics Platform Engineer"]),
      nonIt("Test analytical reasoning, client communication, and problem-solving.", ["Consultant", "Business Analyst", "Client Services Manager", "Research Analyst"]),
    ],
    focus: ["Analytical & case reasoning", "Client communication", "Problem-solving work samples", "Judgment under pressure"],
    scenario: {
      role: "Senior Consultant, management consulting firm",
      challenge: "Traditional case interviews measured performance under artificial pressure but varied wildly by interviewer, making offers hard to compare fairly.",
      approach: "Prelim standardized the case exercise and scored analytical reasoning and client communication against one rubric across every interviewer.",
      metric: { value: "41%", label: "reduction in offer-decision time" },
    },
    overview: {
      title: "Case interviews are only as good as their consistency.",
      body: "Professional services firms already know that case-based interviewing works — the problem is that quality varies wildly by interviewer, making it hard to compare candidates fairly across a pipeline. Prelim standardizes the case exercise itself and scores analytical reasoning and client communication against one rubric, so the firm's hiring bar doesn't depend on which partner happened to run the interview.",
    },
    faq: [
      { q: "Can case exercises be tailored to our practice area?", a: "Yes. Analytical cases can be built around your firm's actual practice areas rather than generic consulting scenarios." },
      { q: "Does this work for lateral and experienced hires, not just entry-level?", a: "Yes. The rubric and case complexity scale to seniority, from analyst through principal-level lateral hires." },
      { q: "How does Prelim assess client-facing communication specifically?", a: "Scenarios include client-communication components scored separately from analytical reasoning, so both signals are visible." },
    ],
  },
];

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
