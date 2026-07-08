import { BadRequestException } from '@nestjs/common';
import { SsoConfigService } from './sso-config.service';

describe('SsoConfigService', () => {
  const tenantId = 'tenant-1';
  let prisma: any;
  let service: SsoConfigService;

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    const request = { headers: { 'x-tenant-id': tenantId } };
    service = new SsoConfigService(prisma, request);
  });

  describe('getConfig', () => {
    it('returns null when no ssoConfig is set', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ ssoConfig: null });

      await expect(service.getConfig()).resolves.toBeNull();
    });

    it('returns the stored config', async () => {
      const config = { enabled: true, providerId: 'saml.okta-acme', providerType: 'saml', displayName: 'Acme SSO' };
      prisma.tenant.findUnique.mockResolvedValue({ ssoConfig: config });

      await expect(service.getConfig()).resolves.toEqual(config);
    });
  });

  describe('updateConfig', () => {
    const validConfig = {
      enabled: true,
      providerId: 'saml.okta-acme',
      providerType: 'saml' as const,
      displayName: 'Acme SSO',
    };

    it('rejects a non-admin role', async () => {
      await expect(service.updateConfig(validConfig, 'employee')).rejects.toThrow(BadRequestException);
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('rejects a config missing required fields', async () => {
      await expect(
        service.updateConfig({ ...validConfig, providerId: '' }, 'org_admin'),
      ).rejects.toThrow('providerId, providerType, and displayName are required');
    });

    it('rejects an invalid providerType', async () => {
      await expect(
        service.updateConfig({ ...validConfig, providerType: 'ldap' as any }, 'org_admin'),
      ).rejects.toThrow('providerType must be "saml" or "oidc"');
    });

    it('rejects a domain already claimed by a different tenant', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: 'other-tenant' });

      await expect(
        service.updateConfig({ ...validConfig, domain: 'acme.com' }, 'org_admin'),
      ).rejects.toThrow('already claimed');
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('allows re-saving the same domain for this same tenant', async () => {
      prisma.tenant.findFirst.mockResolvedValue({ id: tenantId });
      prisma.tenant.update.mockResolvedValue({ ssoConfig: { ...validConfig, domain: 'acme.com' } });

      await expect(
        service.updateConfig({ ...validConfig, domain: 'acme.com' }, 'org_admin'),
      ).resolves.toBeDefined();
    });

    it('saves a valid config with no domain specified', async () => {
      prisma.tenant.update.mockResolvedValue({ ssoConfig: validConfig });

      await service.updateConfig(validConfig, 'org_admin');

      expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: { ssoConfig: validConfig },
        select: { ssoConfig: true },
      });
    });
  });

  describe('discoverByDomain', () => {
    it('returns null when no tenant claims this domain', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(service.discoverByDomain('nobody.com')).resolves.toBeNull();
    });

    it('returns null when the matching tenant has SSO disabled', async () => {
      prisma.tenant.findFirst.mockResolvedValue({
        id: 'tenant-2',
        ssoConfig: { enabled: false, providerId: 'x', providerType: 'saml', displayName: 'X', domain: 'acme.com' },
      });

      await expect(service.discoverByDomain('acme.com')).resolves.toBeNull();
    });

    it('returns provider info for an enabled, matching config', async () => {
      prisma.tenant.findFirst.mockResolvedValue({
        id: 'tenant-2',
        ssoConfig: {
          enabled: true,
          providerId: 'oidc.azure-acme',
          providerType: 'oidc',
          displayName: 'Acme via Azure AD',
          domain: 'acme.com',
        },
      });

      const result = await service.discoverByDomain('acme.com');

      expect(result).toEqual({
        tenantId: 'tenant-2',
        providerId: 'oidc.azure-acme',
        providerType: 'oidc',
        displayName: 'Acme via Azure AD',
      });
    });

    it('is not scoped to the request tenant — searches across all tenants by domain', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await service.discoverByDomain('acme.com');

      const whereArg = prisma.tenant.findFirst.mock.calls[0][0].where;
      expect(whereArg).not.toHaveProperty('id');
      expect(whereArg).not.toHaveProperty('tenantId');
    });
  });
});
