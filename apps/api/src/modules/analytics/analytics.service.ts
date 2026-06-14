import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { LeadershipIndexService } from './leadership-index.service';
import { CacheService } from './cache.service';

@Injectable({ scope: Scope.REQUEST })
export class AnalyticsService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private leadershipIndex: LeadershipIndexService,
    private cache: CacheService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getOrgDashboard(orgAdminId: string) {
    // Check cache first
    const cached = await this.cache.get(
      `dashboard:${this.tenantId}:${orgAdminId}`,
    );
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch all users and their reports for the org
    const users = await this.prisma.user.findMany({
      where: { tenantId: this.tenantId },
      include: {
        aiReports: {
          include: {
            session: true,
          },
        },
      },
    });

    // Calculate leadership indices
    const leadershipData = users
      .filter((user) => user.aiReports.length > 0)
      .map((user) => {
        const latestReport = user.aiReports[0];
        const scores =
          typeof latestReport.dimensionScores === 'string'
            ? JSON.parse(latestReport.dimensionScores)
            : latestReport.dimensionScores;

        const result = this.leadershipIndex.calculateLeadershipIndex(scores);
        return {
          userId: user.id,
          userName: user.name,
          email: user.email,
          department: user.department || 'N/A',
          ...result,
        };
      });

    // Calculate org health
    const indices = leadershipData.map((d) => d.leadershipIndex);
    const orgHealth = this.leadershipIndex.calculateOrgHealth(indices);

    // Identify succession pipeline
    const succession = this.buildSuccessionPipeline(leadershipData);

    // Identify high performers
    const topPerformers = leadershipData
      .sort((a, b) => b.leadershipIndex - a.leadershipIndex)
      .slice(0, 5);

    // Identify development priorities
    const developmentPriorities = leadershipData
      .filter((d) => d.tier === 'solid' || d.tier === 'emerging')
      .sort((a, b) => b.leadershipIndex - a.leadershipIndex)
      .slice(0, 5);

    const dashboard = {
      summary: {
        totalLeaders: leadershipData.length,
        avgLeadershipIndex: orgHealth.avgIndex,
        healthRating: orgHealth.healthRating,
        distribution: orgHealth.distribution,
      },
      leadershipData,
      topPerformers,
      developmentPriorities,
      succession,
      generatedAt: new Date().toISOString(),
    };

    // Cache for 1 hour
    await this.cache.set(
      `dashboard:${this.tenantId}:${orgAdminId}`,
      JSON.stringify(dashboard),
      3600,
    );

    return dashboard;
  }

  async getUserReport(userId: string, reportId: string) {
    const report = await this.prisma.aiReport.findUnique({
      where: { id: reportId },
      include: {
        session: true,
      },
    });

    if (!report || report.tenantId !== this.tenantId) {
      throw new Error('Report not found');
    }

    const scores =
      typeof report.dimensionScores === 'string'
        ? JSON.parse(report.dimensionScores)
        : report.dimensionScores;

    const leadershipResult =
      this.leadershipIndex.calculateLeadershipIndex(scores);
    const successorReadiness = leadershipResult.successorReadiness;
    const successionTier = this.leadershipIndex.assignSuccessionTier(
      successorReadiness,
    );

    return {
      ...report,
      ...leadershipResult,
      successionTier,
    };
  }

  private buildSuccessionPipeline(leadershipData: any[]) {
    const pipeline = {
      ready_now: leadershipData.filter(
        (d) =>
          this.leadershipIndex.assignSuccessionTier(d.successorReadiness) ===
          'ready_now',
      ),
      ready_2yr: leadershipData.filter(
        (d) =>
          this.leadershipIndex.assignSuccessionTier(d.successorReadiness) ===
          'ready_2yr',
      ),
      ready_5yr: leadershipData.filter(
        (d) =>
          this.leadershipIndex.assignSuccessionTier(d.successorReadiness) ===
          'ready_5yr',
      ),
      not_ready: leadershipData.filter(
        (d) =>
          this.leadershipIndex.assignSuccessionTier(d.successorReadiness) ===
          'not_ready',
      ),
    };

    return pipeline;
  }
}
