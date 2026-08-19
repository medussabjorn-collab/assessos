"use client";

import { useState } from "react";
import { APP_LOGIN_URL } from "@/lib/config";

export default function StudentLogin() {
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Never transmit the password from this static page. Authentication
    // happens on the real Prelim app; here we simply hand the candidate off.
    if (APP_LOGIN_URL) {
      window.location.href = APP_LOGIN_URL;
      return;
    }
    setNote("Sign-in completes on the secure Prelim assessment app. Check your invite email for a direct link, or contact support if you can't find it.");
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
