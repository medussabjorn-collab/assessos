/**
 * Flow 4: Live Interview
 * login → schedule interview → start video room → AI proctoring → submit feedback
 *
 * NOTE: The live-interview module is not yet implemented in the codebase.
 * Tests are quarantined with test.fixme() until the /dashboard/interviews route ships.
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_INTERVIEW = {
  id: 'iv-e2e-001',
  candidateName: 'Alice Nguyen',
  role: 'Senior Engineer',
  scheduledAt: new Date(Date.now() + 60_000).toISOString(),
  status: 'scheduled',
  roomUrl: 'https://meet.assessos.test/room/iv-e2e-001',
};

const MOCK_FEEDBACK = {
  id: 'fb-e2e-001',
  interviewId: 'iv-e2e-001',
  technicalScore: 4,
  cultureFitScore: 3,
  notes: 'Strong system design skills, could improve on collaboration signals.',
  recommendation: 'advance',
};

test.describe('Live Interview Flow', () => {
  test.fixme(
    'happy path: schedule → start room → proctor active → submit feedback',
    async ({ managerPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/interviews$/, { data: [MOCK_INTERVIEW] });
      await mockApi(page, /\/api\/interviews\/iv-e2e-001\/start/, {
        data: { roomUrl: MOCK_INTERVIEW.roomUrl, proctoringActive: true },
      });
      await mockApi(page, /\/api\/interviews\/iv-e2e-001\/feedback/, { data: MOCK_FEEDBACK });

      await page.goto('/dashboard/interviews');
      await expect(page.getByText('Alice Nguyen')).toBeVisible();
      await expect(page.getByText('Senior Engineer')).toBeVisible();

      await page.getByRole('button', { name: /Start Interview/ }).click();
      await expect(page.getByText(/AI Proctoring Active/i)).toBeVisible();

      await page.getByRole('button', { name: /End Interview/ }).click();

      // Feedback form
      await expect(page.getByText(/Submit Feedback/i)).toBeVisible();
      await page.getByLabel(/Technical Score/i).fill('4');
      await page.getByLabel(/Culture Fit/i).fill('3');
      await page.getByLabel(/Notes/i).fill('Strong system design skills');
      await page.getByRole('button', { name: /Submit Feedback/ }).click();

      await expect(page.getByText(/Feedback submitted/i)).toBeVisible();
    },
  );

  test.fixme(
    'scheduling validation: past date is rejected',
    async ({ managerPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });

      await page.goto('/dashboard/interviews/schedule');
      await page.getByLabel(/Date/i).fill('2020-01-01');
      await page.getByLabel(/Time/i).fill('09:00');
      await page.getByRole('button', { name: /Schedule/ }).click();

      await expect(page.getByText(/must be in the future/i)).toBeVisible();
    },
  );

  test.fixme(
    'proctoring flag is visible during active room session',
    async ({ managerPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/interviews\/iv-e2e-001\/start/, {
        data: { roomUrl: MOCK_INTERVIEW.roomUrl, proctoringActive: true },
      });

      await page.goto('/dashboard/interviews/iv-e2e-001/room');
      await expect(page.getByText(/AI Proctoring/i)).toBeVisible();
    },
  );

  test.fixme(
    'feedback form requires both scores before submission',
    async ({ managerPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });

      await page.goto('/dashboard/interviews/iv-e2e-001/feedback');
      await page.getByRole('button', { name: /Submit Feedback/ }).click();

      await expect(page.getByText(/required/i)).toBeVisible();
    },
  );
});
