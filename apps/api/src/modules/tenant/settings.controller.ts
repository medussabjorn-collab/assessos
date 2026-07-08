import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
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
  @UseGuards(FirebaseAuthGuard)
  async getWhiteLabelAdmin(@Request() req: any) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    // Verify user is org_admin
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });

    if (!user || !['org_admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only org admins can view white-label settings');
    }

    const settings = await this.whiteLabelService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Post('white-label')
  @UseGuards(FirebaseAuthGuard)
  async updateWhiteLabel(@Request() req: any, @Body() body: any) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    // Verify user is org_admin
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });

    if (!user || !['org_admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only org admins can update white-label settings');
    }

    const settings = await this.whiteLabelService.updateSettings(body, user.role);
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
  @UseGuards(FirebaseAuthGuard)
  async getSsoConfig(@Request() req: any) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });
    if (!user || !['org_admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only org admins can view SSO settings');
    }

    const config = await this.ssoConfigService.getConfig();
    return { success: true, data: config };
  }

  @Post('sso')
  @UseGuards(FirebaseAuthGuard)
  async updateSsoConfig(@Request() req: any, @Body() body: SsoConfig) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });
    if (!user || !['org_admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only org admins can update SSO settings');
    }

    const config = await this.ssoConfigService.updateConfig(body, user.role);
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
