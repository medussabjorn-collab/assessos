/**
 * Flow 5: Coding Challenge
 * login → select problem → submit code → auto-grade → view leaderboard rank
 *
 * The coding-challenge module is real (apps/api/src/modules/coding), but code
 * execution itself goes through Judge0 (JUDGE0_URL), which isn't configured
 * in this dev/CI environment — so `submit` is mocked here, matching the real
 * response contract (CodeExecutionService.validateSolution via
 * CodingService.submitSolution: passed/failed are COUNTS, not booleans).
 * Problem list/detail and leaderboard hit the real backend routes and shapes
 * (GET /api/coding/problems[/:id], GET /api/coding/leaderboards — the
 * leaderboard is global, not per-problem; there's no backend support for a
 * per-problem ranking).
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_PROBLEM = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  description: 'Given an array of integers, return indices of two numbers that add up to target.',
  constraints: ['2 <= nums.length <= 10^4'],
  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' }],
};

const MOCK_PASS_RESULT = {
  valid: true,
  score: 100,
  feedback: 'All test cases passed.',
  passed: 3,
  failed: 0,
  results: [
    { passed: true, output: '[0,1]' },
    { passed: true, output: '[1,2]' },
    { passed: true, output: '[0,1]' },
  ],
  plagiarism: { flagged: false },
};

const MOCK_FAIL_RESULT = {
  valid: false,
  score: 33,
  feedback: '1 of 3 test cases passed.',
  passed: 1,
  failed: 2,
  results: [
    { passed: true, output: '[0,1]' },
    { passed: false, output: '[]', error: 'expected [1,2] got []' },
    { passed: false, output: '[]', error: 'expected [0,1] got []' },
  ],
  plagiarism: { flagged: false },
};

const MOCK_LEADERBOARDS = {
  global: {
    timeFrame: 'week',
    leaders: [
      { rank: 1, name: 'AlgoMaster', solved: 87, score: 8700, badge: '👑' },
      { rank: 2, name: 'CodeNinja', solved: 82, score: 8200, badge: '🥈' },
    ],
    userRank: 7,
    userScore: 3450,
  },
  streaks: { currentStreaks: [], userStreak: 0 },
};

test.describe('Coding Challenge Flow', () => {
  test(
    'happy path: select problem → submit code → see grade',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/coding\/problems$/, { success: true, data: [MOCK_PROBLEM] });
      await mockApi(page, /\/api\/coding\/problems\/two-sum$/, { success: true, data: MOCK_PROBLEM });
      await mockApi(page, /\/api\/coding\/problems\/two-sum\/submit/, { success: true, data: MOCK_PASS_RESULT });

      await page.goto('/dashboard/challenges');
      await expect(page.getByText('Two Sum')).toBeVisible();
      await expect(page.getByText('easy')).toBeVisible();

      await page.getByText('Two Sum').click();
      await expect(page.getByText('Given an array of integers')).toBeVisible();

      // Monaco's actual input-capture node ("Editor content") sits outside
      // the viewport by design; click the visible editor surface instead —
      // Monaco routes keyboard input to the hidden node regardless.
      await page.locator('.monaco-editor').click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('function twoSum(nums, target) { return [0,1]; }');

      await page.getByRole('button', { name: /Submit/i }).click();

      await expect(page.getByText('Passed', { exact: true })).toBeVisible();
      await expect(page.getByText('3 / 3 test cases passed · score 100')).toBeVisible();
    },
  );

  test(
    'failed submission shows which test cases did not pass',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/coding\/problems\/two-sum$/, { success: true, data: MOCK_PROBLEM });
      await mockApi(page, /\/api\/coding\/problems\/two-sum\/submit/, { success: true, data: MOCK_FAIL_RESULT });

      await page.goto('/dashboard/challenges/two-sum');

      await page.locator('.monaco-editor').click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('function twoSum(nums, target) { return []; }');

      await page.getByRole('button', { name: /Submit/i }).click();

      await expect(page.getByText('Failed')).toBeVisible();
      await expect(page.getByText('1 / 3 test cases passed · score 33')).toBeVisible();
    },
  );

  test('empty submission is blocked before reaching the API', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/coding\/problems\/two-sum$/, { success: true, data: MOCK_PROBLEM });

    await page.goto('/dashboard/challenges/two-sum');

    await page.locator('.monaco-editor').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Delete');

    await page.getByRole('button', { name: /Submit/i }).click();

    await expect(page.getByText('Code cannot be empty')).toBeVisible();
  });

  test('leaderboard is accessible from the challenge page', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/coding\/problems\/two-sum$/, { success: true, data: MOCK_PROBLEM });
    await mockApi(page, /\/api\/coding\/leaderboards/, { success: true, data: MOCK_LEADERBOARDS });

    await page.goto('/dashboard/challenges/two-sum/leaderboard');
    await expect(page.getByText('AlgoMaster')).toBeVisible();
    await expect(page.getByText('Rank #1')).toBeVisible();
    await expect(page.getByText(/Your rank:/)).toBeVisible();
  });
});
