/**
 * Flow 1: Leadership Assessment
 * login → start session → answer questions → submit → view AI report
 */
import { test, expect } from './fixtures/auth.fixture';
import { mockAssessmentFlow, MOCK_CONFIG_ID, MOCK_REPORT_ID } from './fixtures/api-mocks';

test.describe('Leadership Assessment Flow', () => {
  test('happy path: complete assessment and view report', async ({ authedPage: page }) => {
    await mockAssessmentFlow(page);

    // Navigate to assessment with a config
    await page.goto(`/dashboard/assessment?configId=${MOCK_CONFIG_ID}`);
    await expect(page.getByText('Leadership Assessment')).toBeVisible();
    await expect(page.getByText('Question 1 of')).toBeVisible();

    // Answer first question
    await page.getByRole('button', { name: 'Very effectively' }).click();
    await expect(page.getByRole('button', { name: 'Very effectively' })).toHaveClass(
      /border-blue-600/,
    );

    // Navigate to next question
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Question 2 of')).toBeVisible();

    // Answer second (last) question and submit
    await page.getByRole('button', { name: 'Very well' }).click();
    await page.getByRole('button', { name: 'Submit Assessment' }).click();

    await expect(page.getByText('Assessment Submitted!')).toBeVisible();
  });

  test('progress bar advances with each answered question', async ({ authedPage: page }) => {
    await mockAssessmentFlow(page);
    await page.goto(`/dashboard/assessment?configId=${MOCK_CONFIG_ID}`);

    // Progress bar starts narrow (scope to the header track to avoid matching
    // other blue pills; the fill is an empty decorative div so assert presence
    // via count rather than visibility).
    const bar = page.locator(
      '.bg-gray-200.rounded-full.h-2 > .bg-brand-600.h-2.rounded-full',
    );
    await expect(bar).toHaveCount(1);
    const initialWidth = await bar.evaluate((el) => (el as HTMLElement).style.width);

    await page.getByRole('button', { name: 'Moderately' }).click();
    await page.getByRole('button', { name: /Next/ }).click();

    const nextWidth = await bar.evaluate((el) => (el as HTMLElement).style.width);
    expect(parseFloat(nextWidth) > parseFloat(initialWidth)).toBeTruthy();
  });

  test('previous navigation restores earlier question', async ({ authedPage: page }) => {
    await mockAssessmentFlow(page);
    await page.goto(`/dashboard/assessment?configId=${MOCK_CONFIG_ID}`);

    await page.getByRole('button', { name: 'Somewhat' }).click();
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Question 2 of')).toBeVisible();

    await page.getByRole('button', { name: /Previous/ }).click();
    await expect(page.getByText('Question 1 of')).toBeVisible();
    // Selection from before should be preserved (border-blue-600 class)
    await expect(page.getByRole('button', { name: 'Somewhat' })).toHaveClass(/border-blue-600/);
  });

  test('report page shows AI-generated scores and narrative', async ({ authedPage: page }) => {
    await mockAssessmentFlow(page);
    await page.goto(`/dashboard/reports/${MOCK_REPORT_ID}`);

    await expect(page.getByText('Leadership Assessment Report')).toBeVisible();
    await expect(page.getByText('Report Ready')).toBeVisible();
    await expect(page.getByText('Competency Dimension Scores')).toBeVisible();
    await expect(page.getByText('78%')).toBeVisible();                // percentile
    await expect(page.getByText(/strong leadership capabilities/)).toBeVisible();
  });

  test('reports list links to individual report', async ({ authedPage: page }) => {
    await mockAssessmentFlow(page);
    await page.goto('/dashboard/reports');

    await expect(page.getByText('Assessment Report', { exact: true })).toBeVisible();
    await expect(page.getByText('Ready to view')).toBeVisible();

    await page.getByText('Assessment Report', { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/reports/${MOCK_REPORT_ID}`));
  });
});
