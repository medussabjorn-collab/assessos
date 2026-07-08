import { CompositeProfileService } from './composite-profile.service';

describe('CompositeProfileService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: CompositeProfileService;

  beforeEach(() => {
    prisma = { psychometricResult: { findMany: jest.fn() } };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new CompositeProfileService(prisma, request);
  });

  it('scopes the query to tenant and user', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([]);

    await service.getCompositeProfile('usr-1');

    expect(prisma.psychometricResult.findMany).toHaveBeenCalledWith({
      where: { tenantId, userId: 'usr-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns one profile per model, taking the latest when a model was retaken', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      {
        modelKey: 'disc',
        scores: { D: 80 },
        interpretation: { primaryType: 'D' },
        createdAt: new Date('2026-02-01'),
      },
      {
        modelKey: 'disc',
        scores: { D: 60 },
        interpretation: { primaryType: 'D' },
        createdAt: new Date('2026-01-01'),
      },
      {
        modelKey: 'big_five',
        scores: { openness: 5 },
        interpretation: {},
        createdAt: new Date('2026-01-15'),
      },
    ]);

    const result = await service.getCompositeProfile('usr-1');

    expect(result.profiles).toHaveLength(2);
    const disc = result.profiles.find((p) => p.modelKey === 'disc');
    expect(disc?.scores).toEqual({ D: 80 });
  });

  it('does not fabricate a cross-model composite score', async () => {
    prisma.psychometricResult.findMany.mockResolvedValue([
      { modelKey: 'disc', scores: { D: 80 }, interpretation: {}, createdAt: new Date() },
      { modelKey: 'big_five', scores: { openness: 5 }, interpretation: {}, createdAt: new Date() },
    ]);

    const result = await service.getCompositeProfile('usr-1');

    expect(result).not.toHaveProperty('compositeScore');
    expect(result).not.toHaveProperty('crossModelMapping');
  });
});
