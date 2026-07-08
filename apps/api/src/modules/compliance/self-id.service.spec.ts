import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SelfIdService } from './self-id.service';

describe('SelfIdService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: SelfIdService;

  beforeEach(() => {
    prisma = {
      candidate: { findFirst: jest.fn() },
      candidateSelfId: { upsert: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new SelfIdService(prisma, request);
  });

  it('rejects submission for a candidate not in this tenant', async () => {
    prisma.candidate.findFirst.mockResolvedValue(null);

    await expect(
      service.submit('cand-1', { gender: 'female' as any }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.candidateSelfId.upsert).not.toHaveBeenCalled();
  });

  it('upserts with decline_to_state defaults for omitted fields', async () => {
    prisma.candidate.findFirst.mockResolvedValue({ id: 'cand-1', tenantId });
    prisma.candidateSelfId.upsert.mockResolvedValue({ id: 'self-1' });

    await service.submit('cand-1', { gender: 'female' as any });

    expect(prisma.candidateSelfId.upsert).toHaveBeenCalledWith({
      where: { candidateId: 'cand-1' },
      create: {
        tenantId,
        candidateId: 'cand-1',
        gender: 'female',
        raceEthnicity: 'decline_to_state',
        ageBand: 'decline_to_state',
      },
      update: {
        gender: 'female',
        raceEthnicity: 'decline_to_state',
        ageBand: 'decline_to_state',
        submittedAt: expect.any(Date),
      },
    });
  });

  it('defaults every field to decline_to_state when none provided', async () => {
    prisma.candidate.findFirst.mockResolvedValue({ id: 'cand-1', tenantId });
    prisma.candidateSelfId.upsert.mockResolvedValue({ id: 'self-1' });

    await service.submit('cand-1', {});

    const createArgs = prisma.candidateSelfId.upsert.mock.calls[0][0].create;
    expect(createArgs.gender).toBe('decline_to_state');
    expect(createArgs.raceEthnicity).toBe('decline_to_state');
    expect(createArgs.ageBand).toBe('decline_to_state');
  });

  describe('jurisdiction gate', () => {
    it('blocks submission for an EU candidate (e.g. Germany)', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: 'DE',
        usState: null,
      });

      await expect(
        service.submit('cand-1', { gender: 'female' as any }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.candidateSelfId.upsert).not.toHaveBeenCalled();
    });

    it('blocks submission for an EEA candidate (e.g. Norway) even though not an EU member', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: 'NO',
        usState: null,
      });

      await expect(service.submit('cand-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('blocks submission for a California candidate', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: 'US',
        usState: 'CA',
      });

      await expect(service.submit('cand-1', {})).rejects.toThrow(ForbiddenException);
      expect(prisma.candidateSelfId.upsert).not.toHaveBeenCalled();
    });

    it('allows submission for a non-California US candidate', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: 'US',
        usState: 'TX',
      });
      prisma.candidateSelfId.upsert.mockResolvedValue({ id: 'self-1' });

      await expect(service.submit('cand-1', {})).resolves.toBeDefined();
    });

    it('allows submission when country is unknown (residual gap, not a clearance)', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: null,
        usState: null,
      });
      prisma.candidateSelfId.upsert.mockResolvedValue({ id: 'self-1' });

      await expect(service.submit('cand-1', {})).resolves.toBeDefined();
    });

    it('allows submission for a non-EU/EEA, non-US country', async () => {
      prisma.candidate.findFirst.mockResolvedValue({
        id: 'cand-1',
        tenantId,
        country: 'CA', // Canada — not to be confused with California
        usState: null,
      });
      prisma.candidateSelfId.upsert.mockResolvedValue({ id: 'self-1' });

      await expect(service.submit('cand-1', {})).resolves.toBeDefined();
    });
  });
});
