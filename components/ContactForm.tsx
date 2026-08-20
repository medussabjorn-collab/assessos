"use client";

import { useState } from "react";
import { FORMSPREE_ID } from "@/lib/config";
import { MuiShell } from "./mui/MuiShell";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

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

  const busy = status === "submitting";

  return (
    <MuiShell>
      {status === "done" ? (
        <Alert severity="success" variant="outlined">
          <strong>Request received.</strong> A Prelim specialist will reach out within one
          business day to schedule your demo.
        </Alert>
      ) : (
        <form className="cform" onSubmit={onSubmit}>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
          <input type="hidden" name="_subject" value="New Prelim demo request" />
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                name="name"
                label="Full name"
                autoComplete="name"
                required
                fullWidth
                placeholder="Ava Meridian"
                disabled={busy}
              />
              <TextField
                name="email"
                type="email"
                label="Work email"
                autoComplete="email"
                required
                fullWidth
                placeholder="ava@company.com"
                disabled={busy}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                name="company"
                label="Company"
                autoComplete="organization"
                required
                fullWidth
                placeholder="Company, Inc."
                disabled={busy}
              />
              <TextField
                name="teamSize"
                label="Team size"
                select
                fullWidth
                defaultValue=""
                disabled={busy}
              >
                <MenuItem value="" disabled>Select…</MenuItem>
                {TEAM_SIZES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              name="message"
              label="What are you hiring for?"
              multiline
              rows={4}
              fullWidth
              placeholder="Roles, volume, and what you'd like to see in the demo."
              disabled={busy}
            />
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {busy ? "Sending…" : "Book a demo"}
            </Button>
            {status === "error" && <Alert severity="error">{error}</Alert>}
            <p className="cf-fine">
              By submitting, you agree to Prelim&apos;s Privacy Policy. We&apos;ll only use
              your details to arrange the demo.
            </p>
          </Stack>
        </form>
      )}
    </MuiShell>
  );
}
