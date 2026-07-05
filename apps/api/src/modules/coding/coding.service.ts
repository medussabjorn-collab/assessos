import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CodeExecutionService } from './code-execution.service';
import { LeaderboardService } from './leaderboard.service';
import { ProgressService } from './progress.service';

@Injectable({ scope: Scope.REQUEST })
export class CodingService {
  constructor(
    private problems: ProblemService,
    private execution: CodeExecutionService,
    private leaderboard: LeaderboardService,
    private progress: ProgressService,
    @Inject(REQUEST) private request: any,
  ) {}

  getProblem(id: string) {
    return this.problems.getProblem(id);
  }

  listProblems(difficulty?: string) {
    return this.problems.listProblems(difficulty);
  }

  async submitSolution(problemId: string, code: string, language: string) {
    const problem = this.problems.getProblem(problemId);
    if (!problem) throw new Error('Problem not found');

    return this.execution.validateSolution(
      code,
      language as 'python' | 'javascript' | 'java' | 'cpp',
      problem.testCases,
    );
  }

  getDashboard() {
    return {
      stats: this.progress.getProgressStats(),
      nextProblem: { id: 'longest-substring', difficulty: 'medium' },
      streak: 8,
    };
  }

  getLeaderboards() {
    return {
      global: this.leaderboard.getGlobalLeaderboard(),
      streaks: this.leaderboard.getStreakLeaderboard(),
    };
  }
}
