import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { AnalyticsService } from './analytics.service';
import { RetentionRiskService } from './retention-risk.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private retentionRisk: RetentionRiskService,
  ) {}

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW)
  async getOrgDashboard(@Request() req: any) {
    const { uid } = req.user;
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
  // RetentionRiskService's top-of-file comment). Manager+-gated since it's
  // effectively a risk assessment about another employee.
  @Get('retention-risk/:userId')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_RETENTION_RISK_VIEW)
  async getRetentionRisk(@Param('userId') userId: string) {
    const result = await this.retentionRisk.computeRiskScore(userId);
    return { success: true, data: result };
  }
}
