import { BadRequestException } from '@nestjs/common';
import { WhiteLabelService } from './white-label.service';

describe('WhiteLabelService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: WhiteLabelService;

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new WhiteLabelService(prisma, request);
  });

  describe('getSettings', () => {
    it('returns null when the tenant has no whiteLabel config', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ whiteLabel: null });

      await expect(service.getSettings()).resolves.toBeNull();
    });

    it('returns the stored settings scoped to this tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        whiteLabel: { companyName: 'Acme', primaryColor: '#000' },
      });

      const result = await service.getSettings();

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
        select: { whiteLabel: true },
      });
      expect(result).toEqual({ companyName: 'Acme', primaryColor: '#000' });
    });
  });

  describe('updateSettings', () => {
    it('rejects a non-admin role', async () => {
      await expect(
        service.updateSettings({ companyName: 'Acme' }, 'employee'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('allows org_admin to update settings', async () => {
      prisma.tenant.update.mockResolvedValue({ whiteLabel: { companyName: 'Acme' } });

      await service.updateSettings({ companyName: 'Acme' }, 'org_admin');

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: { whiteLabel: { companyName: 'Acme' } },
        select: { whiteLabel: true },
      });
    });

    it('rejects a custom domain already claimed by another tenant', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'other-tenant' });

      await expect(
        service.updateSettings({ customDomain: 'taken.example.com' }, 'org_admin'),
      ).rejects.toThrow('Domain already in use');
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('allows a custom domain already claimed by this same tenant (re-save)', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: tenantId });
      prisma.tenant.update.mockResolvedValue({ whiteLabel: { customDomain: 'mine.example.com' } });

      await expect(
        service.updateSettings({ customDomain: 'mine.example.com' }, 'org_admin'),
      ).resolves.toBeDefined();
    });
  });

  describe('getPublicSettings', () => {
    it('strips internal-only fields (email sender identity) from the public view', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        whiteLabel: {
          companyName: 'Acme',
          logoUrl: 'https://acme.com/logo.png',
          emailFromName: 'Acme Internal',
          emailFromAddress: 'internal@acme.com',
        },
      });

      const result = await service.getPublicSettings();

      expect(result).toEqual({
        logoUrl: 'https://acme.com/logo.png',
        primaryColor: undefined,
        secondaryColor: undefined,
        companyName: 'Acme',
        faviconUrl: undefined,
      });
      expect(result).not.toHaveProperty('emailFromAddress');
    });

    it('returns an empty object when no settings exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ whiteLabel: null });

      await expect(service.getPublicSettings()).resolves.toEqual({});
    });
  });
});
