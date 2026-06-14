/**
 * Flow 5: Coding Challenge
 * login → select problem → submit code → auto-grade → view leaderboard rank
 *
 * NOTE: The coding-challenge module is not yet implemented in the codebase.
 * Tests are quarantined with test.fixme() until the /dashboard/challenges route ships.
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_PROBLEM = {
  id: 'ch-001',
  title: 'Two Sum',
  difficulty: 'easy',
  description: 'Given an array of integers, return indices of two numbers that add to target.',
  starterCode: 'function twoSum(nums, target) {\n  // your code here\n}',
  testCases: [{ input: '[2,7,11,15], 9', expected: '[0,1]' }],
};

const MOCK_GRADE_RESULT = {
  submissionId: 'sub-e2e-001',
  passed: true,
  passedCases: 3,
  totalCases: 3,
  executionMs: 12,
  score: 100,
  rank: 7,
  leaderboard: [
    { rank: 1, username: 'coder_a', score: 100, executionMs: 8 },
    { rank: 7, username: 'you', score: 100, executionMs: 12 },
  ],
};

test.describe('Coding Challenge Flow', () => {
  test.fixme(
    'happy path: select problem → submit code → see grade and leaderboard rank',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/challenges$/, { data: [MOCK_PROBLEM] });
      await mockApi(page, /\/api\/challenges\/ch-001$/, { data: MOCK_PROBLEM });
      await mockApi(page, /\/api\/challenges\/ch-001\/submit/, { data: MOCK_GRADE_RESULT });
      await mockApi(page, /\/api\/challenges\/ch-001\/leaderboard/, {
        data: MOCK_GRADE_RESULT.leaderboard,
      });

      await page.goto('/dashboard/challenges');
      await expect(page.getByText('Two Sum')).toBeVisible();
      await expect(page.getByText('easy')).toBeVisible();

      await page.getByText('Two Sum').click();
      await expect(page.getByText('Given an array of integers')).toBeVisible();

      // Code editor — assumes a textarea or contenteditable with role=textbox
      const editor = page.getByRole('textbox', { name: /code editor/i });
      await editor.fill('function twoSum(nums, target) { return [0,1]; }');
      await page.getByRole('button', { name: /Submit/i }).click();

      await expect(page.getByText('3 / 3')).toBeVisible();  // passed cases
      await expect(page.getByText('Rank #7')).toBeVisible();
    },
  );

  test.fixme(
    'failed submission shows which test cases did not pass',
    async ({ authedPage: page }) => {
      const failResult = { ...MOCK_GRADE_RESULT, passed: false, passedCases: 1, score: 33 };
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/challenges\/ch-001$/, { data: MOCK_PROBLEM });
      await mockApi(page, /\/api\/challenges\/ch-001\/submit/, { data: failResult });

      await page.goto('/dashboard/challenges/ch-001');
      await page.getByRole('button', { name: /Submit/i }).click();

      await expect(page.getByText('1 / 3')).toBeVisible();
      await expect(page.getByText(/failed/i)).toBeVisible();
    },
  );

  test.fixme('empty submission is blocked before reaching the API', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/challenges\/ch-001$/, { data: MOCK_PROBLEM });

    await page.goto('/dashboard/challenges/ch-001');
    // Clear the editor
    await page.getByRole('textbox', { name: /code editor/i }).clear();
    await page.getByRole('button', { name: /Submit/i }).click();

    await expect(page.getByText(/code cannot be empty/i)).toBeVisible();
  });

  test.fixme('leaderboard is accessible from the challenge page', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/challenges\/ch-001\/leaderboard/, {
      data: MOCK_GRADE_RESULT.leaderboard,
    });

    await page.goto('/dashboard/challenges/ch-001/leaderboard');
    await expect(page.getByText('coder_a')).toBeVisible();
    await expect(page.getByText('Rank #1')).toBeVisible();
  });
});
