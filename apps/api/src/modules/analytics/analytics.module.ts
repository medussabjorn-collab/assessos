import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { LeadershipIndexService } from './leadership-index.service';
import { CacheService } from './cache.service';
import { RetentionRiskService } from './retention-risk.service';
import { PromotionReadinessService } from './promotion-readiness.service';
import { PerformanceForecastService } from './performance-forecast.service';
import { TalentOutcomeService } from './talent-outcome.service';
import { DigestService } from './digest.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    LeadershipIndexService,
    CacheService,
    RetentionRiskService,
    PromotionReadinessService,
    PerformanceForecastService,
    TalentOutcomeService,
    DigestService,
    PrismaService,
  ],
  exports: [
    AnalyticsService,
    LeadershipIndexService,
    CacheService,
    RetentionRiskService,
    PromotionReadinessService,
    PerformanceForecastService,
    TalentOutcomeService,
  ],
})
export class AnalyticsModule {}
