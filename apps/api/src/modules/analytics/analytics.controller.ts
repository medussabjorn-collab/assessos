import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { TalentOutcomeType } from '@prisma/client';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PrismaService } from '../../database/prisma.service';
import { toCsv } from '../../common/csv.util';
import { AnalyticsService } from './analytics.service';
import { RetentionRiskService } from './retention-risk.service';
import { PromotionReadinessService } from './promotion-readiness.service';
import { PerformanceForecastService } from './performance-forecast.service';
import { RecordOutcomeInput, TalentOutcomeService } from './talent-outcome.service';
import { DigestService } from './digest.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private retentionRisk: RetentionRiskService,
    private promotionReadiness: PromotionReadinessService,
    private performanceForecast: PerformanceForecastService,
    private talentOutcome: TalentOutcomeService,
    private digestService: DigestService,
    private prisma: PrismaService,
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

  // Same authorization as GET /dashboard — this is that same data, serialized.
  @Get('dashboard/export')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW)
  async exportOrgDashboard(@Request() req: any, @Res() res: Response) {
    const { uid } = req.user;
    const dashboard = await this.analyticsService.getOrgDashboard(uid);
    const rows = dashboard.leadershipData.map((d: any) => ({
      userName: d.userName,
      email: d.email,
      department: d.department,
      leadershipIndex: d.leadershipIndex,
      tier: d.tier,
      successorReadiness: d.successorReadiness,
      strengths: (d.strengths ?? []).join('; '),
      developmentAreas: (d.developmentAreas ?? []).join('; '),
    }));
    const csv = toCsv(rows, [
      { key: 'userName', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'department', header: 'Department' },
      { key: 'leadershipIndex', header: 'Leadership Index' },
      { key: 'tier', header: 'Tier' },
      { key: 'successorReadiness', header: 'Successor Readiness' },
      { key: 'strengths', header: 'Strengths' },
      { key: 'developmentAreas', header: 'Development Areas' },
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="org-dashboard.csv"');
    res.send(csv);
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

  // Same sensitivity class as retention-risk — a heuristic assessment of
  // another employee's future, not a self-service candidate feature.
  @Get('promotion-readiness/:userId')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_RETENTION_RISK_VIEW)
  async getPromotionReadiness(@Param('userId') userId: string) {
    const result = await this.promotionReadiness.computeReadiness(userId);
    return { success: true, data: result };
  }

  @Get('performance-forecast/:userId')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_RETENTION_RISK_VIEW)
  async getPerformanceForecast(@Param('userId') userId: string) {
    // Reuse the retention-risk band as a forecast input rather than have
    // PerformanceForecastService duplicate RetentionRiskService's queries.
    const risk = await this.retentionRisk.computeRiskScore(userId);
    const result = await this.performanceForecast.computeForecast(userId, risk.riskBand);
    return { success: true, data: result };
  }

  // Ground-truth recording — the actual data-collection point every
  // prediction service's disclosed limitation points at. HR-admin action on
  // another employee's record, so it reuses users.manage rather than the
  // read-only analytics permission above.
  @Post('talent-outcomes')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async recordTalentOutcome(
    @Request() req: any,
    @Body() body: { userId: string; outcomeType: TalentOutcomeType; occurredAt: string; details?: Record<string, unknown>; note?: string },
  ) {
    const tenantId = req.headers['x-tenant-id'];
    const recorder = await this.prisma.user.findFirst({
      where: { firebaseUid: req.user.uid, tenantId },
    });
    if (!recorder) throw new NotFoundException('User not found');

    const input: RecordOutcomeInput = {
      userId: body.userId,
      outcomeType: body.outcomeType,
      occurredAt: body.occurredAt,
      details: body.details,
      note: body.note,
    };
    const result = await this.talentOutcome.recordOutcome(input, recorder.id);
    return { success: true, data: result };
  }

  @Get('talent-outcomes/:userId')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ANALYTICS_RETENTION_RISK_VIEW)
  async listTalentOutcomesForUser(@Param('userId') userId: string) {
    const result = await this.talentOutcome.listForUser(userId);
    return { success: true, data: result };
  }

  // Manual trigger for the weekly digest — same admin gate as the
  // talent-outcomes write endpoints above. Runs the exact same code path
  // the Monday cron uses (digestService.sendWeeklyDigests), giving a real
  // way to send and verify a digest without waiting for the actual
  // schedule to fire.
  @Post('digest/trigger')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async triggerWeeklyDigest() {
    const result = await this.digestService.sendWeeklyDigests();
    return { success: true, data: result };
  }

  @Get('talent-outcomes')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  async listRecentTalentOutcomes(@Query('limit') limit?: string) {
    const result = await this.talentOutcome.listRecent(limit ? parseInt(limit, 10) : undefined);
    return { success: true, data: result };
  }
}
