import { ReportGeneratorService } from './report-generator.service';

describe('ReportGeneratorService — score-threshold webhook', () => {
  let prisma: any;
  let webhookDispatch: any;
  let service: ReportGeneratorService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    prisma = {
      aiReport: { findUnique: jest.fn(), update: jest.fn() },
    };
    webhookDispatch = { dispatch: jest.fn() };
    service = new ReportGeneratorService(prisma, webhookDispatch);
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  function mockReportAndClaudeResponse(dimensionScores: Record<string, number>) {
    prisma.aiReport.findUnique.mockResolvedValue({
      id: 'report-1',
      tenantId: 'tenant-1',
      userId: 'usr-1',
      session: {
        config: { dimensions: [] },
        answers: [],
        answersMetadata: {},
      },
    });
    prisma.aiReport.update.mockResolvedValue({});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              dimensionScores,
              narrative: 'n',
              recommendation: 'r',
              coachingPlan: { goals: [] },
            }),
          },
        ],
      }),
    }) as any;
  }

  it('dispatches score_threshold_crossed as "high" for a high-scoring report', async () => {
    mockReportAndClaudeResponse({ vision: 90, execution: 88 });

    await service.generateInBackground('report-1');

    expect(webhookDispatch.dispatch).toHaveBeenCalledWith(
      'tenant-1',
      'report.score_threshold_crossed',
      expect.objectContaining({ reportId: 'report-1', userId: 'usr-1', threshold: 'high' }),
    );
  });

  it('dispatches score_threshold_crossed as "low" for a low-scoring report', async () => {
    mockReportAndClaudeResponse({ vision: 20, execution: 25 });

    await service.generateInBackground('report-1');

    expect(webhookDispatch.dispatch).toHaveBeenCalledWith(
      'tenant-1',
      'report.score_threshold_crossed',
      expect.objectContaining({ threshold: 'low' }),
    );
  });

  it('does not dispatch for a mid-range score', async () => {
    mockReportAndClaudeResponse({ vision: 60, execution: 65 });

    await service.generateInBackground('report-1');

    expect(webhookDispatch.dispatch).not.toHaveBeenCalled();
  });
});
