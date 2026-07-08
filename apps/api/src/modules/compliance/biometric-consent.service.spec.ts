import { NotFoundException } from '@nestjs/common';
import { BiometricConsentService } from './biometric-consent.service';

describe('BiometricConsentService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: BiometricConsentService;

  beforeEach(() => {
    prisma = {
      candidate: { findFirst: jest.fn() },
      biometricConsent: { upsert: jest.fn(), findUnique: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new BiometricConsentService(prisma, request);
  });

  describe('grant', () => {
    it('throws NotFoundException for a candidate outside this tenant', async () => {
      prisma.candidate.findFirst.mockResolvedValue(null);

      await expect(
        service.grant('cand-1', { scope: ['facial_detection'], retentionDays: 30 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects consent with no scope specified', async () => {
      prisma.candidate.findFirst.mockResolvedValue({ id: 'cand-1', tenantId });

      await expect(
        service.grant('cand-1', { scope: [], retentionDays: 30 }),
      ).rejects.toThrow('Consent must specify at least one biometric scope');

      expect(prisma.biometricConsent.upsert).not.toHaveBeenCalled();
    });

    it('upserts consent with a computed retention expiry', async () => {
      prisma.candidate.findFirst.mockResolvedValue({ id: 'cand-1', tenantId });
      prisma.biometricConsent.upsert.mockResolvedValue({ id: 'consent-1' });

      await service.grant('cand-1', { scope: ['facial_detection'], retentionDays: 30 });

      const args = prisma.biometricConsent.upsert.mock.calls[0][0];
      expect(args.where).toEqual({ candidateId: 'cand-1' });
      expect(args.create.consentGiven).toBe(true);
      expect(args.create.scope).toEqual(['facial_detection']);
      expect(args.create.revokedAt).toBeNull();
      const daysDiff =
        (args.create.retentionExpiresAt.getTime() - args.create.consentedAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeCloseTo(30, 5);
    });
  });

  describe('revoke', () => {
    it('sets consentGiven false and stamps revokedAt', async () => {
      prisma.candidate.findFirst.mockResolvedValue({ id: 'cand-1', tenantId });
      prisma.biometricConsent.upsert.mockResolvedValue({ id: 'consent-1' });

      await service.revoke('cand-1');

      const args = prisma.biometricConsent.upsert.mock.calls[0][0];
      expect(args.update.consentGiven).toBe(false);
      expect(args.update.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('hasActiveConsent', () => {
    it('returns false when no consent record exists', async () => {
      prisma.biometricConsent.findUnique.mockResolvedValue(null);

      await expect(service.hasActiveConsent('cand-1', 'facial_detection')).resolves.toBe(false);
    });

    it('returns false when consent was revoked', async () => {
      prisma.biometricConsent.findUnique.mockResolvedValue({
        consentGiven: true,
        revokedAt: new Date(),
        retentionExpiresAt: new Date(Date.now() + 86400000),
        scope: ['facial_detection'],
      });

      await expect(service.hasActiveConsent('cand-1', 'facial_detection')).resolves.toBe(false);
    });

    it('returns false when retention window has expired', async () => {
      prisma.biometricConsent.findUnique.mockResolvedValue({
        consentGiven: true,
        revokedAt: null,
        retentionExpiresAt: new Date(Date.now() - 1000),
        scope: ['facial_detection'],
      });

      await expect(service.hasActiveConsent('cand-1', 'facial_detection')).resolves.toBe(false);
    });

    it('returns false when the required scope was not consented to', async () => {
      prisma.biometricConsent.findUnique.mockResolvedValue({
        consentGiven: true,
        revokedAt: null,
        retentionExpiresAt: new Date(Date.now() + 86400000),
        scope: ['voice_analysis'],
      });

      await expect(service.hasActiveConsent('cand-1', 'facial_detection')).resolves.toBe(false);
    });

    it('returns true for active, scoped, non-expired consent', async () => {
      prisma.biometricConsent.findUnique.mockResolvedValue({
        consentGiven: true,
        revokedAt: null,
        retentionExpiresAt: new Date(Date.now() + 86400000),
        scope: ['facial_detection', 'eye_tracking'],
      });

      await expect(service.hasActiveConsent('cand-1', 'facial_detection')).resolves.toBe(true);
    });
  });
});
