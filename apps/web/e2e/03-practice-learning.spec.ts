/**
 * Flow 3: Practice Learning
 * login → question library → attempt problem → spaced-repetition feedback → badges
 *
 * NOTE: The practice module is not yet implemented in the codebase. These tests
 * target the expected UI routes (/dashboard/practice) and are intentionally
 * marked fixme until the feature ships, following our flaky-test quarantine policy.
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockApi } from './fixtures/helpers';

const MOCK_QUESTIONS = [
  {
    id: 'pq-001',
    title: 'Situational Leadership',
    category: 'Leadership',
    difficulty: 'medium',
    dueAt: new Date().toISOString(),
  },
  {
    id: 'pq-002',
    title: 'Conflict Resolution',
    category: 'Communication',
    difficulty: 'easy',
    dueAt: null,
  },
];

const MOCK_FEEDBACK = {
  correct: true,
  explanation: 'Transformational leadership empowers teams through vision and inspiration.',
  nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  streakCount: 3,
};

const MOCK_BADGES = [{ id: 'b1', name: 'First Answer', awardedAt: new Date().toISOString() }];

test.describe('Practice Learning Flow', () => {
  test.fixme(
    'happy path: select question → submit answer → receive spaced-repetition feedback',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/practice\/questions/, { data: MOCK_QUESTIONS });
      await mockApi(page, /\/api\/practice\/questions\/pq-001/, {
        data: {
          ...MOCK_QUESTIONS[0],
          body: 'A team member is struggling. What leadership style do you adopt?',
          options: [
            { id: 'a', text: 'Directive' },
            { id: 'b', text: 'Transformational' },
            { id: 'c', text: 'Laissez-faire' },
          ],
        },
      });
      await mockApi(page, /\/api\/practice\/submit/, { data: MOCK_FEEDBACK });

      await page.goto('/dashboard/practice');
      await expect(page.getByText('Question Library')).toBeVisible();
      await expect(page.getByText('Situational Leadership')).toBeVisible();

      await page.getByText('Situational Leadership').click();
      await expect(page.getByText('A team member is struggling')).toBeVisible();

      await page.getByText('Transformational').click();
      await page.getByRole('button', { name: /Submit/ }).click();

      await expect(page.getByText('Transformational leadership empowers')).toBeVisible();
      await expect(page.getByText(/next review/i)).toBeVisible();
    },
  );

  test.fixme(
    'spaced repetition shows next review date after correct answer',
    async ({ authedPage: page }) => {
      await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
      await mockApi(page, /\/api\/practice\/submit/, { data: MOCK_FEEDBACK });

      await page.goto('/dashboard/practice/pq-001');
      await page.getByText('Transformational').click();
      await page.getByRole('button', { name: /Submit/ }).click();

      // Streak badge
      await expect(page.getByText('3')).toBeVisible();
    },
  );

  test.fixme('badge awarded on milestone progress', async ({ authedPage: page }) => {
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/practice\/badges/, { data: MOCK_BADGES });

    await page.goto('/dashboard/practice/badges');
    await expect(page.getByText('First Answer')).toBeVisible();
  });

  test.fixme('wrong answer shows explanation without advancing streak', async ({ authedPage: page }) => {
    const wrongFeedback = { ...MOCK_FEEDBACK, correct: false, streakCount: 0 };
    await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
    await mockApi(page, /\/api\/practice\/submit/, { data: wrongFeedback });

    await page.goto('/dashboard/practice/pq-001');
    await page.getByText('Directive').click();
    await page.getByRole('button', { name: /Submit/ }).click();

    await expect(page.getByText(/incorrect/i)).toBeVisible();
    await expect(page.getByText('Transformational leadership empowers')).toBeVisible();
  });
});
