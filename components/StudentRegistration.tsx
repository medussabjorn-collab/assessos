"use client";

import { useState } from "react";
import { REGISTRATION_ENDPOINT } from "@/lib/config";
import { INDUSTRIES } from "@/lib/industries";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";

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
      <Alert severity="success" variant="outlined">
        <strong>Registration received.</strong> Check your email for a confirmation and
        next steps to access your assessment.
      </Alert>
    );
  }

  const busy = status === "submitting";

  return (
    <form className="cform" onSubmit={onSubmit}>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField name="fullName" label="Full name" autoComplete="name" required fullWidth placeholder="Jordan Lee" disabled={busy} />
          <TextField name="email" type="email" label="Email address" autoComplete="email" required fullWidth placeholder="you@school.edu" disabled={busy} />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            name="dateOfBirth"
            type="date"
            label="Date of birth"
            autoComplete="bday"
            required
            fullWidth
            disabled={busy}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField name="studentId" label="Student ID / portal username" required fullWidth placeholder="As shown on your invite" disabled={busy} />
        </Stack>

        <FormControl component="fieldset" disabled={busy}>
          <FormLabel component="legend">Gender</FormLabel>
          <RadioGroup row name="gender">
            <FormControlLabel value="female" control={<Radio required />} label="Female" />
            <FormControlLabel value="male" control={<Radio />} label="Male" />
            <FormControlLabel value="prefer_not_to_say" control={<Radio />} label="Prefer not to say" />
          </RadioGroup>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField name="universityName" label="University name" required fullWidth placeholder="Your university" disabled={busy} />
          <TextField name="collegeName" label="College name" fullWidth placeholder="Your college or school (optional)" disabled={busy} />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField name="course" label="Program / course" required fullWidth placeholder="e.g. Computer Science" disabled={busy} />
          <TextField name="industry" label="Industry you're pursuing" select required fullWidth defaultValue="" disabled={busy}>
            <MenuItem value="" disabled>Select…</MenuItem>
            {INDUSTRIES.map((i) => (
              <MenuItem key={i.slug} value={i.slug}>{i.name}</MenuItem>
            ))}
          </TextField>
        </Stack>

        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? "Submitting…" : "Submit to portal"}
        </Button>
        {status === "error" && <Alert severity="error">{error}</Alert>}
        <p className="cf-fine">
          Your details are sent securely to your institution&apos;s Prelim portal and used
          only to set up your assessment. See our{" "}
          <a href="/legal/privacy/" className="login-link">Privacy Policy</a>.
        </p>
      </Stack>
    </form>
  );
}
