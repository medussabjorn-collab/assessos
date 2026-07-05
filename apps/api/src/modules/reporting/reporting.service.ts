import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReportGeneratorService } from './report-generator.service';

@Injectable({ scope: Scope.REQUEST })
export class ReportingService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private generator: ReportGeneratorService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getReport(reportId: string, userId: string) {
    const report = await this.prisma.aiReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.tenantId !== this.tenantId || report.userId !== userId) {
      throw new BadRequestException('Report not found');
    }

    return report;
  }

  async requestReportGeneration(sessionId: string, userId: string) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { config: true, user: true },
    });

    if (!session || session.tenantId !== this.tenantId || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    if (session.status !== 'done') {
      throw new BadRequestException('Session not yet completed');
    }

    // Check if report already exists
    const existingReport = await this.prisma.aiReport.findUnique({
      where: { sessionId },
    });

    if (existingReport) {
      return existingReport;
    }

    const report = await this.prisma.aiReport.create({
      data: {
        tenantId: this.tenantId,
        sessionId,
        userId,
        dimensionScores: {},
        status: 'pending',
      },
    });

    // Generation runs in the background; the row flips to ready/failed.
    // Not awaited — the client polls the report status.
    void this.generator.generateInBackground(report.id);

    return report;
  }

  async listReports(userId: string) {
    const reports = await this.prisma.aiReport.findMany({
      where: {
        tenantId: this.tenantId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }
}
