// Public runtime config, inlined at build time for the static export.
// Set these in .env.local (see .env.local.example) before deploying.

/**
 * REST endpoint on the AssessOS API that accepts new contact/demo-request
 * leads (must be HTTPS, must accept a JSON POST — see
 * components/ContactForm.tsx for the exact payload shape). Enables the
 * contact form.
 */
export const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || "";

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
