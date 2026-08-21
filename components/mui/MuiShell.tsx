"use client";

import { useEffect, useMemo, useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Scoped provider for the Material-UI form surfaces only (ContactForm,
// ROICalculator, StudentRegistration/Login/Access) — AND, since
// app/(site)/layout.tsx wraps the whole site in this, also Nav's own
// MUI Button/IconButton/Drawer. Importing this only from route trees that
// need it keeps MUI's runtime out of every other route's bundle — Next.js
// code-splits per route, so a page that never imports MuiShell never ships
// MUI/Emotion JS.
//
// Palette values below are the resolved hex values from app/globals.css's
// light/dark :root blocks. Nav.tsx sets data-theme via a plain DOM
// attribute (not React context), so this bridges via a MutationObserver
// rather than prop-drilling — without it, MUI's primary.main is a static
// JS constant that never reacts to dark mode, which would freeze the
// near-black light-mode CTA against a near-black dark-mode page (the
// exact near-invisible-button bug this bridge exists to prevent).
const LIGHT = {
  primary: "#14141A",
  bg: "#FBFCFE",
  paper: "#FFFFFF",
  text: "#0A0E17",
  textSecondary: "#414B63",
  divider: "#E2E7F1",
};
const DARK = {
  primary: "#F3F4F7",
  bg: "#05070E",
  paper: "#0C111E",
  text: "#EDF1FB",
  textSecondary: "#B2BDD6",
  divider: "#1E2740",
};

function readIsDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export function MuiShell({ children }: { children: React.ReactNode }) {
  // Fixed false initial state (matches what SSR always renders, since
  // there's no document server-side) — reading the real value happens only
  // in the effect below, after hydration. Reading document synchronously
  // during the initial client render (e.g. via a useState lazy initializer)
  // would diverge from the server's render whenever a visitor already has
  // dark mode stored, producing a real hydration mismatch.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(readIsDark());
    const observer = new MutationObserver(() => setDark(readIsDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const muiTheme = useMemo(() => {
    const t = dark ? DARK : LIGHT;
    return createTheme({
      palette: {
        mode: dark ? "dark" : "light",
        primary: { main: t.primary, contrastText: dark ? "#0E0F13" : "#FFFFFF" },
        secondary: { main: "#5FA234" },
        background: { default: t.bg, paper: t.paper },
        text: { primary: t.text, secondary: t.textSecondary },
        divider: t.divider,
      },
      typography: { fontFamily: "var(--font-sans)" },
      shape: { borderRadius: 10 },
      components: {
        // Scoped to Button only — Paper/Select dropdown corners in these
        // same forms stay at the base 10px radius, only the pill CTA
        // changes shape.
        MuiButton: { styleOverrides: { root: { borderRadius: 100 } } },
      },
    });
  }, [dark]);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
