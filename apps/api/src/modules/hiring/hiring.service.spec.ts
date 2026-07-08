import { HiringService } from './hiring.service';

describe('HiringService.getHiringAnalytics', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: HiringService;

  const day = (n: number) => new Date(2026, 0, n);

  beforeEach(() => {
    prisma = {
      candidate: { findMany: jest.fn() },
      hiringDecisionAudit: { findMany: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new HiringService(prisma, {} as any, {} as any, {} as any, request);
  });

  it('returns all-zero/null metrics for an empty pipeline, not fabricated numbers', async () => {
    prisma.candidate.findMany.mockResolvedValue([]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([]);

    const result = await service.getHiringAnalytics();

    expect(result.totalApplicants).toBe(0);
    expect(result.hiredCount).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.avgTimeToScreening).toBeNull();
    expect(result.topCandidatesSources).toEqual([]);
  });

  it('computes funnel counts from real candidate stages and audit transitions', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { id: 'c1', stage: 'hired', source: 'LinkedIn', createdAt: day(1) },
      { id: 'c2', stage: 'rejected', source: 'Referral', createdAt: day(1) },
      { id: 'c3', stage: 'screening', source: 'LinkedIn', createdAt: day(1) },
    ]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([
      { candidateId: 'c1', fromStage: 'screening', toStage: 'technical', decidedAt: day(3) },
      { candidateId: 'c1', fromStage: 'technical', toStage: 'culture_fit', decidedAt: day(10) },
      { candidateId: 'c1', fromStage: 'culture_fit', toStage: 'offer', decidedAt: day(15) },
      { candidateId: 'c1', fromStage: 'offer', toStage: 'hired', decidedAt: day(20) },
      { candidateId: 'c2', fromStage: 'screening', toStage: 'rejected', decidedAt: day(2) },
    ]);

    const result = await service.getHiringAnalytics();

    expect(result.totalApplicants).toBe(3);
    expect(result.hiredCount).toBe(1);
    // c1 advanced from screening; c2's screening->rejected doesn't count as "passed"
    expect(result.screenedCount).toBe(1);
    expect(result.technicalPassCount).toBe(1);
    expect(result.cultureFitPassCount).toBe(1);
    expect(result.offerCount).toBe(1);
    expect(result.conversionRate).toBeCloseTo(33.3, 1);
  });

  it('computes avgTimeToScreening from Candidate.createdAt to the first stage transition', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { id: 'c1', stage: 'technical', source: null, createdAt: day(1) },
    ]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([
      { candidateId: 'c1', fromStage: 'screening', toStage: 'technical', decidedAt: day(4) },
    ]);

    const result = await service.getHiringAnalytics();

    expect(result.avgTimeToScreening).toBe(3);
  });

  it('computes avgTimeTechnical as days between the screening-exit and technical-exit transitions', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { id: 'c1', stage: 'culture_fit', source: null, createdAt: day(1) },
    ]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([
      { candidateId: 'c1', fromStage: 'screening', toStage: 'technical', decidedAt: day(3) },
      { candidateId: 'c1', fromStage: 'technical', toStage: 'culture_fit', decidedAt: day(10) },
    ]);

    const result = await service.getHiringAnalytics();

    expect(result.avgTimeTechnical).toBe(7);
  });

  it('groups candidates without a source under "unspecified" instead of dropping them', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { id: 'c1', stage: 'screening', source: null, createdAt: day(1) },
      { id: 'c2', stage: 'hired', source: 'LinkedIn', createdAt: day(1) },
    ]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([]);

    const result = await service.getHiringAnalytics();

    expect(result.topCandidatesSources).toContainEqual({
      source: 'unspecified',
      count: 1,
      hired: 0,
    });
    expect(result.topCandidatesSources).toContainEqual({
      source: 'LinkedIn',
      count: 1,
      hired: 1,
    });
  });

  it('sorts topCandidatesSources by count descending', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { id: 'c1', stage: 'screening', source: 'A', createdAt: day(1) },
      { id: 'c2', stage: 'screening', source: 'B', createdAt: day(1) },
      { id: 'c3', stage: 'screening', source: 'B', createdAt: day(1) },
    ]);
    prisma.hiringDecisionAudit.findMany.mockResolvedValue([]);

    const result = await service.getHiringAnalytics();

    expect(result.topCandidatesSources[0]).toEqual({ source: 'B', count: 2, hired: 0 });
  });
});
