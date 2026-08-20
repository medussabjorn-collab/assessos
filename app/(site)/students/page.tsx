import type { Metadata } from "next";
import StudentAccess from "@/components/StudentAccess";
import { PhotoBand } from "@/components/Photo";
import { Check, Clock, ShieldCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Student & Candidate Login",
  description:
    "Log in or register for your Prelim assessment. Fair, accessible, and proctored — with everything you need to know before you start.",
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
          <h1 className="contact-h1">Log in or register.</h1>
          <p className="contact-lead">Already invited? Sign in with the email your assessment was sent to. New here? Register below to get set up.</p>
          <ul className="promises">
            {NOTES.map(({ Icon, t, d }) => (
              <li key={t}>
                <span className="pr-ic"><Icon /></span>
                <span><b>{t}</b><span className="pr-d">{d}</span></span>
              </li>
            ))}
          </ul>
          <p className="students-help">Trouble logging in? <a href="/contact/" className="login-link">Contact support</a> or check your invite email for a direct link.</p>
          <div style={{ marginTop: "2rem" }}>
            <PhotoBand src="/images/students-laptop.jpg" alt="Students taking an assessment together on a laptop" ratio="wide" />
          </div>
        </div>
        <div className="rv contact-card">
          <StudentAccess />
        </div>
      </div>
    </section>
  );
}
