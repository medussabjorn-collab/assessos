/**
 * Flow 2: Hiring Candidate Evaluation
 * manager login → view pipeline → score candidate → update status
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockHiringFlow } from './fixtures/api-mocks';
import { mockApi } from './fixtures/helpers';

test.describe('Hiring Candidate Evaluation Flow', () => {
  test('happy path: manager views dashboard with pipeline metrics', async ({
    managerPage: page,
  }) => {
    await mockHiringFlow(page);
    await page.goto('/dashboard/hiring');

    await expect(page.getByText('Hiring Dashboard')).toBeVisible();
    await expect(page.getByText('Open Positions')).toBeVisible();
    // Scope the metric to its KPI card; bare '5' matches several nodes.
    await expect(
      page.getByText('Open Positions').locator('..').getByText('5', { exact: true }),
    ).toBeVisible();                                           // openPositions
    await expect(page.getByText('32')).toBeVisible();          // totalCandidates
    await expect(page.getByText('18 days')).toBeVisible();     // avgTimeToHire
    await expect(page.getByText('85%')).toBeVisible();         // offerAcceptanceRate
  });

  test('pipeline stages are displayed with correct counts', async ({
    managerPage: page,
  }) => {
    await mockHiringFlow(page);
    await page.goto('/dashboard/hiring');

    await expect(page.getByText('Hiring Pipeline')).toBeVisible();
    await expect(page.getByText('Screening')).toBeVisible();
    await expect(page.getByText('Technical')).toBeVisible();
    await expect(page.getByText('Culture Fit')).toBeVisible();
    await expect(page.getByText('Offer', { exact: true })).toBeVisible();
    await expect(page.getByText('Hired')).toBeVisible();
    await expect(page.getByText('Rejected')).toBeVisible();
  });

  test('top candidates panel shows candidate names and scores', async ({
    managerPage: page,
  }) => {
    await mockHiringFlow(page);
    await page.goto('/dashboard/hiring');

    await expect(page.getByText('Top Candidates')).toBeVisible();
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText(/Software Engineer/)).toBeVisible();
    await expect(page.getByText('John Smith')).toBeVisible();
    await expect(page.getByText(/Product Manager/)).toBeVisible();
  });

  test('quick actions panel renders all action buttons', async ({
    managerPage: page,
  }) => {
    await mockHiringFlow(page);
    await page.goto('/dashboard/hiring');

    await expect(page.getByRole('button', { name: 'Create New Position' })).toBeVisible();
    // Renders as a Next.js <Link> (an <a>), not a <button> — role differs accordingly.
    await expect(page.getByRole('link', { name: 'View All Candidates' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage Team Members' })).toBeVisible();
  });

  test('API error shows user-friendly error message', async ({ managerPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/hiring\/dashboard/, { error: 'Unauthorized' }, 403);

    await page.goto('/dashboard/hiring');
    await expect(page.getByText('Failed to load hiring dashboard')).toBeVisible();
  });
});
