import { test as base, Page } from '@playwright/test';

export const STORAGE_STATE = 'e2e-artifacts/.auth/user.json';
export const MANAGER_STORAGE_STATE = 'e2e-artifacts/.auth/manager.json';

// Firebase Auth Emulator REST endpoint
const EMULATOR_URL = 'http://localhost:9099';
const FIREBASE_PROJECT = 'dev-project';

/**
 * Seed a test user into the Firebase Auth emulator and return a valid ID token.
 * If the account already exists the sign-in step returns the token directly.
 */
export async function getFirebaseToken(
  email: string,
  password: string,
): Promise<string> {
  const signUpUrl =
    `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp` +
    `?key=dev-key`;

  // Try sign-up first; ignore "EMAIL_EXISTS" errors
  await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  // Always sign in to obtain a fresh token
  const signInUrl =
    `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` +
    `?key=dev-key`;

  const res = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const body = (await res.json()) as { idToken?: string; error?: unknown };
  if (!body.idToken) {
    throw new Error(`Firebase emulator sign-in failed: ${JSON.stringify(body)}`);
  }
  return body.idToken;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type AuthFixtures = {
  authedPage: Page;
  managerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  managerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: MANAGER_STORAGE_STATE });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
