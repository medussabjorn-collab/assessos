import { BiasAuditService } from './bias-audit.service';

describe('BiasAuditService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: BiasAuditService;

  beforeEach(() => {
    prisma = {
      candidate: { findMany: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new BiasAuditService(prisma, request);
  });

  function candidate(
    stage: 'offer' | 'hired' | 'rejected',
    selfId: { gender?: string; raceEthnicity?: string; ageBand?: string } | null,
  ) {
    return {
      stage,
      selfId: selfId
        ? {
            gender: selfId.gender ?? 'decline_to_state',
            raceEthnicity: selfId.raceEthnicity ?? 'decline_to_state',
            ageBand: selfId.ageBand ?? 'decline_to_state',
          }
        : null,
    };
  }

  it('only queries decided candidates (offer/hired/rejected), scoped to tenant', async () => {
    prisma.candidate.findMany.mockResolvedValue([]);

    await service.computeAdverseImpact();

    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      where: { tenantId, stage: { in: ['offer', 'hired', 'rejected'] } },
      include: { selfId: true },
    });
  });

  it('filters by jobRoleId when provided', async () => {
    prisma.candidate.findMany.mockResolvedValue([]);

    await service.computeAdverseImpact('software_engineer');

    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        jobRoleId: 'software_engineer',
        stage: { in: ['offer', 'hired', 'rejected'] },
      },
      include: { selfId: true },
    });
  });

  it('flags a group under the four-fifths threshold', async () => {
    // Group A: 8/10 selected (0.8 rate) — the max.
    // Group B: 3/10 selected (0.3 rate) — 0.3/0.8 = 0.375 < 0.8, flagged.
    const groupA = Array.from({ length: 10 }, (_, i) =>
      candidate(i < 8 ? 'hired' : 'rejected', { gender: 'male' }),
    );
    const groupB = Array.from({ length: 10 }, (_, i) =>
      candidate(i < 3 ? 'hired' : 'rejected', { gender: 'female' }),
    );
    prisma.candidate.findMany.mockResolvedValue([...groupA, ...groupB]);

    const report = await service.computeAdverseImpact();

    const male = report.dimensions.gender.find((g) => g.category === 'male');
    const female = report.dimensions.gender.find((g) => g.category === 'female');

    expect(male).toMatchObject({ total: 10, selected: 8, selectionRate: 0.8, flagged: false });
    expect(female).toMatchObject({
      total: 10,
      selected: 3,
      selectionRate: 0.3,
      impactRatio: 0.375,
      flagged: true,
    });
  });

  it('does not flag a group at or above the four-fifths threshold', async () => {
    const groupA = Array.from({ length: 10 }, (_, i) =>
      candidate(i < 10 ? 'hired' : 'rejected', { gender: 'male' }),
    );
    const groupB = Array.from({ length: 10 }, (_, i) =>
      candidate(i < 8 ? 'hired' : 'rejected', { gender: 'female' }),
    );
    prisma.candidate.findMany.mockResolvedValue([...groupA, ...groupB]);

    const report = await service.computeAdverseImpact();
    const female = report.dimensions.gender.find((g) => g.category === 'female');

    expect(female?.impactRatio).toBe(0.8);
    expect(female?.flagged).toBe(false);
  });

  it('suppresses groups smaller than the minimum cell size', async () => {
    const tiny = Array.from({ length: 3 }, () => candidate('hired', { gender: 'non_binary' }));
    prisma.candidate.findMany.mockResolvedValue(tiny);

    const report = await service.computeAdverseImpact();
    const nonBinary = report.dimensions.gender.find((g) => g.category === 'non_binary');

    expect(nonBinary).toEqual({ category: 'non_binary', total: 3, suppressed: true });
  });

  it('excludes decline_to_state and candidates with no self-ID from dimension breakdowns', async () => {
    const declined = Array.from({ length: 6 }, () =>
      candidate('hired', { gender: 'decline_to_state' }),
    );
    const noSelfId = Array.from({ length: 6 }, () => candidate('rejected', null));
    prisma.candidate.findMany.mockResolvedValue([...declined, ...noSelfId]);

    const report = await service.computeAdverseImpact();

    expect(report.dimensions.gender).toEqual([]);
    expect(report.decidedCandidateCount).toBe(12);
    expect(report.selfIdResponseRate).toBe(0.5);
  });

  it('computes selfIdResponseRate as fraction of decided candidates with self-ID data', async () => {
    const withId = Array.from({ length: 3 }, () => candidate('hired', { gender: 'male' }));
    const withoutId = Array.from({ length: 1 }, () => candidate('rejected', null));
    prisma.candidate.findMany.mockResolvedValue([...withId, ...withoutId]);

    const report = await service.computeAdverseImpact();

    expect(report.selfIdResponseRate).toBe(0.75);
  });

  it('returns 0 selfIdResponseRate and empty dimensions for no decided candidates', async () => {
    prisma.candidate.findMany.mockResolvedValue([]);

    const report = await service.computeAdverseImpact();

    expect(report.decidedCandidateCount).toBe(0);
    expect(report.selfIdResponseRate).toBe(0);
    expect(report.dimensions.gender).toEqual([]);
    expect(report.dimensions.raceEthnicity).toEqual([]);
    expect(report.dimensions.ageBand).toEqual([]);
  });
});
