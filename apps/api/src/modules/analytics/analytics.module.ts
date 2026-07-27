import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { LeadershipIndexService } from './leadership-index.service';
import { CacheService } from './cache.service';
import { RetentionRiskService } from './retention-risk.service';
import { PromotionReadinessService } from './promotion-readiness.service';
import { PerformanceForecastService } from './performance-forecast.service';
import { TalentOutcomeService } from './talent-outcome.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    LeadershipIndexService,
    CacheService,
    RetentionRiskService,
    PromotionReadinessService,
    PerformanceForecastService,
    TalentOutcomeService,
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
