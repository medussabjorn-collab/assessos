import { PromotionReadinessService } from './promotion-readiness.service';
import { LeadershipIndexService } from './leadership-index.service';

describe('PromotionReadinessService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let leadershipIndex: LeadershipIndexService;
  let service: PromotionReadinessService;
  let now: number;

  beforeEach(() => {
    now = Date.now();
    prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ createdAt: new Date(now) }) },
      aiReport: { findMany: jest.fn().mockResolvedValue([]) },
      raterFeedback: { findMany: jest.fn().mockResolvedValue([]) },
      talentPredictionSnapshot: { create: jest.fn().mockResolvedValue({}) },
    };
    leadershipIndex = new LeadershipIndexService();
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new PromotionReadinessService(prisma, leadershipIndex, request);
  });

  it('scopes queries to tenant and userId', async () => {
    await service.computeReadiness('usr-1');

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'usr-1', tenantId } }),
    );
    expect(prisma.aiReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId, userId: 'usr-1', status: 'ready' } }),
    );
  });

  it('returns a low score with zero tenure and no reports/feedback', async () => {
    prisma.user.findFirst.mockResolvedValue({ createdAt: new Date(now) });

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.tenureDays).toBe(0);
    expect(result.factors.leadershipIndex).toBeNull();
    expect(result.readinessScore).toBe(0);
    expect(result.tier).toBe('not_ready');
  });

  it('scores full tenure credit after the 365-day floor', async () => {
    prisma.user.findFirst.mockResolvedValue({ createdAt: new Date(now - 400 * 86_400_000) });

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.tenureDays).toBe(400);
  });

  it('uses the latest report as the leadership-index factor and reflects a high composite score', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 90, execution: 90 }, createdAt: new Date(now) },
    ]);

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.leadershipIndex).toBe(90);
  });

  it('detects an improving leadership-score trend across reports', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 50 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 55 }, createdAt: new Date(now - 40 * 86_400_000) },
      { dimensionScores: { vision: 85 }, createdAt: new Date(now - 10 * 86_400_000) },
      { dimensionScores: { vision: 90 }, createdAt: new Date(now) },
    ]);

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.leadershipTrend).toBe('improving');
  });

  it('marks trend insufficient_data with fewer than 2 reports', async () => {
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 50 }, createdAt: new Date(now) },
    ]);

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.leadershipTrend).toBe('insufficient_data');
  });

  it('averages the most recent feedback ratings on a 0-5 scale', async () => {
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 4, execution: 4 }, submittedAt: new Date(now) },
      { ratings: { vision: 5, execution: 5 }, submittedAt: new Date(now - 5 * 86_400_000) },
    ]);

    const result = await service.computeReadiness('usr-1');

    expect(result.factors.recentFeedbackAvg).toBe(4.5);
  });

  it('assigns ready_now tier for a strong composite across every signal', async () => {
    prisma.user.findFirst.mockResolvedValue({ createdAt: new Date(now - 500 * 86_400_000) });
    prisma.aiReport.findMany.mockResolvedValue([
      { dimensionScores: { vision: 80 }, createdAt: new Date(now - 60 * 86_400_000) },
      { dimensionScores: { vision: 95 }, createdAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 5 }, submittedAt: new Date(now) },
    ]);

    const result = await service.computeReadiness('usr-1');

    expect(result.tier).toBe('ready_now');
  });

  it('always includes the not-a-trained-model disclaimer', async () => {
    const result = await service.computeReadiness('usr-1');

    expect(result.methodologyNote).toMatch(/not a trained or validated predictive model/i);
  });

  it('persists a talent prediction snapshot on every compute', async () => {
    const result = await service.computeReadiness('usr-1');

    expect(prisma.talentPredictionSnapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        userId: 'usr-1',
        predictionType: 'promotion_readiness',
        result,
        methodologyVersion: 'heuristic-v1',
      }),
    });
  });
});
