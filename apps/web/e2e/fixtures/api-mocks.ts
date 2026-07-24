import { Page } from '@playwright/test';
import { mockApi } from './helpers';

// ---------------------------------------------------------------------------
// Assessment mocks
// ---------------------------------------------------------------------------

export const MOCK_SESSION_ID = 'session-e2e-001';
export const MOCK_CONFIG_ID = 'config-e2e-001';
export const MOCK_REPORT_ID = 'report-e2e-001';

export async function mockAssessmentFlow(page: Page): Promise<void> {
  await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });

  await mockApi(page, /\/api\/assessments\/sessions\/start/, {
    data: {
      sessionId: MOCK_SESSION_ID,
      pillar: 'leadership',
      timeLimitMin: 30,
      aiProctoring: false,
      questions: [
        {
          id: 'q1',
          dimensionId: 'vision',
          text: 'How effectively do you articulate a compelling vision for your team or organization?',
          options: [
            { id: 'opt_1', text: 'Not at all', value: 1 },
            { id: 'opt_2', text: 'Somewhat', value: 2 },
            { id: 'opt_3', text: 'Moderately', value: 3 },
            { id: 'opt_4', text: 'Very effectively', value: 4 },
            { id: 'opt_5', text: 'Exceptionally well', value: 5 },
          ],
        },
        {
          id: 'q2',
          dimensionId: 'vision',
          text: 'How well do you develop strategic plans that align with organizational goals?',
          options: [
            { id: 'opt_1', text: 'Not at all', value: 1 },
            { id: 'opt_2', text: 'Somewhat', value: 2 },
            { id: 'opt_3', text: 'Moderately', value: 3 },
            { id: 'opt_4', text: 'Very well', value: 4 },
            { id: 'opt_5', text: 'Exceptionally well', value: 5 },
          ],
        },
      ],
    },
  });

  await mockApi(page, new RegExp(`/api/assessments/sessions/${MOCK_SESSION_ID}$`), {
    data: {
      config: { timeLimitMin: 30 },
    },
  });

  await mockApi(
    page,
    new RegExp(`/api/assessments/sessions/${MOCK_SESSION_ID}/submit`),
    { data: { success: true } },
  );

  await mockApi(page, /\/api\/reports\/user\/list/, {
    data: [
      {
        id: MOCK_REPORT_ID,
        sessionId: MOCK_SESSION_ID,
        status: 'ready',
        createdAt: new Date().toISOString(),
        benchmarkPercentile: 78,
      },
    ],
  });

  await mockApi(page, new RegExp(`/api/reports/${MOCK_REPORT_ID}`), {
    data: {
      id: MOCK_REPORT_ID,
      status: 'ready',
      dimensionScores: { vision: 4.2, strategy: 3.8, communication: 4.5 },
      narrative: 'You demonstrate strong leadership capabilities across key dimensions.',
      benchmarkPercentile: 78,
      coachingPlan: {
        goals: [
          {
            goal: 'Strengthen strategic planning',
            actions: ['Attend strategy workshop', 'Shadow senior leader for one sprint'],
          },
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Hiring mocks
// ---------------------------------------------------------------------------

export async function mockHiringFlow(page: Page): Promise<void> {
  await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });

  await mockApi(page, /\/api\/hiring\/dashboard/, {
    data: {
      openPositions: 5,
      totalCandidates: 32,
      avgTimeToHire: '18 days',
      offerAcceptanceRate: 85,
      hiringTeamSize: 4,
      pipelineStages: {
        screening: 12,
        technical: 8,
        culture_fit: 5,
        offer: 3,
        hired: 2,
        rejected: 2,
      },
    },
  });

  await mockApi(page, /\/api\/hiring\/candidates/, {
    data: [
      {
        id: 'cand-001',
        name: 'Jane Doe',
        role: 'Software Engineer',
        stage: 'technical',
        technicalScore: 9,
        cultureFitScore: 8,
      },
      {
        id: 'cand-002',
        name: 'John Smith',
        role: 'Product Manager',
        stage: 'screening',
        technicalScore: 8,
        cultureFitScore: 7,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Reports mock (standalone)
// ---------------------------------------------------------------------------

export async function mockReports(page: Page): Promise<void> {
  await mockApi(page, /\/api\/auth\/tenant/, { data: { tenantId: 'tenant-001' } });
  await mockApi(page, /\/api\/reports\/user\/list/, {
    data: [
      {
        id: MOCK_REPORT_ID,
        sessionId: MOCK_SESSION_ID,
        status: 'ready',
        createdAt: new Date().toISOString(),
        benchmarkPercentile: 78,
      },
    ],
  });
  await mockApi(page, new RegExp(`/api/reports/${MOCK_REPORT_ID}`), {
    data: {
      id: MOCK_REPORT_ID,
      status: 'ready',
      dimensionScores: { vision: 4.2, strategy: 3.8 },
      narrative: 'Strong leadership profile.',
      benchmarkPercentile: 78,
      coachingPlan: { goals: [] },
    },
  });
}
