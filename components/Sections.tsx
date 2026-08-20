import Link from "next/link";
import {
  Arrow, ArrowUpRight, Code, Shield, Users, Sparkles, Terminal, ShieldCheck,
  Bars, Plug, Lock, Server, Clock,
} from "./icons";
import { INDUSTRIES } from "@/lib/industries";
import { ClientMark, IntegrationMark } from "./BrandMark";

const CLIENTS = ["Northwind", "Carlyle", "Meridian", "VantPay", "Astraflow", "Helix", "3Capital"];

export function Clients() {
  return (
    <div className="clients">
      <div className="wrap">
        <p>The assessment layer behind hiring teams at regulated enterprises</p>
        <div className="logos">
          {CLIENTS.map((c, i) => <ClientMark name={c} index={i} key={c} />)}
        </div>
      </div>
    </div>
  );
}

const SOLUTIONS = [
  {
    cat: "Leadership",
    h: "Assess the people who set direction.",
    d: "Structure executives respect — 360° input, situational judgment, and psychometrics that predict how someone leads under pressure.",
    caps: ["360° review", "Situational judgment", "Executive psychometrics"],
    href: "/solutions/leadership-hiring",
  },
  {
    cat: "Technical",
    h: "Prove real engineering ability.",
    d: "Not trivia — a live, proctored environment with real repos, system-design tasks, and AI-assisted anti-cheat your engineers trust.",
    caps: ["Live coding IDE", "System design", "Anti-cheat"],
    href: "/solutions/technical-hiring",
  },
  {
    cat: "Non-IT",
    h: "One standard for every function.",
    d: "Finance, sales, operations, healthcare, legal — role-specific batteries with the same cognitive, behavioral, and culture signals.",
    caps: ["Role batteries", "Cognitive & aptitude", "Culture fit"],
    href: "/solutions/non-it-hiring",
  },
];

