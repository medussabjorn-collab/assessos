// Public runtime config, inlined at build time for the static export.
// Set these in .env.local (see .env.local.example) before deploying.

/** Formspree form id — the part after /f/ in your endpoint. Enables the contact form. */
export const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "";

/** URL of the real Prelim assessment app where candidates actually authenticate. */
export const APP_LOGIN_URL = process.env.NEXT_PUBLIC_APP_LOGIN_URL || "";

/**
 * REST endpoint on your enterprise portal backend that accepts new student
 * registrations (must be HTTPS, and must accept a JSON POST — see
 * components/StudentRegistration.tsx for the exact payload shape).
 * Registration collects personal, academic, and contact details, so this
 * must point at infrastructure you control, never a placeholder domain.
 */
export const REGISTRATION_ENDPOINT = process.env.NEXT_PUBLIC_REGISTRATION_ENDPOINT || "";
