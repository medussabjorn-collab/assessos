import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { HiringModule } from './modules/hiring/hiring.module';
import { PracticeModule } from './modules/practice/practice.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { CodingModule } from './modules/coding/coding.module';
import { HackathonsModule } from './modules/hackathons/hackathons.module';
import { PsychometricModule } from './modules/psychometric/psychometric.module';
import { RaterFeedbackModule } from './modules/rater-feedback/rater-feedback.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { PillarQuestionModule } from './modules/pillar-questions/pillar-question.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { EmailModule } from './modules/email/email.module';
import { ProctoringModule } from './modules/proctoring/proctoring.module';
import { OfflineSyncModule } from './modules/offline-sync/offline-sync.module';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Mongo powers the question item bank (merged from leadership-assessment).
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/assessos',
      { retryAttempts: 3, retryDelay: 2000 },
    ),
    AuthModule,
    TenantModule,
    UsersModule,
    AssessmentModule,
    ReportingModule,
    AnalyticsModule,
    BillingModule,
    AdminModule,
    HiringModule,
    PracticeModule,
    InterviewsModule,
    CodingModule,
    HackathonsModule,
    PsychometricModule,
    RaterFeedbackModule,
    ComplianceModule,
    WebhooksModule,
    QuestionBankModule,
    PillarQuestionModule,
    NotificationsModule,
    AuditLogModule,
    IntegrationsModule,
    RealtimeModule,
    EmailModule,
    ProctoringModule,
    OfflineSyncModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'health',
        'api/auth/register',
        'api/auth/tenant',
        'api/auth/sso/discover',
        'api/billing/webhooks/stripe',
        // The invitee has no tenant context (or account) yet at this point —
        // the invitation's token carries the tenant, not the request header.
        'api/invitations/lookup',
        'api/invitations/accept',
        // Platform-level super-admin routes act ACROSS tenants — the
        // x-tenant-id header here names the org being managed, not the
        // caller's own membership, so tenant-disabled enforcement must not
        // apply. Authorization is PLATFORM_ORGS_MANAGE (PermissionsGuard),
        // not tenant membership. Without this exclusion, disabling an org
        // whose admin happens to also be its own super_admin's home tenant
        // permanently locks out the only account that could re-enable it.
        'api/admin/organizations',
        'api/admin/organizations/:tenantId',
        'api/admin/organizations/:tenantId/disable',
        'api/admin/organizations/:tenantId/enable',
        'api/admin/users/:tenantId',
        'api/admin/usage-alerts',
      )
      .forRoutes('*');
  }
}
