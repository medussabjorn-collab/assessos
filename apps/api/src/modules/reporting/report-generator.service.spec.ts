import { ReportGeneratorService } from './report-generator.service';

describe('ReportGeneratorService — score-threshold webhook', () => {
  let prisma: any;
  let webhookDispatch: any;
  let service: ReportGeneratorService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    prisma = {
      aiReport: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
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
        configId: 'cfg-1',
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

describe('ReportGeneratorService — benchmarkPercentile', () => {
  let prisma: any;
  let webhookDispatch: any;
  let service: ReportGeneratorService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    prisma = {
      aiReport: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
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
        configId: 'cfg-1',
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

  it('stores null when there are no peer reports on the same config yet', async () => {
    mockReportAndClaudeResponse({ vision: 80, execution: 80 });
    prisma.aiReport.findMany.mockResolvedValue([]);

    await service.generateInBackground('report-1');

    expect(prisma.aiReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ benchmarkPercentile: null }) }),
    );
  });

  it('ranks the report above lower-scoring peers on the same config', async () => {
    mockReportAndClaudeResponse({ vision: 90, execution: 90 });
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 50, execution: 50 } },
      { dimensionScores: { vision: 60, execution: 60 } },
      { dimensionScores: { vision: 70, execution: 70 } },
    ]);

    await service.generateInBackground('report-1');

    expect(prisma.aiReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ benchmarkPercentile: 100 }) }),
    );
  });

  it('splits credit for peers tied on the same average score', async () => {
    mockReportAndClaudeResponse({ vision: 70, execution: 70 });
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 70, execution: 70 } },
      { dimensionScores: { vision: 50, execution: 50 } },
    ]);

    await service.generateInBackground('report-1');

    // 1 below (50) + 0.5 tied (70) out of 2 peers = 75th percentile.
    expect(prisma.aiReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ benchmarkPercentile: 75 }) }),
    );
  });

  it('scopes peer lookup to the same tenant, ready status, and configId', async () => {
    mockReportAndClaudeResponse({ vision: 80 });
    prisma.aiReport.findMany.mockResolvedValue([]);

    await service.generateInBackground('report-1');

    expect(prisma.aiReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: 'ready',
          id: { not: 'report-1' },
          session: { configId: 'cfg-1' },
        }),
      }),
    );
  });
});
