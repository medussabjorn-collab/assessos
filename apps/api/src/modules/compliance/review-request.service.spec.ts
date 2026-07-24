import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewRequestService } from './review-request.service';

describe('ReviewRequestService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: ReviewRequestService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      aiReport: { findFirst: jest.fn() },
      decisionReviewRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ReviewRequestService(prisma, request);
  });

  describe('requestReview', () => {
    it('creates a review request for the report subject', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
      prisma.aiReport.findFirst.mockResolvedValue({ id: 'report-1', userId: 'usr-1' });
      prisma.decisionReviewRequest.create.mockResolvedValue({ id: 'req-1' });

      await service.requestReview('report-1', 'firebase-uid', 'Score seems off');

      expect(prisma.decisionReviewRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          reportId: 'report-1',
          requestedById: 'usr-1',
          reason: 'Score seems off',
        },
      });
    });

    it('rejects a review request for someone else\'s report', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'usr-2' });
      prisma.aiReport.findFirst.mockResolvedValue({ id: 'report-1', userId: 'usr-1' });

      await expect(
        service.requestReview('report-1', 'firebase-uid'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.decisionReviewRequest.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a report outside this tenant', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'usr-1' });
      prisma.aiReport.findFirst.mockResolvedValue(null);

      await expect(
        service.requestReview('report-1', 'firebase-uid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('marks a review request resolved with a note and resolver', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'admin-1' });
      prisma.decisionReviewRequest.findFirst.mockResolvedValue({ id: 'req-1', tenantId });
      prisma.decisionReviewRequest.update.mockResolvedValue({ id: 'req-1', status: 'resolved' });

      await service.resolve('req-1', 'admin-firebase-uid', 'Reviewed, score confirmed accurate');

      expect(prisma.decisionReviewRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          status: 'resolved',
          resolvedById: 'admin-1',
          resolutionNote: 'Reviewed, score confirmed accurate',
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('throws NotFoundException for a review request outside this tenant', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'admin-1' });
      prisma.decisionReviewRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.resolve('req-1', 'admin-firebase-uid', 'note'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPending', () => {
    it('only queries pending/in_review requests scoped to tenant', async () => {
      prisma.decisionReviewRequest.findMany.mockResolvedValue([]);

      await service.listPending();

      expect(prisma.decisionReviewRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: { in: ['pending', 'in_review'] } },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
