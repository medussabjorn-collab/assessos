import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export interface WhiteLabelSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  customDomain?: string;
  faviconUrl?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class WhiteLabelService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getSettings(): Promise<WhiteLabelSettings | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: this.tenantId },
      select: { whiteLabel: true },
    });

    if (!tenant?.whiteLabel) {
      return null;
    }

    return tenant.whiteLabel as WhiteLabelSettings;
  }

  async updateSettings(
    settings: WhiteLabelSettings,
    userRole: string,
  ): Promise<WhiteLabelSettings> {
    // Verify user is org_admin
    if (!['org_admin', 'super_admin'].includes(userRole)) {
      throw new BadRequestException('Only org admins can update white-label settings');
    }

    // Verify custom domain (if provided)
    if (settings.customDomain) {
      await this.validateCustomDomain(settings.customDomain);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: this.tenantId },
      data: {
        whiteLabel: settings,
      },
      select: { whiteLabel: true },
    });

    return tenant.whiteLabel as WhiteLabelSettings;
  }

  private async validateCustomDomain(domain: string): Promise<void> {
    // Check if domain is already taken
    const existing = await this.prisma.tenant.findFirst({
      where: {
        whiteLabel: {
          path: ['customDomain'],
          equals: domain,
        },
      },
    });

    if (existing && existing.id !== this.tenantId) {
      throw new BadRequestException('Domain already in use');
    }

    // TODO: Validate DNS CNAME record points to AssessOS
    // TODO: Provision SSL certificate
  }

  async getPublicSettings(): Promise<Partial<WhiteLabelSettings>> {
    const settings = await this.getSettings();

    if (!settings) {
      return {};
    }

    // Return only public branding settings
    return {
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      companyName: settings.companyName,
      faviconUrl: settings.faviconUrl,
    };
  }
}
