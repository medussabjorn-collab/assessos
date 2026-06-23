import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { SuperAdminService } from './super-admin.service';

@Controller('api/admin')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('organizations')
  @UseGuards(FirebaseAuthGuard)
  async listOrganizations(@Request() req: any) {
    const { uid } = req.user;

    // Verify user is super_admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(uid);
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this endpoint');
    }

    const orgs = await this.superAdminService.listOrganizations();
    return {
      success: true,
      data: orgs,
    };
  }

  @Get('organizations/:tenantId')
  @UseGuards(FirebaseAuthGuard)
  async getOrganization(
    @Request() req: any,
    @Param('tenantId') tenantId: string,
  ) {
    const { uid } = req.user;

    // Verify user is super_admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(uid);
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this endpoint');
    }

    const org = await this.superAdminService.getOrganization(tenantId);
    return {
      success: true,
      data: org,
    };
  }

  @Post('organizations/:tenantId/disable')
  @UseGuards(FirebaseAuthGuard)
  async disableOrganization(
    @Request() req: any,
    @Param('tenantId') tenantId: string,
  ) {
    const { uid } = req.user;

    // Verify user is super_admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(uid);
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this endpoint');
    }

    await this.superAdminService.disableOrganization(tenantId);
    return {
      success: true,
      message: 'Organization disabled',
    };
  }

  @Get('users/:tenantId')
  @UseGuards(FirebaseAuthGuard)
  async getOrgUsers(
    @Request() req: any,
    @Param('tenantId') tenantId: string,
  ) {
    const { uid } = req.user;

    // Verify user is super_admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(uid);
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this endpoint');
    }

    const users = await this.superAdminService.getOrgUsers(tenantId);
    return {
      success: true,
      data: users,
    };
  }

  @Post('usage-alerts')
  @UseGuards(FirebaseAuthGuard)
  async checkUsageAlerts(@Request() req: any) {
    const { uid } = req.user;

    // Verify user is super_admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(uid);
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this endpoint');
    }

    const alerts = await this.superAdminService.checkUsageAlerts();
    return {
      success: true,
      data: alerts,
    };
  }
}
