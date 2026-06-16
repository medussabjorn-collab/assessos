import { Module } from '@nestjs/common';
import { HiringService } from './hiring.service';
import { HiringController } from './hiring.controller';
import { JobRoleService } from './job-role.service';
import { CandidateService } from './candidate.service';
import { HiringScoreService } from './hiring-score.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [HiringController],
  providers: [
    HiringService,
    JobRoleService,
    CandidateService,
    HiringScoreService,
    PrismaService,
  ],
  exports: [
    HiringService,
    JobRoleService,
    CandidateService,
    HiringScoreService,
  ],
})
export class HiringModule {}
