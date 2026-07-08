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
import { RetentionRiskService } from './retention-risk.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private retentionRisk: RetentionRiskService,
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

  // #19: heuristic retention-risk proxy (not a trained model — see
  // RetentionRiskService's top-of-file comment). Admin-gated since it's
  // effectively a risk assessment about another employee.
  @Get('retention-risk/:userId')
  @UseGuards(FirebaseAuthGuard)
  async getRetentionRisk(
    @Request() req: any,
    @Param('userId') userId: string,
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const requester = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!requester || !['manager', 'org_admin', 'super_admin'].includes(requester.role)) {
      throw new ForbiddenException(
        'Only managers and org admins can view retention-risk data',
      );
    }

    const result = await this.retentionRisk.computeRiskScore(userId);
    return { success: true, data: result };
  }
}
