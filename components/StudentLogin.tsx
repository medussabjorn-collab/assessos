"use client";

import { useState } from "react";
import { APP_LOGIN_URL } from "@/lib/config";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Link from "next/link";

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
      <Stack spacing={2}>
        <TextField name="email" type="email" label="Email" autoComplete="email" required fullWidth placeholder="you@school.edu" />
        <TextField
          name="password"
          type={show ? "text" : "password"}
          label="Password"
          autoComplete="current-password"
          required
          fullWidth
          placeholder="Your password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    type="button"
                    size="small"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? "Hide" : "Show"}
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />
        <div className="login-row">
          <FormControlLabel control={<Checkbox name="remember" />} label="Remember me" />
          <Link href="/contact/" className="login-link">Forgot password?</Link>
        </div>
        <Button type="submit" variant="contained" size="large">Log in</Button>
        {note && <Alert severity="info">{note}</Alert>}
        <p className="cf-fine">Have an invite code instead? <Link href="/contact/" className="login-link">Contact support</Link>.</p>
      </Stack>
    </form>
  );
}