export function Solutions() {
  return (
    <section className="blk" id="solutions">
      <div className="wrap">
        <div className="sec-head rv">
          <h2>The same rigor bar for every hire that matters.</h2>
          <p>Most tools own one lane. Prelim runs one defensible scoring model across the three hardest hiring problems in the enterprise.</p>
        </div>
        <div className="sol stagger">
          {SOLUTIONS.map((s) => (
            <div className="solrow" key={s.cat}>
              <div className="lead-col">
                <span className="cat">{s.cat}</span>
                <h3>{s.h}</h3>
              </div>
              <p className="desc">{s.d}</p>
              <div className="caps">
                {s.caps.map((c) => <span className="chip" key={c}>{c}</span>)}
              </div>
              <Link className="go" href={s.href} aria-label={`${s.cat} hiring`}><ArrowUpRight /></Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { st: "STEP 01", h: "Build", p: "Describe the role. Get a job-specific assessment across skill, cognition, and culture." },
  { st: "STEP 02", h: "Assess", p: "Candidates take a fair, adaptive test — proctored, accessible, low-latency." },
  { st: "STEP 03", h: "Score", p: "Specialized assessors grade every response and flag inconsistency automatically." },
  { st: "STEP 04", h: "Decide", p: "A ranked skills matrix and verdict your team can explain and stand behind." },
];

export function Platform() {
  return (
    <section className="blk" id="platform" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head rv">
          <h2>From open req to decision you can defend.</h2>
          <p>A closed loop: Prelim builds the assessment, runs it, scores it, and returns a ranked, explainable shortlist.</p>
        </div>
        <div className="flow stagger">
          {STEPS.map((s) => (
            <div className="node" key={s.st}>
              <div className="bar" />
              <div className="st">{s.st}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PRODUCTS = [
  { Icon: Code, t: "Technical Assessment", d: "Coding, system design, DevOps tasks" },
  { Icon: Shield, t: "Leadership Assessment", d: "360°, SJT & executive psychometrics" },
  { Icon: Users, t: "Non-IT / Functional", d: "Finance, sales, ops, healthcare, legal" },
  { Icon: Sparkles, t: "AI Evaluation", d: "AI interviewer & response grading" },
  { Icon: Terminal, t: "Live Coding IDE", d: "Real repos, real tests, real time" },
  { Icon: ShieldCheck, t: "Anti-Cheating", d: "Proctoring & integrity signals" },
  { Icon: Bars, t: "Analytics & Reporting", d: "Pipeline insight & benchmarks" },
  { Icon: Plug, t: "API & Integrations", d: "Greenhouse, Lever, Workday, SAP" },
];

export function Products() {
  return (
    <section className="blk" id="products" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head rv">
          <h2>Every signal that matters, in one system.</h2>
          <p>Turn on what a role needs. Every module feeds the same scoring model and reporting layer.</p>
        </div>
        <div className="prodsplit">
          <div className="prodlist stagger">
            {PRODUCTS.map(({ Icon, t, d }) => (
              <div className="prow" key={t}>
                <span className="pic"><Icon /></span>
                <div>
                  <div className="pt">{t}</div>
                  <div className="pd">{d}</div>
                </div>
                <span className="parr">→</span>
              </div>
            ))}
          </div>
          <div className="prodpanel rv" style={{ transitionDelay: ".1s" }}>
            <span className="pk">FEATURED · AI EVALUATION</span>
            <h3>Grade the answers a rubric can&apos;t.</h3>
            <p>Prelim&apos;s assessors read long-form responses, code, and case work the way a senior reviewer would — scoring reasoning, not keywords, and catching inconsistency across a candidate&apos;s whole session.</p>
            <div className="statline">
              <div><div className="sv tnum">50+</div><div className="sl">File types parsed</div></div>
              <div><div className="sv tnum">210<span style={{ fontSize: ".9rem" }}>ms</span></div><div className="sl">Median latency</div></div>
              <div><div className="sv tnum">84.9<span style={{ fontSize: ".9rem" }}>%</span></div><div className="sl">Scoring accuracy</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Security() {
  return (
    <section className="blk" id="security" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="trust-blk rv">
          <div>
            <h2>Built for the enterprise security floor.</h2>
            <p>Regulated-industry deployments, candidate privacy by default, and the flexibility to run wherever your security team requires.</p>
            <Link className="btn btn-ghost" href="/security">Visit the Trust Center <Arrow /></Link>
          </div>
          <div className="tgrid2">
            <div className="tcell"><span className="ti"><ShieldCheck /></span><b>SOC 2 Type II</b><span>Independently audited every year.</span></div>
            <div className="tcell"><span className="ti"><Lock /></span><b>GDPR + DPA</b><span>Candidate data never trains models.</span></div>
            <div className="tcell"><span className="ti"><Server /></span><b>Cloud · VPC · On-prem</b><span>Deploy inside your own perimeter.</span></div>
            <div className="tcell"><span className="ti"><Clock /></span><b>210ms median</b><span>Built for high-volume pipelines.</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IndustriesHome() {
  return (
    <section className="blk" id="industries" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head rv">
          <h2>Or start with your industry.</h2>
          <p>Every industry hires differently. Pick your segment and Prelim routes you to leadership, technical, and non-IT hiring — tailored and validated for your world.</p>
        </div>
        <div className="ind-tiles rv">
          {INDUSTRIES.map((ind) => (
            <Link className="ind-tile" href={`/industries/${ind.slug}`} key={ind.slug}>
              <span className="it-ic"><ind.Icon /></span>
              <span className="it-name">{ind.name}</span>
            </Link>
          ))}
        </div>
        <div className="ind-all rv">
          <Link className="btn btn-ghost" href="/industries">Browse all industries <Arrow /></Link>
        </div>
      </div>
    </section>
  );
}

export function Testimonial() {
  return (
    <section className="blk" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <figure className="quote rv">
          <div>
            <blockquote>
              &ldquo;We stopped arguing about gut calls. Prelim gives every panel the
              same scorecard — and our leadership shortlists got sharper and
              faster in one quarter.&rdquo;
            </blockquote>
            <figcaption className="attr">
              <span className="attr-av">DK</span>
              <span>
                <b>Dana Koenig</b>
                <span className="attr-role">VP Talent · Astraflow</span>
              </span>
            </figcaption>
          </div>
          <div className="quote-metric">
            <div className="qm-v tnum">63%</div>
            <div className="qm-l">faster leadership shortlists</div>
          </div>
        </figure>
      </div>
    </section>
  );
}

const INTEGRATIONS = ["Greenhouse", "Lever", "Workday", "SAP SuccessFactors", "Ashby", "iCIMS", "BambooHR", "Slack"];

export function Integrations() {
  return (
    <section className="blk" id="integrations" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head rv">
          <h2>Drops into the stack you already run.</h2>
          <p>Two-way sync with your ATS and HRIS. Scores, verdicts, and reports land where your recruiters already work.</p>
        </div>
        <div className="integ stagger">
          {INTEGRATIONS.map((i) => (
            <div className="integ-chip" key={i}>
              <IntegrationMark name={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="blk" id="cta" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-banner rv">
          <div className="cb-img"><img src="/images/hero-interview.jpg" alt="" loading="lazy" decoding="async" /></div>
          <div className="cb-scrim" />
          <div className="cb-content">
            <h2>See Prelim on your roles.</h2>
            <p>Bring three real openings. We&apos;ll build the assessments live and show you the scorecards in 30 minutes.</p>
            <div className="hero-cta" style={{ justifyContent: "center", marginBottom: 0 }}>
              <Link className="btn btn-primary" href="/contact">Book a demo <Arrow /></Link>
              <Link className="btn btn-ghost" href="/pricing">See pricing</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
