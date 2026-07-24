import { NotFoundException } from '@nestjs/common';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  const tenantId = 'tenant-1';
  const userId = 'usr-1';

  let prisma: any;
  let proctoring: any;
  let service: IdentityService;

  beforeEach(() => {
    prisma = {
      identityVerification: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      assessmentSession: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    proctoring = { logEvent: jest.fn().mockResolvedValue(undefined) };
    service = new IdentityService(prisma, proctoring);
  });

  describe('submitVerification — computeStatus', () => {
    it('marks verified when document, liveness, and a strong face match all pass', async () => {
      prisma.identityVerification.create.mockImplementation(({ data }: any) => data);

      const result = await service.submitVerification(tenantId, userId, {
        documentVerified: true,
        documentScore: 0.9,
        faceMatchScore: 0.9,
        livenessPassed: true,
      });

      expect(result.status).toBe('verified');
    });

    it('hard-fails on a confident face-match mismatch regardless of other signals', async () => {
      prisma.identityVerification.create.mockImplementation(({ data }: any) => data);

      const result = await service.submitVerification(tenantId, userId, {
        documentVerified: true,
        documentScore: 0.9,
        faceMatchScore: 0.5,
        livenessPassed: true,
      });

      expect(result.status).toBe('failed');
    });

    it('flags manual_review when the document looks tampered (low authenticity score)', async () => {
      prisma.identityVerification.create.mockImplementation(({ data }: any) => data);

      const result = await service.submitVerification(tenantId, userId, {
        documentVerified: true,
        documentScore: 0.3,
        faceMatchScore: 0.9,
        livenessPassed: true,
      });

      expect(result.status).toBe('manual_review');
    });

    it('returns pending when no verification evidence is submitted at all', async () => {
      prisma.identityVerification.create.mockImplementation(({ data }: any) => data);

      const result = await service.submitVerification(tenantId, userId, {});

      expect(result.status).toBe('pending');
    });
  });

  describe('isVerifiedForSession / isVerifiedForUser', () => {
    it('isVerifiedForSession is true only when a verified record exists for that exact session', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue({ id: 'idv-1', status: 'verified' });

      const result = await service.isVerifiedForSession(tenantId, 'sess-1');

      expect(result).toBe(true);
      expect(prisma.identityVerification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, sessionId: 'sess-1', status: 'verified' } }),
      );
    });

    it('isVerifiedForUser checks across all sessions for the user, not one session', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue({ id: 'idv-1', status: 'verified' });

      const result = await service.isVerifiedForUser(tenantId, userId);

      expect(result).toBe(true);
      expect(prisma.identityVerification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, userId, status: 'verified' } }),
      );
    });

    it('returns false when no verified record is found', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue(null);

      expect(await service.isVerifiedForUser(tenantId, userId)).toBe(false);
    });
  });

  describe('bindSession / checkBinding / revokeSession', () => {
    it('bindSession stores the device/IP/biometric hashes and clears any prior revocation', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue({ id: 'sess-1' });
      prisma.assessmentSession.update.mockResolvedValue({ id: 'sess-1' });

      await service.bindSession(tenantId, 'sess-1', {
        deviceId: 'device-a',
        ipHash: 'ip-hash-a',
        biometricHash: 'bio-hash-a',
      });

      expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: {
          deviceId: 'device-a',
          ipHash: 'ip-hash-a',
          biometricHash: 'bio-hash-a',
          proctoringRevoked: false,
        },
      });
    });

    it('bindSession throws NotFoundException for a session outside the tenant', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue(null);

      await expect(
        service.bindSession(tenantId, 'sess-1', { deviceId: 'device-a' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('checkBinding passes through and does not revoke when everything matches', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue({
        id: 'sess-1',
        deviceId: 'device-a',
        ipHash: 'ip-hash-a',
        biometricHash: 'bio-hash-a',
        proctoringRevoked: false,
      });

      const result = await service.checkBinding(tenantId, 'sess-1', {
        deviceId: 'device-a',
        ipHash: 'ip-hash-a',
        biometricHash: 'bio-hash-a',
      });

      expect(result).toEqual({ ok: true, revoked: false, mismatches: [] });
      expect(prisma.assessmentSession.updateMany).not.toHaveBeenCalled();
    });

    it('checkBinding revokes the session and reports every mismatched field', async () => {
      prisma.assessmentSession.findFirst.mockResolvedValue({
        id: 'sess-1',
        deviceId: 'device-a',
        ipHash: 'ip-hash-a',
        biometricHash: 'bio-hash-a',
        proctoringRevoked: false,
      });
      prisma.assessmentSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.checkBinding(tenantId, 'sess-1', {
        deviceId: 'device-b',
        ipHash: 'ip-hash-b',
        biometricHash: 'bio-hash-a',
      });

      expect(result).toEqual({
        ok: false,
        revoked: true,
        mismatches: ['deviceId', 'ipHash'],
      });
      expect(prisma.assessmentSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'sess-1', tenantId },
        data: { proctoringRevoked: true },
      });
    });

    it('revokeSession sets proctoringRevoked scoped to the tenant', async () => {
      prisma.assessmentSession.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeSession(tenantId, 'sess-1');

      expect(prisma.assessmentSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'sess-1', tenantId },
        data: { proctoringRevoked: true },
      });
    });
  });

  describe('reverify', () => {
    it('flags manual_review, logs an identity_drift event, and revokes the session on a confirmed drift', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue({
        id: 'idv-1',
        tenantId,
        sessionId: 'sess-1',
        driftDetected: false,
      });
      prisma.identityVerification.update.mockResolvedValue({ id: 'idv-1', status: 'manual_review' });
      prisma.assessmentSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.reverify(tenantId, userId, 'idv-1', { faceMatchScore: 0.4 });

      expect(result.driftDetected).toBe(true);
      expect(proctoring.logEvent).toHaveBeenCalledWith(
        tenantId,
        userId,
        expect.objectContaining({ sessionId: 'sess-1', eventType: 'identity_drift' }),
      );
      expect(prisma.assessmentSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'sess-1', tenantId },
        data: { proctoringRevoked: true },
      });
    });

    it('does not revoke or log an event when the re-check still matches', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue({
        id: 'idv-1',
        tenantId,
        sessionId: 'sess-1',
        driftDetected: false,
      });
      prisma.identityVerification.update.mockResolvedValue({ id: 'idv-1', status: 'verified' });

      const result = await service.reverify(tenantId, userId, 'idv-1', { faceMatchScore: 0.95 });

      expect(result.driftDetected).toBe(false);
      expect(proctoring.logEvent).not.toHaveBeenCalled();
      expect(prisma.assessmentSession.updateMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown verification id', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.reverify(tenantId, userId, 'idv-missing', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPendingReview / overrideStatus', () => {
    it('lists only manual_review records for the tenant, oldest first', async () => {
      prisma.identityVerification.findMany.mockResolvedValue([{ id: 'idv-1', status: 'manual_review' }]);

      const result = await service.listPendingReview(tenantId);

      expect(result).toEqual([{ id: 'idv-1', status: 'manual_review' }]);
      expect(prisma.identityVerification.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: 'manual_review' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('overrideStatus moves a manual_review record to verified and records who decided', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue({
        id: 'idv-1',
        tenantId,
        status: 'manual_review',
        metadata: { some: 'thing' },
      });
      prisma.identityVerification.update.mockResolvedValue({ id: 'idv-1', status: 'verified' });

      await service.overrideStatus(tenantId, 'idv-1', 'usr-admin', 'verified', 'looks fine on manual check');

      expect(prisma.identityVerification.update).toHaveBeenCalledWith({
        where: { id: 'idv-1' },
        data: {
          status: 'verified',
          metadata: expect.objectContaining({
            some: 'thing',
            reviewedBy: 'usr-admin',
            reviewNote: 'looks fine on manual check',
          }),
        },
      });
    });

    it('overrideStatus throws NotFoundException for a record outside the tenant', async () => {
      prisma.identityVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.overrideStatus(tenantId, 'idv-missing', 'usr-admin', 'failed'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.identityVerification.update).not.toHaveBeenCalled();
    });
  });
});
