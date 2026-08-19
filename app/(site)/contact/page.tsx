import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Check, Clock, ShieldCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Book a demo",
  description:
    "See Prelim on your roles. Bring three real openings and we'll build the assessments live and walk through the scorecards in 30 minutes.",
};

const PROMISES = [
  { Icon: Clock, t: "30 minutes", d: "A focused, no-fluff walkthrough on your actual roles." },
  { Icon: Check, t: "Live scorecards", d: "We build the assessment during the call and show real output." },
  { Icon: ShieldCheck, t: "Security-ready", d: "Bring your security team — we'll cover architecture and controls." },
];

export default function ContactPage() {
  return (
    <section className="blk contact-wrap">
      <div className="wrap contact-grid">
        <div className="rv">
          <div className="crumb"><span>Prelim</span> / Book a demo</div>
          <h1 className="contact-h1">See Prelim on your roles.</h1>
          <p className="contact-lead">Bring three real openings. We&apos;ll build the assessments live and show you the scorecards — leadership, technical, or non-IT — in about 30 minutes.</p>
          <ul className="promises">
            {PROMISES.map(({ Icon, t, d }) => (
              <li key={t}>
                <span className="pr-ic"><Icon /></span>
                <span><b>{t}</b><span className="pr-d">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rv contact-card">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
