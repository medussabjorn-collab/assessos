import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
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
  // Scoped ThrottlerModule (default 20 req/60s) backs the @Throttle +
  // ThrottlerGuard on CodingController.submitSolution only — not global, so
  // it doesn't affect the rest of the API's ~100 other routes.
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }])],
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
