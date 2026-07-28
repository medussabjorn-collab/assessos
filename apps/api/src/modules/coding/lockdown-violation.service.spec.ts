import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LockdownViolationService } from './lockdown-violation.service';

describe('LockdownViolationService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: LockdownViolationService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      lockdownViolation: { create: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new LockdownViolationService(prisma, request);
  });

  it('throws BadRequestException for an unknown violationType, before touching the DB', async () => {
    await expect(
      service.record('firebase-uid', 'coding:two-sum', 'made_up_violation'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.lockdownViolation.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for an unknown user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.record('firebase-uid', 'coding:two-sum', 'tab_switch'),
    ).rejects.toThrow(NotFoundException);
  });

  it('records a violation against the resolved internal userId', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
    prisma.lockdownViolation.create.mockResolvedValue({ id: 'violation-1' });

    await service.record('firebase-uid', 'coding:two-sum', 'devtools_opened');

    expect(prisma.lockdownViolation.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        userId: 'usr-1',
        context: 'coding:two-sum',
        violationType: 'devtools_opened',
      },
    });
  });
});
