"use client";

import { useState } from "react";

export default function StudentLogin() {
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Candidate auth is wired to the Prelim assessment backend when the
    // dynamic app is enabled. Static build has no auth endpoint yet.
    setNote("Authentication connects to your Prelim assessment once the portal is live. Check your invite email for a direct assessment link in the meantime.");
  }

  return (
    <form className="cform login-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required placeholder="you@school.edu" />
      </label>
      <label className="field">
        <span>Password</span>
        <span className="pw-wrap">
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Your password" />
          <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      <div className="login-row">
        <label className="remember"><input type="checkbox" name="remember" /> Remember me</label>
        <a href="#" className="login-link">Forgot password?</a>
      </div>
      <button className="btn btn-primary cf-submit" type="submit">Log in</button>
      {note && <p className="login-note" role="status">{note}</p>}
      <p className="cf-fine">Have an invite code instead? <a href="#" className="login-link">Enter it here</a>.</p>
    </form>
  );
}
