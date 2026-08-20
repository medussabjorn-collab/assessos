import Link from "next/link";
import { Arrow, Sparkles } from "./icons";

const METERS = [
  { label: "System Design", value: 91 },
  { label: "Coding", value: 88 },
  { label: "Leadership", value: 76 },
  { label: "Communication", value: 82 },
  { label: "Culture Fit", value: 79 },
];

const RING_C = 2 * Math.PI * 52;
const SCORE = 88.9;

export default function Hero() {
  return (
    <section className="hero">
      <div className="aura" />
      <div className="wrap hero-in">
        <div className="rv">
          <span className="availbadge">
            <span className="pip" /> <b>Prelim 3.0</b>&nbsp;— agentic scoring is live
          </span>
          <h1>
            Hire on <em>evidence</em>,<br />not instinct.
          </h1>
          <p className="lead">
            Prelim measures leadership, technical, and non-IT candidates on one
            defensible model — and hands your team a ranked shortlist they can
            stand behind.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/contact">
              Book a demo <Arrow />
            </Link>
            <Link className="btn btn-ghost" href="/platform">See how it works</Link>
          </div>
          <div className="hero-foot">
            <span>SOC 2 Type II</span><span className="sep" />
            <span>1,117+ hiring teams</span><span className="sep" />
            <span>Seed to Fortune 500</span>
          </div>
        </div>

        <div className="rv card3d" style={{ transitionDelay: ".1s", position: "relative" }}>
          <div className="float-card" style={{ left: "-18px", bottom: "-16px" }}>
            <div className="dt-label" style={{ marginBottom: ".2rem" }}>Assessments this week</div>
            <div className="dt-value tnum" style={{ fontSize: "1.3rem" }}>4,812</div>
            <div className="dt-delta up" style={{ marginTop: ".2rem" }}>↑ 12% vs last week</div>
          </div>
          <div className="float-card ai-bubble" style={{ right: "-16px", top: "18px" }}>
            <div className="ab-head"><span className="ab-pip" /><Sparkles /> AI recommendation</div>
            <div className="ab-verdict">Strong Hire — 94% confidence</div>
            <div className="ab-why">System design depth + leadership signal both above benchmark.</div>
          </div>
          <div className="console">
            <div className="console-bar">
              <div className="dots"><i /><i /><i /></div>
              <span className="path">prelim / candidates / scorecard</span>
            </div>
            <div className="console-body">
              <div className="cand">
                <div className="who">
                  <div className="av">AM</div>
                  <div>
                    <div className="nm">Ava Meridian</div>
                    <div className="role">STAFF ENGINEER · REQ-4471</div>
                  </div>
                </div>
                <span className="verdict">STRONG HIRE</span>
              </div>
              <div className="score-head">
                <div className="gauge">
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="g-track" cx="60" cy="60" r="52" />
                    <circle
                      className="g-prog"
                      cx="60"
                      cy="60"
                      r="52"
                      style={{ strokeDashoffset: RING_C * (1 - SCORE / 100) }}
                    />
                  </svg>
                  <div className="g-center">
                    <span className="big tnum">{SCORE.toFixed(1)}</span>
                    <span className="g-sub">/ 100 · COMPOSITE</span>
                  </div>
                </div>
                <div className="score-meta">
                  <div className="sm-row"><span className="sm-k">Percentile</span><span className="sm-v tnum">96th</span></div>
                  <div className="sm-row"><span className="sm-k">Benchmark</span><span className="sm-v">Staff SWE</span></div>
                  <div className="sm-row"><span className="sm-k">Confidence</span><span className="sm-v">High</span></div>
                </div>
              </div>
              <div className="meters" id="meters">
                {METERS.map((m) => (
                  <div className="meter" key={m.label}>
                    <span className="mlbl">{m.label}</span>
                    <div className="track"><div className="fill" style={{ transform: `scaleX(${m.value / 100})` }} /></div>
                    <span className="val tnum">{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="console-foot">
                <span>207ms median</span>
                <span>inconsistency: none</span>
                <span>proctor: clean</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
