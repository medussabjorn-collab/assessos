import type { ComponentType, SVGProps } from "react";
import type { SolutionData } from "@/components/SolutionDetail";
import { Code, Shield, Users, Sparkles, Terminal, ShieldCheck, Bars, Plug, Target, Scale, Lock, Server, Clock, Globe } from "@/components/icons";
import { BarChart } from "@/components/dashboard/BarChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
export type ProductData = SolutionData & { slug: string; name: string; Icon: Icon; blurb: string };

export const PRODUCTS: ProductData[] = [
  {
    slug: "technical-assessment",
    name: "Technical Assessment",
    Icon: Code,
    blurb: "Coding, system design, and DevOps tasks in a realistic environment.",
    crumb: "Products / Technical Assessment",
    title: "Technical assessment that reflects the job.",
    sub: "Measure how candidates actually build — reading code, designing systems, and shipping working solutions — instead of memorized algorithm trivia.",
    overview: {
      title: "Realistic tasks, reasoning-aware scoring.",
      body: "Candidates work against realistic problems while specialized assessors grade correctness, structure, and approach. The result is a skills matrix that maps to the competencies your team actually needs.",
      points: ["Real repositories and realistic problems", "System design and DevOps, not just algorithms", "Reasoning-aware grading, not keyword matching", "A ranked, explainable skills matrix"],
    },
    stat: { value: "87%", label: "faster time-to-shortlist", note: "Interview only engineers who already cleared a real technical bar." },
    capsTitle: "What it measures.",
    caps: [
      { Icon: Code, title: "Coding ability", desc: "Correctness, structure, and readability on realistic tasks." },
      { Icon: Sparkles, title: "System design", desc: "Architecture and trade-off reasoning, scored consistently." },
      { Icon: Server, title: "DevOps & tooling", desc: "Practical skills with CI, containers, and infrastructure." },
    ],
    showTechStack: true,
    roles: ["Software Engineer", "Backend Engineer", "Frontend Engineer", "Full-Stack Engineer", "DevOps Engineer", "QA Engineer"],
    faq: [
      { q: "Do you support our stack?", a: "Prelim ships environments for the major languages and frameworks and supports custom repos close to your real codebase." },
      { q: "How is it graded?", a: "Specialized assessors score reasoning and correctness, producing an explainable skills matrix rather than a single opaque number." },
      { q: "Can candidates use AI copilots?", a: "You choose per assessment — allow, restrict, or observe — and Prelim scores the quality of judgment either way." },
    ],
    cta: { title: "See technical assessment on a real role.", sub: "Bring one open engineering role and we'll assemble the assessment live." },
  },
  {
    slug: "leadership-assessment",
    name: "Leadership Assessment",
    Icon: Shield,
    blurb: "360°, situational judgment, and executive psychometrics.",
    crumb: "Products / Leadership Assessment",
    title: "Leadership assessment executives respect.",
    sub: "Measure decision quality, people signals, and values alignment through work-sample and situational-judgment exercises — benchmarked against comparable leaders.",
    overview: {
      title: "Structure, not a personality quiz.",
      body: "Psychometrics are one input, combined with situational judgment and 360° signals. The composite is behavior-based and validated against on-the-job outcomes, with board-ready reporting.",
      points: ["360° input from peers, reports, and interviewers", "Situational-judgment scenarios mapped to your competencies", "Executive psychometrics validated against outcomes", "Board-ready reports that explain the score"],
    },
    stat: { value: "63%", label: "faster leadership shortlists", note: "Cut executive shortlist cycles without lowering the bar." },
    capsTitle: "What it measures.",
    caps: [
      { Icon: Target, title: "Strategic judgment", desc: "How candidates frame ambiguous, high-stakes decisions." },
      { Icon: Users, title: "People leadership", desc: "Coaching, delegation, and conflict signals from real scenarios." },
      { Icon: Scale, title: "Values & integrity", desc: "Alignment with the behaviors your culture rewards." },
    ],
    roles: ["CEO", "COO", "VP of Engineering", "VP of Sales", "Director of Operations", "General Manager", "Head of Product"],
    faq: [
      { q: "Can we use our competency model?", a: "Yes. Every exercise and score maps to your existing leadership framework." },
      { q: "Is it just a personality test?", a: "No. It combines psychometrics with work-sample and situational-judgment evidence, validated against outcomes." },
      { q: "How do we keep it confidential?", a: "Run it in cloud, VPC, or on-prem; candidate data is never used to train models." },
    ],
    cta: { title: "Put your next leadership hire on evidence.", sub: "Bring one open leadership role and we'll design the assessment live." },
  },
  {
    slug: "non-it-functional",
    name: "Non-IT / Functional",
    Icon: Users,
    blurb: "Role-specific batteries for finance, sales, ops, healthcare, and legal.",
    crumb: "Products / Non-IT / Functional",
    title: "One rigor bar for every function.",
    sub: "Role-specific batteries — finance, sales, operations, healthcare, legal — scored on the same structured model you use everywhere else.",
    overview: {
      title: "Validated per function, comparable across your org.",
      body: "Prelim combines cognitive, behavioral, and role-knowledge assessments tuned per function, then reports into one model — so a strong score means the same thing whether it's a controller or a nurse.",
      points: ["Pre-built batteries for major functions", "Cognitive and aptitude measures that predict performance", "Behavioral and culture-fit signals mapped to your values", "Consistent, defensible scoring across departments"],
    },
    stat: { value: "60+", label: "assessment types", note: "From Excel modeling to clinical knowledge — ready to deploy." },
    capsTitle: "What it measures.",
    caps: [
      { Icon: Bars, title: "Role knowledge", desc: "Function-specific skills validated for the domain." },
      { Icon: Sparkles, title: "Cognitive ability", desc: "Reasoning and aptitude that predict performance." },
      { Icon: Users, title: "Behavior & fit", desc: "Culture and teamwork signals mapped to your values." },
    ],
    roles: ["Financial Analyst", "Sales Representative", "Marketing Manager", "Operations Analyst", "HR Business Partner", "Customer Success Manager"],
    faq: [
      { q: "How is it fair across roles?", a: "Each battery is validated for its function, but all report into one structured model, so verdicts are comparable." },
      { q: "Can we localize?", a: "Yes — multiple languages and region-specific content, with accessibility built in." },
      { q: "Does it handle volume?", a: "Low-latency scoring and auto-ranking make it practical for thousands of candidates." },
    ],
    cta: { title: "Raise the bar for every hire, not just engineers.", sub: "Bring one non-technical role and we'll build the battery live." },
  },
  {
    slug: "ai-evaluation",
    name: "AI Evaluation",
    Icon: Sparkles,
    blurb: "AI interviewer and reasoning-aware grading of open responses.",
    crumb: "Products / AI Evaluation",
    title: "Grade the answers a rubric can't.",
    sub: "Prelim's assessors read long-form responses, code, and case work the way a senior reviewer would — scoring reasoning, not keywords.",
    overview: {
      title: "Reasoning-aware, inconsistency-catching.",
      body: "AI Evaluation scores open-ended work against your rubric and catches inconsistency across a candidate's whole session — surfacing anomalies for a human to confirm rather than auto-rejecting.",
      points: ["Long-form response and case-work grading", "Inconsistency detection across the session", "Human-in-the-loop review of flags", "Evidence-linked scores you can defend"],
    },
    stat: { value: "88.9%", label: "scoring accuracy vs. benchmark", note: "Measured against expert human panels across 60+ types." },
    capsTitle: "What it does.",
    caps: [
      { Icon: Sparkles, title: "AI interviewer", desc: "Adaptive, conversational assessment at scale." },
      { Icon: ShieldCheck, title: "Inconsistency flags", desc: "Anomalies surfaced for human review, not auto-reject." },
      { Icon: Bars, title: "Explainable scores", desc: "Every score traces to specific evidence." },
    ],
    faq: [
      { q: "Is grading a black box?", a: "No. Every score links to the response, the rubric, and the benchmark, so it's reviewable and defensible." },
      { q: "Does a human stay in the loop?", a: "Yes. Integrity and inconsistency signals are surfaced for a human to confirm." },
      { q: "What file types can it read?", a: "50+ types, including embedded images, tables, and handwritten notes." },
    ],
    cta: { title: "See AI evaluation on your hardest questions.", sub: "Bring a real open-ended exercise and we'll score it live." },
  },
  {
    slug: "live-coding-ide",
    name: "Live Coding IDE",
    Icon: Terminal,
    blurb: "Real repos, real tests, real time — in the browser.",
    crumb: "Products / Live Coding IDE",
    title: "A real IDE, right in the browser.",
    sub: "Candidates work in a full editor against real repositories, with test runners and tooling — so you see how they actually build.",
    overview: {
      title: "As close to the real job as an assessment gets.",
      body: "The Live Coding IDE gives candidates a familiar environment with real repos and test suites. Sessions are recorded and scored so you evaluate process, not just the final answer.",
      points: ["Full browser IDE with test runners", "Real repositories and realistic tasks", "Session replay for process insight", "Anti-cheat tuned for the AI era"],
    },
    stat: { value: "207ms", label: "median latency", note: "Fast enough that candidates forget they're in a test." },
    capsTitle: "What's inside.",
    caps: [
      { Icon: Terminal, title: "Full editor", desc: "Syntax, test runners, and real tooling in the browser." },
      { Icon: Code, title: "Real repositories", desc: "Work in something close to your actual codebase." },
      { Icon: ShieldCheck, title: "Integrity signals", desc: "Proctoring and anomaly detection built in." },
    ],
    showTechStack: true,
    roles: ["Backend Engineer", "Frontend Engineer", "Full-Stack Engineer", "Mobile Engineer", "ML Engineer", "Platform Engineer"],
    faq: [
      { q: "Which languages are supported?", a: "The major languages and frameworks, plus custom environments on request." },
      { q: "Can we bring our own repo?", a: "Yes — assess candidates against a realistic slice of your real codebase." },
      { q: "Is the session recorded?", a: "Yes, with replay so reviewers can evaluate process, not just output." },
    ],
    cta: { title: "Try the Live Coding IDE on a real task.", sub: "We'll set up an environment close to your codebase for the demo." },
  },
  {
    slug: "anti-cheating",
    name: "Anti-Cheating",
    Icon: ShieldCheck,
    blurb: "Proctoring and integrity signals tuned for the AI era.",
    crumb: "Products / Anti-Cheating",
    title: "Integrity you can trust, without false positives.",
    sub: "Proctoring and integrity signals that survive the age of AI copilots — flagging anomalies for review instead of punishing legitimate candidates.",
    overview: {
      title: "Probabilistic, reviewable, fair.",
      body: "Prelim's integrity layer combines proctoring signals with behavioral analysis and flags anomalies for a human to confirm. The goal is confidence in your results without rejecting good people by mistake.",
      points: ["Proctoring and behavioral signals", "AI-copilot-aware detection", "Human-reviewed flags, not auto-rejection", "Fair to legitimate candidates and tooling"],
    },
    stat: { value: "0", label: "auto-rejections", note: "Integrity flags go to a human — legitimate candidates stay protected." },
    capsTitle: "How it works.",
    caps: [
      { Icon: Lock, title: "Proctoring", desc: "Configurable monitoring tuned to the assessment's stakes." },
      { Icon: Sparkles, title: "Behavioral analysis", desc: "Anomaly detection across the whole session." },
      { Icon: ShieldCheck, title: "Reviewable flags", desc: "Every signal is surfaced for human confirmation." },
    ],
    faq: [
      { q: "Will it reject good candidates?", a: "No. Flags are probabilistic and reviewed by a human before any decision." },
      { q: "Does it work with AI copilots?", a: "Yes. You set the policy, and Prelim scores judgment while flagging genuine anomalies." },
      { q: "Is it privacy-respecting?", a: "Proctoring is configurable and disclosed, and candidate data never trains models." },
    ],
    cta: { title: "See anti-cheating that stays fair.", sub: "We'll show you the integrity signals and the human review flow." },
  },
  {
    slug: "analytics-reporting",
    name: "Analytics & Reporting",
    Icon: Bars,
    blurb: "Pipeline insight, benchmarks, and audit-ready reports.",
    crumb: "Products / Analytics & Reporting",
    title: "See your whole hiring funnel, clearly.",
    sub: "Pipeline analytics, benchmarks, and audit-ready candidate reports — so you can defend decisions and improve your process over time.",
    overview: {
      title: "From candidate scorecard to funnel insight.",
      body: "Every assessment feeds a reporting layer: individual scorecards, cohort benchmarks, and pipeline analytics. Export audit-ready reports and spot where your process leaks the best candidates.",
      points: ["Ranked skills matrices per candidate", "Cohort and role benchmarks", "Funnel and time-to-shortlist analytics", "Exportable, audit-ready reports"],
    },
    stat: { value: "1.2M+", label: "assessments benchmarked", note: "Compare candidates against a deep, relevant baseline." },
    capsTitle: "What you get.",
    caps: [
      { Icon: Bars, title: "Pipeline analytics", desc: "Where candidates advance, stall, or drop." },
      { Icon: Target, title: "Benchmarks", desc: "Percentiles against comparable roles and cohorts." },
      { Icon: Globe, title: "Exports & API", desc: "Audit-ready reports and structured data out." },
    ],
    extra: {
      title: "See it the way your recruiting team does.",
      sub: "Assessment volume by month, and where candidates actually drop out of the pipeline.",
      node: (
        <div className="analytics-grid">
          <div className="dash-chrome">
            <div className="dash-bar">
              <div className="dots"><i /><i /><i /></div>
              <span className="path">prelim / reports / volume</span>
            </div>
            <div className="dash-body">
              <BarChart
                data={[
                  { label: "Mar", value: 82 },
                  { label: "Apr", value: 94 },
                  { label: "May", value: 88 },
                  { label: "Jun", value: 121 },
                  { label: "Jul", value: 134 },
                  { label: "Aug", value: 149 },
                ]}
                unit="K"
              />
            </div>
          </div>
          <div className="dash-chrome">
            <div className="dash-bar">
              <div className="dots"><i /><i /><i /></div>
              <span className="path">prelim / reports / funnel</span>
            </div>
            <div className="dash-body">
              <FunnelChart
                stages={[
                  { label: "Applied", value: 4200, display: "4,200" },
                  { label: "Assessed", value: 2850, display: "2,850" },
                  { label: "Scored", value: 2850, display: "2,850" },
                  { label: "Shortlisted", value: 640, display: "640" },
                  { label: "Hired", value: 118, display: "118" },
                ]}
              />
            </div>
          </div>
        </div>
      ),
    },
    faq: [
      { q: "Can we export the data?", a: "Yes — audit-ready reports and structured JSON via the API." },
      { q: "What benchmarks are available?", a: "Percentiles by role, cohort, and assessment type from a large baseline." },
      { q: "Does it help reduce bias?", a: "Structured, evidence-linked scoring plus analytics helps you spot and address disparities." },
    ],
    cta: { title: "See analytics on your pipeline.", sub: "We'll walk through scorecards, benchmarks, and funnel reports." },
  },
  {
    slug: "api-integrations",
    name: "API & Integrations",
    Icon: Plug,
    blurb: "Structured JSON reports into any ATS or workflow.",
    crumb: "Products / API & Integrations",
    title: "Prelim, inside the tools you already use.",
    sub: "Two-way sync with your ATS and HRIS, plus a production-ready REST API that returns structured candidate reports as JSON.",
    overview: {
      title: "Built to plug in, not replace.",
      body: "Scores, verdicts, and reports sync back into Greenhouse, Lever, Workday, and SAP so recruiters never leave their workflow. Need something custom? The REST API returns structured JSON for any system.",
      points: ["Two-way ATS/HRIS sync", "Production-ready REST API", "Structured JSON candidate reports", "Webhooks for real-time events"],
    },
    stat: { value: "REST", label: "API + webhooks", note: "Integrate with any ATS or hiring workflow." },
    capsTitle: "How it connects.",
    caps: [
      { Icon: Plug, title: "ATS integrations", desc: "Greenhouse, Lever, Workday, SAP SuccessFactors." },
      { Icon: Code, title: "REST API", desc: "Structured JSON reports for any system." },
      { Icon: Clock, title: "Webhooks", desc: "Real-time events as candidates progress." },
    ],
    faq: [
      { q: "Which ATSs do you support?", a: "Greenhouse, Lever, Workday, and SAP SuccessFactors out of the box, with more via the API." },
      { q: "Is the API documented?", a: "Yes — a production-ready REST API with structured JSON reports and webhooks." },
      { q: "Can we build a custom flow?", a: "Absolutely. The API returns structured data you can drop into any workflow." },
    ],
    cta: { title: "Connect Prelim to your stack.", sub: "Tell us your ATS and we'll show you the integration and the API." },
    extra: {
      title: "One request, a full candidate report.",
      sub: "Every completed assessment fires a webhook and is available as structured JSON — drop it straight into your ATS, data warehouse, or a custom dashboard.",
      node: (
        <div className="dash-chrome">
          <div className="dash-bar">
            <div className="dots"><i /><i /><i /></div>
            <span className="path">GET /v1/candidates/cnd_8f21b3/report</span>
          </div>
          <div className="dash-body">
            <pre className="code-json">{`{
  "candidate_id": "cnd_8f21b3",
  "requisition": "REQ-4471",
  "track": "technical",
  "composite_score": 88.9,
  "percentile": 96,
  "verdict": "strong_hire",
  "sections": [
    { "name": "system_design", "score": 91 },
    { "name": "coding", "score": 88 },
    { "name": "communication", "score": 82 }
  ],
  "proctor_flags": [],
  "webhook_event": "assessment.completed"
}`}</pre>
          </div>
        </div>
      ),
    },
  },
];

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
