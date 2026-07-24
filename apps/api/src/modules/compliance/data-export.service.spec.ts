import { NotFoundException } from '@nestjs/common';
import { DataExportService } from './data-export.service';

describe('DataExportService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: DataExportService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      assessmentSession: { findMany: jest.fn().mockResolvedValue([]) },
      aiReport: { findMany: jest.fn().mockResolvedValue([]) },
      psychometricResult: { findMany: jest.fn().mockResolvedValue([]) },
      raterFeedback: { findMany: jest.fn().mockResolvedValue([]) },
      decisionReviewRequest: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new DataExportService(prisma, request);
  });

  it('throws NotFoundException for an unknown user', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.exportForUser('firebase-uid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('scopes every query to the resolved internal userId, not the firebase uid', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'usr-1',
      email: 'jane@example.com',
      name: 'Jane',
      role: { name: 'employee' },
      department: 'Eng',
      createdAt: new Date('2026-01-01'),
    });

    await service.exportForUser('firebase-uid');

    expect(prisma.assessmentSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'usr-1' },
    });
    expect(prisma.aiReport.findMany).toHaveBeenCalledWith({ where: { userId: 'usr-1' } });
    expect(prisma.psychometricResult.findMany).toHaveBeenCalledWith({
      where: { userId: 'usr-1' },
    });
    expect(prisma.raterFeedback.findMany).toHaveBeenCalledWith({
      where: { subjectId: 'usr-1' },
    });
  });

  it('strips rater identity from anonymous feedback in the subject\'s own export', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1', email: 'a@b.com', name: 'A', role: { name: 'employee' } });
    prisma.raterFeedback.findMany.mockResolvedValue([
      {
        id: 'fb-1',
        sessionId: 'sess-1',
        relationship: 'peer',
        ratings: { vision: 4 },
        comments: 'Great work',
        submittedAt: new Date(),
        createdAt: new Date(),
        isAnonymous: true,
        raterId: 'usr-secret-rater',
      },
    ]);

    const result = await service.exportForUser('firebase-uid');

    expect(result.feedbackReceived[0]).not.toHaveProperty('raterId');
  });

  it('includes rater identity when feedback is explicitly non-anonymous', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'usr-1', email: 'a@b.com', name: 'A', role: { name: 'employee' } });
    prisma.raterFeedback.findMany.mockResolvedValue([
      {
        id: 'fb-1',
        sessionId: 'sess-1',
        relationship: 'manager',
        ratings: { vision: 4 },
        comments: null,
        submittedAt: new Date(),
        createdAt: new Date(),
        isAnonymous: false,
        raterId: 'usr-manager',
      },
    ]);

    const result = await service.exportForUser('firebase-uid');

    expect(result.feedbackReceived[0].raterId).toBe('usr-manager');
  });
});
