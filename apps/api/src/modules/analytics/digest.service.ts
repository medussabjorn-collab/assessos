import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { weeklyDigestTemplate } from '../email/email-templates';
import { PERMISSIONS } from '../auth/permissions.constants';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface DigestRunResult {
  tenantsProcessed: number;
  emailsSent: number;
}

// Deliberately NOT request-scoped — a cron tick has no incoming HTTP
// request, so this can't reuse the request-scoped AnalyticsService/
// BiasAuditService the way controllers do. It queries Prisma directly for
// the handful of counts it needs instead.
@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Monday 8am server time.
  @Cron('0 8 * * 1')
  async handleWeeklyDigestCron(): Promise<void> {
    const result = await this.sendWeeklyDigests();
    this.logger.log(`Weekly digest run: ${result.tenantsProcessed} tenants, ${result.emailsSent} emails sent`);
  }

  async sendWeeklyDigests(): Promise<DigestRunResult> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true, settings: true } });
    let emailsSent = 0;
    let tenantsProcessed = 0;

    for (const tenant of tenants) {
      const disabled = (tenant.settings as { disabled?: boolean } | null)?.disabled;
      if (disabled) continue;
      tenantsProcessed++;

      const sent = await this.sendDigestForTenant(tenant.id);
      emailsSent += sent;
    }

    return { tenantsProcessed, emailsSent };
  }

  private async sendDigestForTenant(tenantId: string): Promise<number> {
    const since = new Date(Date.now() - SEVEN_DAYS_MS);

    const [reportsGenerated, pendingReviews, newCandidates] = await Promise.all([
      this.prisma.aiReport.count({ where: { tenantId, status: 'ready', createdAt: { gte: since } } }),
      this.prisma.decisionReviewRequest.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.candidate.count({ where: { tenantId, createdAt: { gte: since } } }),
    ]);

    // No quiet-week spam — a digest with nothing to report isn't worth
    // sending, and would just train recipients to ignore the subject line.
    if (reportsGenerated === 0 && pendingReviews === 0 && newCandidates === 0) {
      return 0;
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { permissions: { some: { permission: { key: PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW } } } },
      },
      select: { name: true, email: true },
    });

    let sent = 0;
    for (const recipient of recipients) {
      try {
        await this.emailService.send({
          to: recipient.email,
          subject: 'Your weekly AssessOS summary',
          html: weeklyDigestTemplate(recipient.name, { reportsGenerated, pendingReviews, newCandidates }),
        });
        sent++;
      } catch (err) {
        // One bad address must never stop the rest of this tenant's
        // recipients, or the loop over other tenants in sendWeeklyDigests.
        this.logger.warn(`Failed to send weekly digest to ${recipient.email}: ${err}`);
      }
    }
    return sent;
  }
}
