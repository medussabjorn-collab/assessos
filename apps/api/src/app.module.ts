import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'api/auth/register', 'api/auth/tenant', 'api/billing/webhooks/stripe')
      .forRoutes('*');
  }
}
