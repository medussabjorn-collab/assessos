// Public runtime config, inlined at build time for the static export.
// Set these in .env.local (see .env.local.example) before deploying.

/** Formspree form id — the part after /f/ in your endpoint. Enables the contact form. */
export const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "";

/** URL of the real Prelim assessment app where candidates actually authenticate. */
export const APP_LOGIN_URL = process.env.NEXT_PUBLIC_APP_LOGIN_URL || "";
