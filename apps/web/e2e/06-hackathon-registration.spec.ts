/**
 * Flow 6: Hackathon Registration
 * login → create/join team → submit project → judges score → leaderboard with prizes
 *
 * NOTE: The hackathon module is not yet implemented in the codebase.
 * Tests are quarantined with test.fixme() until the /dashboard/hackathon route ships.
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_HACKATHON = {
  id: 'hack-e2e-001',
  title: 'AssessOS Innovation Sprint',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'open',
};

const MOCK_TEAM = {
  id: 'team-e2e-001',
  name: 'The Testers',
  members: ['user@assessos.test'],
  hackathonId: 'hack-e2e-001',
};

const MOCK_SUBMISSION = {
  id: 'sub-hack-001',
  teamId: 'team-e2e-001',
  projectTitle: 'AI Assessment Coach',
  repoUrl: 'https://github.com/example/ai-coach',
  demoUrl: 'https://demo.ai-coach.test',
  status: 'submitted',
};

const MOCK_LEADERBOARD = [
  { rank: 1, teamName: 'Code Wizards', totalScore: 95, prize: '$5,000' },
  { rank: 2, teamName: 'The Testers', totalScore: 88, prize: '$2,500' },
  { rank: 3, teamName: 'Debug Bros', totalScore: 80, prize: '$1,000' },
];

test.describe('Hackathon Registration Flow', () => {
  test.fixme(
    'happy path: create team → submit project → view scored leaderboard',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/hackathons\/hack-e2e-001$/, { data: MOCK_HACKATHON });
      await mockApi(page, /\/api\/hackathons\/hack-e2e-001\/teams$/, { data: [] });
      await mockApi(page, /\/api\/teams$/, { data: MOCK_TEAM });
      await mockApi(page, /\/api\/teams\/team-e2e-001\/submit/, { data: MOCK_SUBMISSION });
      await mockApi(page, /\/api\/hackathons\/hack-e2e-001\/leaderboard/, {
        data: MOCK_LEADERBOARD,
      });

      // Create team
      await page.goto('/dashboard/hackathon/hack-e2e-001');
      await expect(page.getByText('AssessOS Innovation Sprint')).toBeVisible();
      await page.getByRole('button', { name: /Create Team/ }).click();
      await page.getByLabel(/Team Name/i).fill('The Testers');
      await page.getByRole('button', { name: /Confirm/ }).click();
      await expect(page.getByText('The Testers')).toBeVisible();

      // Submit project
      await page.getByRole('button', { name: /Submit Project/ }).click();
      await page.getByLabel(/Project Title/i).fill('AI Assessment Coach');
      await page.getByLabel(/Repo URL/i).fill('https://github.com/example/ai-coach');
      await page.getByLabel(/Demo URL/i).fill('https://demo.ai-coach.test');
      await page.getByRole('button', { name: /Submit/i }).click();
      await expect(page.getByText('submitted')).toBeVisible();

      // Leaderboard
      await page.getByRole('link', { name: /Leaderboard/i }).click();
      await expect(page.getByText('Code Wizards')).toBeVisible();
      await expect(page.getByText('$5,000')).toBeVisible();
      await expect(page.getByText('The Testers')).toBeVisible();
      await expect(page.getByText('$2,500')).toBeVisible();
    },
  );

  test.fixme(
    'join existing team via invite code',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/teams\/join/, { data: MOCK_TEAM });

      await page.goto('/dashboard/hackathon/hack-e2e-001');
      await page.getByRole('button', { name: /Join Team/ }).click();
      await page.getByLabel(/Invite Code/i).fill('TEAM-XYZ-123');
      await page.getByRole('button', { name: /Join/i }).click();

      await expect(page.getByText('The Testers')).toBeVisible();
    },
  );

  test.fixme(
    'submission form validates required fields before API call',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });

      await page.goto('/dashboard/hackathon/hack-e2e-001/submit');
      await page.getByRole('button', { name: /Submit/i }).click();

      await expect(page.getByText(/project title is required/i)).toBeVisible();
      await expect(page.getByText(/repo url is required/i)).toBeVisible();
    },
  );

  test.fixme(
    'leaderboard shows prize rankings after judging',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/hackathons\/hack-e2e-001\/leaderboard/, {
        data: MOCK_LEADERBOARD,
      });

      await page.goto('/dashboard/hackathon/hack-e2e-001/leaderboard');

      for (const entry of MOCK_LEADERBOARD) {
        await expect(page.getByText(entry.teamName)).toBeVisible();
        await expect(page.getByText(entry.prize)).toBeVisible();
      }

      // Prize ranking order — rank 1 appears first in the DOM
      const teamNames = await page.getByTestId('leaderboard-team-name').allTextContents();
      expect(teamNames[0]).toBe('Code Wizards');
    },
  );
});
