import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  const tenantId = 'tenant-1';
  const firebaseUid = 'firebase-uid-real-user';
  const internalUserId = 'usr-cuid-real-user';

  let prisma: any;
  let generator: any;
  let service: ReportingService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      aiReport: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      assessmentSession: { findUnique: jest.fn() },
    };
    generator = { generateInBackground: jest.fn() };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new ReportingService(prisma, generator, request);
  });

  describe('getReport', () => {
    it('resolves the internal User.id from firebaseUid before matching report ownership', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.aiReport.findUnique.mockResolvedValue({
        id: 'report-1',
        tenantId,
        userId: internalUserId,
      });

      const report = await service.getReport('report-1', firebaseUid);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { firebaseUid, tenantId },
      });
      expect(report.userId).toBe(internalUserId);
    });

    it('rejects when the report belongs to a different internal userId', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.aiReport.findUnique.mockResolvedValue({
        id: 'report-1',
        tenantId,
        userId: 'someone-else',
      });

      await expect(
        service.getReport('report-1', firebaseUid),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a firebaseUid with no matching User row', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.getReport('report-1', firebaseUid),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.aiReport.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('requestReportGeneration', () => {
    it('matches session ownership against the internal userId, not the firebaseUid', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'done',
      });
      prisma.aiReport.findUnique.mockResolvedValue(null);
      prisma.aiReport.create.mockResolvedValue({ id: 'report-1', status: 'pending' });

      await service.requestReportGeneration('sess-1', firebaseUid);

      const createArgs = prisma.aiReport.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe(internalUserId);
      expect(createArgs.data.userId).not.toBe(firebaseUid);
    });

    it('rejects when the session belongs to a different internal userId (regression: raw uid vs internal id no longer symmetric)', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: 'someone-else-internal-id',
        status: 'done',
      });

      await expect(
        service.requestReportGeneration('sess-1', firebaseUid),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.aiReport.create).not.toHaveBeenCalled();
    });

    it('returns the existing report without creating a duplicate', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.assessmentSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        tenantId,
        userId: internalUserId,
        status: 'done',
      });
      prisma.aiReport.findUnique.mockResolvedValue({ id: 'existing-report' });

      const result = await service.requestReportGeneration('sess-1', firebaseUid);

      expect(result).toEqual({ id: 'existing-report' });
      expect(prisma.aiReport.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a firebaseUid with no matching User row', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.requestReportGeneration('sess-1', firebaseUid),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.assessmentSession.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('listReports', () => {
    it('queries reports by the internal userId, not the raw firebaseUid', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: internalUserId });
      prisma.aiReport.findMany.mockResolvedValue([{ id: 'report-1' }]);

      await service.listReports(firebaseUid);

      expect(prisma.aiReport.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId: internalUserId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('throws NotFoundException for a firebaseUid with no matching User row', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.listReports(firebaseUid)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.aiReport.findMany).not.toHaveBeenCalled();
    });
  });
});
