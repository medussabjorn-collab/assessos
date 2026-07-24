import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Maps a tenant to a Firebase Identity Platform federated provider ID
 * (e.g. "saml.okta-acmecorp", "oidc.azure-acmecorp") — configured in
 * Firebase Console per the IdP's actual SAML/OIDC metadata. This service
 * does NOT talk to Okta/Azure/Google directly and does not handle any
 * SAML/OIDC handshake — Identity Platform does that once the provider is
 * set up there. This is the piece that has to exist regardless of which
 * IdP a customer picks: tenant → providerId lookup, and email-domain →
 * tenant discovery so a login page can auto-redirect to the right IdP.
 */

export interface SsoConfig {
  enabled: boolean;
  providerId: string; // Firebase Identity Platform provider ID
  providerType: 'saml' | 'oidc';
  displayName: string;
  // Email domain that should auto-redirect to this tenant's SSO (e.g.
  // "acmecorp.com"). Optional — without it, SSO still works via direct
  // tenant-scoped login, just not via email-domain auto-discovery.
  domain?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class SsoConfigService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getConfig(): Promise<SsoConfig | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: this.tenantId },
      select: { ssoConfig: true },
    });
    return (tenant?.ssoConfig as unknown as SsoConfig) ?? null;
  }

  async updateConfig(config: SsoConfig): Promise<SsoConfig> {
    if (!config.providerId || !config.providerType || !config.displayName) {
      throw new BadRequestException('providerId, providerType, and displayName are required');
    }
    if (!['saml', 'oidc'].includes(config.providerType)) {
      throw new BadRequestException('providerType must be "saml" or "oidc"');
    }

    if (config.domain) {
      const existing = await this.prisma.tenant.findFirst({
        where: { ssoConfig: { path: ['domain'], equals: config.domain } },
      });
      if (existing && existing.id !== this.tenantId) {
        throw new BadRequestException('Domain already claimed by another tenant\'s SSO config');
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: this.tenantId },
      data: { ssoConfig: config as unknown as Prisma.InputJsonValue },
      select: { ssoConfig: true },
    });
    return tenant.ssoConfig as unknown as SsoConfig;
  }

  // Public discovery: given an email domain, which tenant/provider should
  // the login page redirect to? No auth — this is the "type your work
  // email, get routed to your company's IdP" flow, and must be reachable
  // before the user has a session.
  async discoverByDomain(
    emailDomain: string,
  ): Promise<{ tenantId: string; providerId: string; providerType: string; displayName: string } | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        ssoConfig: { path: ['domain'], equals: emailDomain.toLowerCase() },
      },
      select: { id: true, ssoConfig: true },
    });
    if (!tenant) return null;

    const config = tenant.ssoConfig as unknown as SsoConfig;
    if (!config?.enabled) return null;

    return {
      tenantId: tenant.id,
      providerId: config.providerId,
      providerType: config.providerType,
      displayName: config.displayName,
    };
  }
}
