import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { SuperAdminService } from './super-admin.service';

@Controller('api/admin')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.PLATFORM_ORGS_MANAGE)
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('organizations')
  async listOrganizations() {
    const orgs = await this.superAdminService.listOrganizations();
    return {
      success: true,
      data: orgs,
    };
  }

  @Get('organizations/:tenantId')
  async getOrganization(@Param('tenantId') tenantId: string) {
    const org = await this.superAdminService.getOrganization(tenantId);
    return {
      success: true,
      data: org,
    };
  }

  @Post('organizations/:tenantId/disable')
  async disableOrganization(@Param('tenantId') tenantId: string) {
    await this.superAdminService.disableOrganization(tenantId);
    return {
      success: true,
      message: 'Organization disabled',
    };
  }

  @Get('users/:tenantId')
  async getOrgUsers(@Param('tenantId') tenantId: string) {
    const users = await this.superAdminService.getOrgUsers(tenantId);
    return {
      success: true,
      data: users,
    };
  }

  @Post('usage-alerts')
  async checkUsageAlerts() {
    const alerts = await this.superAdminService.checkUsageAlerts();
    return {
      success: true,
      data: alerts,
    };
  }
}
