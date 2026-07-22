import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { WhiteLabelService } from './white-label.service';
import { SsoConfigService, SsoConfig } from './sso-config.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('api/settings')
export class SettingsController {
  constructor(
    private whiteLabelService: WhiteLabelService,
    private ssoConfigService: SsoConfigService,
    private prisma: PrismaService,
  ) {}

  @Get('white-label')
  async getWhiteLabelPublic() {
    const settings = await this.whiteLabelService.getPublicSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Get('white-label/admin')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.TENANT_WHITE_LABEL_MANAGE)
  async getWhiteLabelAdmin() {
    const settings = await this.whiteLabelService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Post('white-label')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.TENANT_WHITE_LABEL_MANAGE)
  async updateWhiteLabel(@Body() body: any) {
    const settings = await this.whiteLabelService.updateSettings(body);
    return {
      success: true,
      data: settings,
      message: 'White-label settings updated',
    };
  }

  // #23 SSO: tenant → Firebase Identity Platform provider mapping.
  // Firebase handles the actual SAML/OIDC handshake once the provider is
  // configured in Firebase Console — this only stores which providerId
  // belongs to which tenant.
  @Get('sso')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.TENANT_SSO_MANAGE)
  async getSsoConfig() {
    const config = await this.ssoConfigService.getConfig();
    return { success: true, data: config };
  }

  @Post('sso')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.TENANT_SSO_MANAGE)
  async updateSsoConfig(@Body() body: SsoConfig) {
    const config = await this.ssoConfigService.updateConfig(body);
    return { success: true, data: config, message: 'SSO settings updated' };
  }

  @Get('organization')
  @UseGuards(FirebaseAuthGuard)
  async getOrgSettings(@Request() req: any) {
    const tenantId = req.headers['x-tenant-id'];

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        settings: true,
      },
    });

    return {
      success: true,
      data: tenant,
    };
  }
}
