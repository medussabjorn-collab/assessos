import { Module } from '@nestjs/common';
import { HiringService } from './hiring.service';
import { HiringController } from './hiring.controller';
import { JobRoleService } from './job-role.service';
import { CandidateService } from './candidate.service';
import { HiringScoreService } from './hiring-score.service';
import { PrismaService } from '../../database/prisma.service';
import { LeadershipIndexService } from '../analytics/leadership-index.service';

@Module({
  controllers: [HiringController],
  providers: [
    HiringService,
    JobRoleService,
    CandidateService,
    HiringScoreService,
    LeadershipIndexService,
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
