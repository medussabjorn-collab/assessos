import { RetentionRiskService } from './retention-risk.service';

describe('RetentionRiskService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: RetentionRiskService;
  let now: number;

  beforeEach(() => {
    now = Date.now();
    prisma = {
      assessmentSession: { findMany: jest.fn().mockResolvedValue([]) },
      raterFeedback: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new RetentionRiskService(prisma, request);
  });

  it('scopes both queries to tenant and userId', async () => {
    await service.computeRiskScore('usr-1');

    expect(prisma.assessmentSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId, userId: 'usr-1' } }),
    );
    expect(prisma.raterFeedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, subjectId: 'usr-1', submittedAt: { not: null } },
      }),
    );
  });

  it('returns max inactivity signal when there is no activity at all (weight redistributes without feedback data)', async () => {
    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.daysSinceLastActivity).toBeNull();
    expect(result.factors.feedbackTrend).toBe('insufficient_data');
    // No feedback data → feedbackDecline weight (0.3) redistributes to
    // inactivity (0.6) + abandonment (0.4). Max inactivity, zero
    // abandonment (no sessions at all) → 100 * 0.6 = 60.
    expect(result.riskScore).toBe(60);
    expect(result.riskBand).toBe('medium');
  });

  it('returns low risk for a recently active, non-abandoning user', async () => {
    prisma.assessmentSession.findMany.mockResolvedValue([
      { status: 'done', createdAt: new Date(now - 5 * 86_400_000), submittedAt: new Date(now - 2 * 86_400_000) },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.daysSinceLastActivity).toBe(2);
    expect(result.riskBand).toBe('low');
  });

  it('factors in abandoned (stale, still-active) sessions', async () => {
    prisma.assessmentSession.findMany.mockResolvedValue([
      { status: 'active', createdAt: new Date(now - 30 * 86_400_000), submittedAt: null },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.incompleteSessionRatio).toBe(1);
  });

  it('does not count a recently-started active session as abandoned', async () => {
    prisma.assessmentSession.findMany.mockResolvedValue([
      { status: 'active', createdAt: new Date(now - 1 * 86_400_000), submittedAt: null },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.incompleteSessionRatio).toBe(0);
  });

  it('marks feedback trend insufficient_data with fewer than 2 feedback entries', async () => {
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 4 }, submittedAt: new Date(now) },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.feedbackTrend).toBe('insufficient_data');
  });

  it('detects a declining feedback rating trend', async () => {
    prisma.assessmentSession.findMany.mockResolvedValue([
      { status: 'done', createdAt: new Date(now), submittedAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 5, execution: 5 }, submittedAt: new Date(now - 60 * 86_400_000) },
      { ratings: { vision: 5, execution: 4 }, submittedAt: new Date(now - 50 * 86_400_000) },
      { ratings: { vision: 2, execution: 2 }, submittedAt: new Date(now - 10 * 86_400_000) },
      { ratings: { vision: 2, execution: 1 }, submittedAt: new Date(now - 5 * 86_400_000) },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.feedbackTrend).toBe('declining');
  });

  it('detects an improving feedback rating trend', async () => {
    prisma.assessmentSession.findMany.mockResolvedValue([
      { status: 'done', createdAt: new Date(now), submittedAt: new Date(now) },
    ]);
    prisma.raterFeedback.findMany.mockResolvedValue([
      { ratings: { vision: 2 }, submittedAt: new Date(now - 60 * 86_400_000) },
      { ratings: { vision: 2 }, submittedAt: new Date(now - 50 * 86_400_000) },
      { ratings: { vision: 5 }, submittedAt: new Date(now - 10 * 86_400_000) },
      { ratings: { vision: 5 }, submittedAt: new Date(now - 5 * 86_400_000) },
    ]);

    const result = await service.computeRiskScore('usr-1');

    expect(result.factors.feedbackTrend).toBe('improving');
  });

  it('always includes the not-a-trained-model disclaimer', async () => {
    const result = await service.computeRiskScore('usr-1');

    expect(result.methodologyNote).toMatch(/not a trained or validated predictive model/i);
  });
});
