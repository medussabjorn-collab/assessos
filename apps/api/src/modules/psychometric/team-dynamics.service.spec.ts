import { TeamDynamicsService } from './team-dynamics.service';

describe('TeamDynamicsService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: TeamDynamicsService;

  beforeEach(() => {
    prisma = { psychometricResult: { findMany: jest.fn() } };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new TeamDynamicsService(prisma, request);
  });

  it('queries only DISC results for the requested users, scoped to tenant', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([]);

    await service.predictTeamDynamics(['usr-1', 'usr-2']);

    expect(prisma.psychometricResult.findMany).toHaveBeenCalledWith({
      where: { tenantId, userId: { in: ['usr-1', 'usr-2'] }, modelKey: 'disc' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('flags users with no DISC data instead of silently dropping them', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      { userId: 'usr-1', interpretation: { primaryType: 'D' }, createdAt: new Date() },
    ]);

    const result = await service.predictTeamDynamics(['usr-1', 'usr-2']);

    expect(result.missingDiscData).toEqual(['usr-2']);
  });

  it('produces a friction note for two same-dimension D profiles', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      { userId: 'usr-1', interpretation: { primaryType: 'D' }, createdAt: new Date() },
      { userId: 'usr-2', interpretation: { primaryType: 'D' }, createdAt: new Date() },
    ]);

    const result = await service.predictTeamDynamics(['usr-1', 'usr-2']);

    expect(result.pairNotes).toHaveLength(1);
    expect(result.pairNotes[0].note).toMatch(/competing for control/i);
  });

  it('produces a complement note for a D-I pairing', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      { userId: 'usr-1', interpretation: { primaryType: 'D' }, createdAt: new Date() },
      { userId: 'usr-2', interpretation: { primaryType: 'I' }, createdAt: new Date() },
    ]);

    const result = await service.predictTeamDynamics(['usr-1', 'usr-2']);

    expect(result.pairNotes[0].note).toMatch(/complementary/i);
  });

  it('computes discDiversityScore as fraction of the 4 DISC types represented', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      { userId: 'usr-1', interpretation: { primaryType: 'D' }, createdAt: new Date() },
      { userId: 'usr-2', interpretation: { primaryType: 'I' }, createdAt: new Date() },
    ]);

    const result = await service.predictTeamDynamics(['usr-1', 'usr-2']);

    expect(result.discDiversityScore).toBe(0.5);
  });

  it('always includes the methodology disclaimer', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([]);

    const result = await service.predictTeamDynamics(['usr-1']);

    expect(result.methodologyNote).toMatch(/not a validated predictive model/i);
  });
});
