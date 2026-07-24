import { NotFoundException } from '@nestjs/common';
import { ScenarioReviewService } from './scenario-review.service';

describe('ScenarioReviewService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: ScenarioReviewService;

  beforeEach(() => {
    prisma = {
      generatedScenario: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ScenarioReviewService(prisma, request);
  });

  it('lists only pending_review scenarios scoped to tenant', async () => {
    prisma.generatedScenario.findMany.mockResolvedValue([]);

    await service.listPendingReview();

    expect(prisma.generatedScenario.findMany).toHaveBeenCalledWith({
      where: { tenantId, status: 'pending_review' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('approves a scenario, stamping reviewer and timestamp', async () => {
    prisma.generatedScenario.findFirst.mockResolvedValue({ id: 'scenario-1', tenantId });
    prisma.generatedScenario.update.mockResolvedValue({ id: 'scenario-1', status: 'approved' });

    await service.approve('scenario-1', 'admin-1');

    expect(prisma.generatedScenario.update).toHaveBeenCalledWith({
      where: { id: 'scenario-1' },
      data: { status: 'approved', reviewedById: 'admin-1', reviewedAt: expect.any(Date) },
    });
  });

  it('rejects a scenario with a reason', async () => {
    prisma.generatedScenario.findFirst.mockResolvedValue({ id: 'scenario-1', tenantId });
    prisma.generatedScenario.update.mockResolvedValue({ id: 'scenario-1', status: 'rejected' });

    await service.reject('scenario-1', 'admin-1', 'Scenario too generic');

    expect(prisma.generatedScenario.update).toHaveBeenCalledWith({
      where: { id: 'scenario-1' },
      data: {
        status: 'rejected',
        reviewedById: 'admin-1',
        reviewedAt: expect.any(Date),
        rejectionReason: 'Scenario too generic',
      },
    });
  });

  it('throws NotFoundException approving a scenario outside this tenant', async () => {
    prisma.generatedScenario.findFirst.mockResolvedValue(null);

    await expect(service.approve('scenario-1', 'admin-1')).rejects.toThrow(NotFoundException);
    expect(prisma.generatedScenario.update).not.toHaveBeenCalled();
  });
});
