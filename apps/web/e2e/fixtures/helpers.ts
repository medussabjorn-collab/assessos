import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// API mock helpers
// ---------------------------------------------------------------------------

/** Intercept and stub an API route with a JSON payload. */
export async function mockApi(
  page: Page,
  urlPattern: string | RegExp,
  body: unknown,
  status = 200,
): Promise<void> {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

/** Stub every request to the backend API with sensible defaults. */
export async function stubBackend(page: Page): Promise<void> {
  // Auth tenant resolution
  await mockApi(page, /\/api\/auth\/tenant/, {
    data: { tenantId: 'tenant-test-001' },
  });
}

// ---------------------------------------------------------------------------
// Wait helpers
// ---------------------------------------------------------------------------

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
}
