import { NotFoundException } from '@nestjs/common';
import { CandidateService } from './candidate.service';

describe('CandidateService.updateCandidateStage — bias-audit trail', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let jobRoleService: any;
  let service: CandidateService;

  beforeEach(() => {
    prisma = {
      candidate: { findFirst: jest.fn(), update: jest.fn() },
      hiringDecisionAudit: { create: jest.fn() },
    };
    jobRoleService = {};
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new CandidateService(prisma, jobRoleService, request);
  });

  it('records an immutable audit row with a score snapshot on every stage transition', async () => {
    prisma.candidate.findFirst.mockResolvedValue({
      id: 'cand-1',
      tenantId,
      stage: 'screening',
    });
    prisma.candidate.update.mockResolvedValue({
      id: 'cand-1',
      stage: 'technical',
      technicalScore: 4.2,
      cultureFitScore: null,
    });

    await service.updateCandidateStage('cand-1', 'technical');

    expect(prisma.hiringDecisionAudit.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        candidateId: 'cand-1',
        fromStage: 'screening',
        toStage: 'technical',
        outcome: 'advanced',
        technicalScore: 4.2,
        cultureFitScore: null,
      },
    });
  });

  it('records outcome "rejected" when the transition moves a candidate to rejected', async () => {
    prisma.candidate.findFirst.mockResolvedValue({
      id: 'cand-1',
      tenantId,
      stage: 'technical',
    });
    prisma.candidate.update.mockResolvedValue({
      id: 'cand-1',
      stage: 'rejected',
      technicalScore: 2.1,
      cultureFitScore: 2.0,
    });

    await service.updateCandidateStage('cand-1', 'rejected');

    const auditArgs = prisma.hiringDecisionAudit.create.mock.calls[0][0];
    expect(auditArgs.data.outcome).toBe('rejected');
  });

  it('records outcome "advanced" for offer/hired transitions', async () => {
    prisma.candidate.findFirst.mockResolvedValue({
      id: 'cand-1',
      tenantId,
      stage: 'offer',
    });
    prisma.candidate.update.mockResolvedValue({
      id: 'cand-1',
      stage: 'hired',
      technicalScore: 4.8,
      cultureFitScore: 4.5,
    });

    await service.updateCandidateStage('cand-1', 'hired');

    const auditArgs = prisma.hiringDecisionAudit.create.mock.calls[0][0];
    expect(auditArgs.data.outcome).toBe('advanced');
  });

  it('does not write an audit row when the candidate is not found', async () => {
    prisma.candidate.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCandidateStage('missing', 'technical'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.hiringDecisionAudit.create).not.toHaveBeenCalled();
  });
});
