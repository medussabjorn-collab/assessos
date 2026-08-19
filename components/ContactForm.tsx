"use client";

import { useState } from "react";
import { Check } from "./icons";

const TEAM_SIZES = ["1–50", "51–200", "201–1,000", "1,000–5,000", "5,000+"];

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No backend on static export yet — this is where a form endpoint
    // (Formspree, a serverless function, or the Prelim API) gets wired in.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="form-done">
        <span className="fd-icon"><Check /></span>
        <h3>Request received.</h3>
        <p>A Prelim specialist will reach out within one business day to schedule your demo.</p>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit} noValidate={false}>
      <div className="cf-row">
        <label className="field">
          <span>Full name</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Ava Meridian" />
        </label>
        <label className="field">
          <span>Work email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="ava@company.com" />
        </label>
      </div>
      <div className="cf-row">
        <label className="field">
          <span>Company</span>
          <input name="company" type="text" autoComplete="organization" required placeholder="Company, Inc." />
        </label>
        <label className="field">
          <span>Team size</span>
          <select name="teamSize" defaultValue="">
            <option value="" disabled>Select…</option>
            {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>What are you hiring for?</span>
        <textarea name="message" rows={4} placeholder="Roles, volume, and what you'd like to see in the demo." />
      </label>
      <button className="btn btn-primary cf-submit" type="submit">Book a demo</button>
      <p className="cf-fine">By submitting, you agree to Prelim&apos;s Privacy Policy. We&apos;ll only use your details to arrange the demo.</p>
    </form>
  );
}
