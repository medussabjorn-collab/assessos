import { Module } from '@nestjs/common';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { ProblemService } from './problem.service';
import { CodeExecutionService } from './code-execution.service';
import { LeaderboardService } from './leaderboard.service';
import { ProgressService } from './progress.service';
import { PlagiarismService } from './plagiarism.service';
import { LockdownViolationService } from './lockdown-violation.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CodingController],
  providers: [
    CodingService,
    ProblemService,
    CodeExecutionService,
    LeaderboardService,
    ProgressService,
    PlagiarismService,
    LockdownViolationService,
    PrismaService,
  ],
  exports: [
    CodingService,
    ProblemService,
    CodeExecutionService,
    LeaderboardService,
    PlagiarismService,
  ],
})
export class CodingModule {}
