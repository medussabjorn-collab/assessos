"use client";

import { useState } from "react";
import { Check } from "./icons";
import { FORMSPREE_ID } from "@/lib/config";

const TEAM_SIZES = ["1–50", "51–200", "201–1,000", "1,000–5,000", "5,000+"];

type Status = "idle" | "submitting" | "done" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real users never fill this hidden field.
    if (data.get("_gotcha")) return;

    setStatus("submitting");
    setError("");

    // No endpoint configured yet — accept gracefully so the UX is complete.
    if (!FORMSPREE_ID) {
      setStatus("done");
      return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      if (res.ok) {
        setStatus("done");
        form.reset();
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.errors?.[0]?.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="form-done">
        <span className="fd-icon"><Check /></span>
        <h3>Request received.</h3>
        <p>A Prelim specialist will reach out within one business day to schedule your demo.</p>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form className="cform" onSubmit={onSubmit}>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <input type="hidden" name="_subject" value="New Prelim demo request" />
      <div className="cf-row">
        <label className="field">
          <span>Full name</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Ava Meridian" disabled={busy} />
        </label>
        <label className="field">
          <span>Work email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="ava@company.com" disabled={busy} />
        </label>
      </div>
      <div className="cf-row">
        <label className="field">
          <span>Company</span>
          <input name="company" type="text" autoComplete="organization" required placeholder="Company, Inc." disabled={busy} />
        </label>
        <label className="field">
          <span>Team size</span>
          <select name="teamSize" defaultValue="" disabled={busy}>
            <option value="" disabled>Select…</option>
            {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>What are you hiring for?</span>
        <textarea name="message" rows={4} placeholder="Roles, volume, and what you'd like to see in the demo." disabled={busy} />
      </label>
      <button className="btn btn-primary cf-submit" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Book a demo"}
      </button>
      {status === "error" && <p className="cf-error" role="alert">{error}</p>}
      <p className="cf-fine">By submitting, you agree to Prelim&apos;s Privacy Policy. We&apos;ll only use your details to arrange the demo.</p>
    </form>
  );
}
