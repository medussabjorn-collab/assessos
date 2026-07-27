import { PerformanceForecastService } from './performance-forecast.service';

describe('PerformanceForecastService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: PerformanceForecastService;
  let now: number;

  beforeEach(() => {
    now = Date.now();
    prisma = {
      aiReport: { findMany: jest.fn().mockResolvedValue([]) },
      raterFeedback: { findMany: jest.fn().mockResolvedValue([]) },
      talentPredictionSnapshot: { create: jest.fn().mockResolvedValue({}) },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new PerformanceForecastService(prisma, request);
  });

  it('scopes both queries to tenant and userId', async () => {
    await service.computeForecast('usr-1');

    expect(prisma.aiReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId, userId: 'usr-1', status: 'ready' } }),
    );
    expect(prisma.raterFeedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, subjectId: 'usr-1', submittedAt: { not: null } },
      }),
    );
  });

  it('reports insufficient_data with no history at all', async () => {
    const result = await service.computeForecast('usr-1');

    expect(result.trajectory).toBe('insufficient_data');
    expect(result.factors.assessmentScoreTrend).toBe('insufficient_data');
    expect(result.factors.feedbackTrend).toBe('insufficient_data');
    expect(result.confidence).toBe('low');
  });

  it('reports improving when both assessment scores and feedback rise together', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 40 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 85 }, createdAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 2 }, submittedAt: new Date(now - 60 * 86_400_000) },
      { ratings: { vision: 4.5 }, submittedAt: new Date(now) },
    ]);

    const result = await service.computeForecast('usr-1');

    expect(result.factors.assessmentScoreTrend).toBe('improving');
    expect(result.factors.feedbackTrend).toBe('improving');
    expect(result.trajectory).toBe('improving');
  });

  it('reports stable (not a fabricated pick) when the two signals disagree', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 85 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 40 }, createdAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 2 }, submittedAt: new Date(now - 60 * 86_400_000) },
      { ratings: { vision: 4.5 }, submittedAt: new Date(now) },
    ]);

    const result = await service.computeForecast('usr-1');

    expect(result.factors.assessmentScoreTrend).toBe('declining');
    expect(result.factors.feedbackTrend).toBe('improving');
    expect(result.trajectory).toBe('stable');
  });

  it('falls back to the one available signal when the other has insufficient data', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 40 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 20 }, createdAt: new Date(now) },
    ]);

    const result = await service.computeForecast('usr-1');

    expect(result.factors.feedbackTrend).toBe('insufficient_data');
    expect(result.trajectory).toBe('declining');
  });

  it('flags medium confidence once there are at least 4 data points', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 40 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 50 }, createdAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 3 }, submittedAt: new Date(now - 30 * 86_400_000) },
      { ratings: { vision: 3.5 }, submittedAt: new Date(now) },
    ]);

    const result = await service.computeForecast('usr-1');

    expect(result.factors.dataPoints).toBe(4);
    expect(result.confidence).toBe('medium');
  });

  it('notes elevated retention risk in the methodology text when passed a high risk band', async () => {
    const result = await service.computeForecast('usr-1', 'high');

    expect(result.factors.elevatedRetentionRisk).toBe(true);
    expect(result.methodologyNote).toMatch(/retention-risk signal/i);
  });

  it('does not flag elevated retention risk for a low/medium band or when omitted', async () => {
    const low = await service.computeForecast('usr-1', 'low');
    expect(low.factors.elevatedRetentionRisk).toBe(false);

    const omitted = await service.computeForecast('usr-1');
    expect(omitted.factors.elevatedRetentionRisk).toBe(false);
  });

  it('never reports a numeric score projection — trajectory stays qualitative', async () => {
    const result = await service.computeForecast('usr-1');

    expect(typeof result.trajectory).toBe('string');
    expect(result.methodologyNote).toMatch(/not a trained or validated forecasting model/i);
  });

  it('persists a talent prediction snapshot on every compute', async () => {
    const result = await service.computeForecast('usr-1');

    expect(prisma.talentPredictionSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        userId: 'usr-1',
        predictionType: 'performance_forecast',
        result,
        methodologyVersion: 'heuristic-v1',
      }),
    });
  });
});
