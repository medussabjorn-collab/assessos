import { NotFoundException } from '@nestjs/common';
import { TalentOutcomeService } from './talent-outcome.service';

describe('TalentOutcomeService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: TalentOutcomeService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      talentOutcome: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new TalentOutcomeService(prisma, request);
  });

  describe('recordOutcome', () => {
    it('throws NotFoundException when the subject user is outside the tenant', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.recordOutcome(
          { userId: 'usr-1', outcomeType: 'promotion', occurredAt: '2026-01-01' },
          'usr-recorder',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.talentOutcome.create).not.toHaveBeenCalled();
    });

    it('records a promotion outcome scoped to the tenant with the recorder attributed', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
      prisma.talentOutcome.create.mockResolvedValue({ id: 'outcome-1' });

      await service.recordOutcome(
        {
          userId: 'usr-1',
          outcomeType: 'promotion',
          occurredAt: '2026-01-15',
          details: { newTitle: 'Senior Manager' },
          note: 'Promoted after Q4 review',
        },
        'usr-recorder',
      );

      expect(prisma.talentOutcome.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          userId: 'usr-1',
          outcomeType: 'promotion',
          occurredAt: new Date('2026-01-15'),
          details: { newTitle: 'Senior Manager' },
          note: 'Promoted after Q4 review',
          recordedById: 'usr-recorder',
        },
      });
    });

    it('records a departure outcome with no details/note', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
      prisma.talentOutcome.create.mockResolvedValue({ id: 'outcome-2' });

      await service.recordOutcome(
        { userId: 'usr-1', outcomeType: 'departure_voluntary', occurredAt: '2026-02-01' },
        'usr-recorder',
      );

      const createArgs = prisma.talentOutcome.create.mock.calls[0][0];
      expect(createArgs.data.outcomeType).toBe('departure_voluntary');
      expect(createArgs.data.details).toBeUndefined();
      expect(createArgs.data.note).toBeUndefined();
    });
  });

  describe('listForUser', () => {
    it('scopes to tenant and userId, ordered most-recent-first', async () => {
      prisma.talentOutcome.findMany.mockResolvedValue([]);

      await service.listForUser('usr-1');

      expect(prisma.talentOutcome.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId: 'usr-1' },
        orderBy: { occurredAt: 'desc' },
      });
    });
  });

  describe('listRecent', () => {
    it('scopes to tenant, defaults to 50, and includes the subject user', async () => {
      prisma.talentOutcome.findMany.mockResolvedValue([]);

      await service.listRecent();

      expect(prisma.talentOutcome.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { occurredAt: 'desc' },
        take: 50,
        include: { user: { select: { name: true, email: true } } },
      });
    });

    it('respects a custom limit', async () => {
      prisma.talentOutcome.findMany.mockResolvedValue([]);

      await service.listRecent(10);

      expect(prisma.talentOutcome.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
