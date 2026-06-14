import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable({ scope: Scope.REQUEST })
export class ReportingService {
  private tenantId: string;
  private aiServiceUrl = process.env.AI_SIDECAR_URL || 'http://localhost:8000';

  constructor(
    private prisma: PrismaService,
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

    // Trigger report generation via AI sidecar
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/reports/generate`,
        {
          session_id: sessionId,
          tenant_id: this.tenantId,
          user_id: userId,
          answers: [], // TODO: Fetch from answers table (Phase 3 expansion)
          config: session.config,
        },
      );

      // Report will be generated asynchronously
      // Create pending report record
      const report = await this.prisma.aiReport.create({
        data: {
          tenantId: this.tenantId,
          sessionId,
          userId,
          dimensionScores: {},
          status: 'pending',
        },
      });

      return report;
    } catch (error) {
      throw new BadRequestException('Failed to trigger report generation');
    }
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
