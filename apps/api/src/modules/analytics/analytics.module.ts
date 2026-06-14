import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { LeadershipIndexService } from './leadership-index.service';
import { CacheService } from './cache.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    LeadershipIndexService,
    CacheService,
    PrismaService,
  ],
  exports: [AnalyticsService, LeadershipIndexService, CacheService],
})
export class AnalyticsModule {}
