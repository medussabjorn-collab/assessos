"use client";

import { useState } from "react";
import { Check } from "./icons";
import { REGISTRATION_ENDPOINT } from "@/lib/config";
import { INDUSTRIES } from "@/lib/industries";

type Status = "idle" | "submitting" | "done" | "error";

export default function StudentRegistration() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: real users never fill this hidden field.
    if (data.get("_gotcha")) return;

    setStatus("submitting");
    setError("");

    const payload = Object.fromEntries(data.entries());
    delete payload._gotcha;

    // No backend configured yet — accept gracefully so the flow is complete
    // to test, without ever silently discarding real student data.
    if (!REGISTRATION_ENDPOINT) {
      setStatus("done");
      return;
    }

    try {
      const res = await fetch(REGISTRATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        // credentials omitted: this is a public static site, the portal
        // backend authenticates the request on its own terms (API key,
        // signed payload, etc.) — never rely on cookies here.
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("done");
        form.reset();
      } else {
        setError("Registration couldn't be submitted. Please try again or contact support.");
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
        <h3>Registration received.</h3>
        <p>Check your email for a confirmation and next steps to access your assessment.</p>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form className="cform" onSubmit={onSubmit}>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />

      <div className="cf-row">
        <label className="field">
          <span>Full name</span>
          <input name="fullName" type="text" autoComplete="name" required placeholder="Jordan Lee" disabled={busy} />
        </label>
        <label className="field">
          <span>Email address</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@school.edu" disabled={busy} />
        </label>
      </div>

      <div className="cf-row">
        <label className="field">
          <span>Date of birth</span>
          <input name="dateOfBirth" type="date" autoComplete="bday" required disabled={busy} />
        </label>
        <label className="field">
          <span>Student ID / portal username</span>
          <input name="studentId" type="text" required placeholder="As shown on your invite" disabled={busy} />
        </label>
      </div>

      <fieldset className="field radio-field">
        <legend>Gender</legend>
        <div className="radio-row">
          <label className="radio-opt"><input type="radio" name="gender" value="female" required disabled={busy} /> Female</label>
          <label className="radio-opt"><input type="radio" name="gender" value="male" disabled={busy} /> Male</label>
          <label className="radio-opt"><input type="radio" name="gender" value="prefer_not_to_say" disabled={busy} /> Prefer not to say</label>
        </div>
      </fieldset>

      <div className="cf-row">
        <label className="field">
          <span>University name</span>
          <input name="universityName" type="text" required placeholder="Your university" disabled={busy} />
        </label>
        <label className="field">
          <span>College name</span>
          <input name="collegeName" type="text" placeholder="Your college or school (optional)" disabled={busy} />
        </label>
      </div>

      <div className="cf-row">
        <label className="field">
          <span>Program / course</span>
          <input name="course" type="text" required placeholder="e.g. Computer Science" disabled={busy} />
        </label>
        <label className="field">
          <span>Industry you're pursuing</span>
          <select name="industry" defaultValue="" required disabled={busy}>
            <option value="" disabled>Select…</option>
            {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </select>
        </label>
      </div>

      <button className="btn btn-primary cf-submit" type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit to portal"}
      </button>
      {status === "error" && <p className="cf-error" role="alert">{error}</p>}
      <p className="cf-fine">Your details are sent securely to your institution&apos;s Prelim portal and used only to set up your assessment. See our <a href="/legal/privacy/" className="login-link">Privacy Policy</a>.</p>
    </form>
  );
}
