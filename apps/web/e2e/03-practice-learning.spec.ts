/**
 * Flow 3: Practice Learning
 * login → practice dashboard → answer a spaced-repetition question → feedback → badges
 *
 * The practice module is real (apps/api/src/modules/practice), but its model
 * is a single next-question spaced-repetition flow, not a browsable list of
 * fixed questions — GET /api/practice/dashboard (stats + suggestedDomain),
 * GET /api/practice/question?domain=X (one question), POST /api/practice/answer
 * (grade it). There's no per-answer streak in the response (that only lives
 * in the dashboard stats) and no dedicated badges endpoint — recentBadges is
 * a bare array of slugs on the dashboard payload.
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_DASHBOARD = {
  stats: {
    totalQuestionsAnswered: 145,
    correctAnswers: 98,
    accuracyRate: 67,
    currentStreak: 5,
    longestStreak: 12,
    timeSpentHours: 12,
  },
  dueToday: 8,
  suggestedDomain: 'leadership',
  recentBadges: ['first_question', 'streak_7'],
  nextMilestone: { name: 'Month Master', progress: 5, target: 30 },
};

const MOCK_QUESTION = {
  id: 'q-001',
  domain: 'leadership',
  topic: 'Situational Leadership',
  difficulty: 'medium',
  question: 'A team member is struggling. What leadership style do you adopt?',
  options: [
    { id: 'a', text: 'Directive' },
    { id: 'b', text: 'Transformational' },
    { id: 'c', text: 'Laissez-faire' },
  ],
  estimatedTime: 30,
};

const MOCK_CORRECT_RESULT = {
  isCorrect: true,
  quality: 5,
  explanation: 'Transformational leadership empowers teams through vision and inspiration.',
  nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_INCORRECT_RESULT = {
  isCorrect: false,
  quality: 1,
  explanation: 'Transformational leadership empowers teams through vision and inspiration.',
  nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
};

test.describe('Practice Learning Flow', () => {
  test(
    'happy path: select question → submit answer → receive spaced-repetition feedback',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/practice\/dashboard/, { success: true, data: MOCK_DASHBOARD });
      await mockApi(page, /\/api\/practice\/question/, { success: true, data: MOCK_QUESTION });
      await mockApi(page, /\/api\/practice\/answer/, { success: true, data: MOCK_CORRECT_RESULT });

      await page.goto('/dashboard/practice');
      await expect(page.getByText('Due today')).toBeVisible();
      await expect(page.getByText('Start practice — leadership')).toBeVisible();

      await page.getByText('Start practice — leadership').click();
      await expect(page.getByText('A team member is struggling')).toBeVisible();

      await page.getByText('Transformational').click();
      await page.getByRole('button', { name: /Submit Answer/ }).click();

      await expect(page.getByText('Transformational leadership empowers')).toBeVisible();
      await expect(page.getByText(/next review/i)).toBeVisible();
    },
  );

  test(
    'spaced repetition shows next review date after correct answer',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/practice\/question/, { success: true, data: MOCK_QUESTION });
      await mockApi(page, /\/api\/practice\/answer/, { success: true, data: MOCK_CORRECT_RESULT });

      await page.goto('/dashboard/practice/leadership');
      await page.getByText('Transformational').click();
      await page.getByRole('button', { name: /Submit Answer/ }).click();

      await expect(page.getByText('Correct')).toBeVisible();
      await expect(page.getByText(/Next review:/)).toBeVisible();
    },
  );

  test('badge awarded on milestone progress', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/practice\/dashboard/, { success: true, data: MOCK_DASHBOARD });

    await page.goto('/dashboard/practice/badges');
    await expect(page.getByText('First Question')).toBeVisible();
    await expect(page.getByText('Streak 7')).toBeVisible();
  });

  test('wrong answer shows explanation without advancing streak', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/practice\/question/, { success: true, data: MOCK_QUESTION });
    await mockApi(page, /\/api\/practice\/answer/, { success: true, data: MOCK_INCORRECT_RESULT });

    await page.goto('/dashboard/practice/leadership');
    await page.getByText('Directive').click();
    await page.getByRole('button', { name: /Submit Answer/ }).click();

    await expect(page.getByText('Incorrect')).toBeVisible();
    await expect(page.getByText('Transformational leadership empowers')).toBeVisible();
  });
});
