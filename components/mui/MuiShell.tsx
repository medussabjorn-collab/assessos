"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Scoped provider for the Material-UI form surfaces only (ContactForm,
// ROICalculator, StudentRegistration/Login/Access). Importing this only
// from those components keeps MUI's runtime out of every other route's
// bundle — Next.js code-splits per route, so a page that never imports
// MuiShell never ships MUI/Emotion JS.
//
// Palette below is the resolved default (light + corporate palette) hex
// values from app/globals.css :root, so first paint matches the site's
// brand even before any live theme/palette bridging is wired.
const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1F72B4" },
    secondary: { main: "#5FA234" },
    background: { default: "#FBFCFE", paper: "#FFFFFF" },
    text: { primary: "#0A0E17", secondary: "#414B63" },
    divider: "#E2E7F1",
  },
  typography: { fontFamily: "var(--font-sans)" },
  shape: { borderRadius: 10 },
});

export function MuiShell({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
