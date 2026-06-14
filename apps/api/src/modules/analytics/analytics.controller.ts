import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  async getOrgDashboard(@Request() req: any) {
    const { uid } = req.user;
    const tenantId = req.headers['x-tenant-id'];

    // Verify user is org_admin
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid: uid, tenantId },
    });

    if (!user || !['org_admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException(
        'Only org admins can view dashboard',
      );
    }

    const dashboard = await this.analyticsService.getOrgDashboard(uid);
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('reports/:reportId')
  @UseGuards(FirebaseAuthGuard)
  async getUserReport(
    @Request() req: any,
    @Param('reportId') reportId: string,
  ) {
    const { uid } = req.user;

    const report = await this.analyticsService.getUserReport(uid, reportId);
    return {
      success: true,
      data: report,
    };
  }
}
