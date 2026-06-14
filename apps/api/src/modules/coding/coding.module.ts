import { Module } from '@nestjs/common';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { ProblemService } from './problem.service';
import { CodeExecutionService } from './code-execution.service';
import { LeaderboardService } from './leaderboard.service';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CodingController],
  providers: [
    CodingService,
    ProblemService,
    CodeExecutionService,
    LeaderboardService,
    ProgressService,
    PrismaService,
  ],
  exports: [
    CodingService,
    ProblemService,
    CodeExecutionService,
    LeaderboardService,
  ],
})
export class CodingModule {}
