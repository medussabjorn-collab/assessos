import { Module } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { TeamService } from './team.service';
import { SubmissionService } from './submission.service';
import { JudgingService } from './judging.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [HackathonController],
  providers: [
    HackathonService,
    TeamService,
    SubmissionService,
    JudgingService,
    PrismaService,
  ],
  exports: [HackathonService, TeamService, SubmissionService, JudgingService],
})
export class HackathonsModule {}
