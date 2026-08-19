import type { Metadata } from "next";
import StudentLogin from "@/components/StudentLogin";
import { Check, Clock, ShieldCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Student & Candidate Login",
  description:
    "Log in to take your Prelim assessment. Fair, accessible, and proctored — with everything you need to know before you start.",
};

const NOTES = [
  { Icon: Clock, t: "Take it on your schedule", d: "Start when you're ready within the window your inviter set." },
  { Icon: Check, t: "Fair & accessible", d: "Adaptive questions, screen-reader support, and extra-time accommodations." },
  { Icon: ShieldCheck, t: "Your data is protected", d: "Your responses are never sold and never used to train AI models." },
];

export default function StudentsPage() {
  return (
    <section className="blk contact-wrap">
      <div className="wrap contact-grid">
        <div className="rv">
          <div className="crumb"><span>Prelim</span> / Student login</div>
          <h1 className="contact-h1">Log in to your assessment.</h1>
          <p className="contact-lead">Welcome. Sign in with the email your assessment was sent to, then follow the on-screen steps. Everything you need is right here.</p>
          <ul className="promises">
            {NOTES.map(({ Icon, t, d }) => (
              <li key={t}>
                <span className="pr-ic"><Icon /></span>
                <span><b>{t}</b><span className="pr-d">{d}</span></span>
              </li>
            ))}
          </ul>
          <p className="students-help">Trouble logging in? <a href="/contact/" className="login-link">Contact support</a> or check your invite email for a direct link.</p>
        </div>
        <div className="rv contact-card">
          <StudentLogin />
        </div>
      </div>
    </section>
  );
}
