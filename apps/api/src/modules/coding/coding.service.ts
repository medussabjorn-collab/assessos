import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProblemService } from './problem.service';
import { CodeExecutionService } from './code-execution.service';
import { LeaderboardService } from './leaderboard.service';
import { ProgressService } from './progress.service';
import { PlagiarismService } from './plagiarism.service';

@Injectable({ scope: Scope.REQUEST })
export class CodingService {
  private tenantId: string;

  constructor(
    private problems: ProblemService,
    private execution: CodeExecutionService,
    private leaderboard: LeaderboardService,
    private progress: ProgressService,
    private plagiarism: PlagiarismService,
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  getProblem(id: string) {
    return this.problems.getProblem(id);
  }

  listProblems(difficulty?: string) {
    return this.problems.listProblems(difficulty);
  }

  async submitSolution(
    problemId: string,
    code: string,
    language: string,
    firebaseUid: string,
  ) {
    const problem = this.problems.getProblem(problemId);
    if (!problem) throw new Error('Problem not found');

    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const validation = await this.execution.validateSolution(
      code,
      language as 'python' | 'javascript' | 'java' | 'cpp',
      problem.testCases,
    );

    const plagiarismCheck = await this.plagiarism.checkAgainstPriorSubmissions(
      problemId,
      language,
      code,
      user.id,
    );

    await this.prisma.codeSubmission.create({
      data: {
        tenantId: this.tenantId,
        userId: user.id,
        problemId,
        language,
        code,
        score: validation.score,
        valid: validation.valid,
        similarityScore: plagiarismCheck.similarityScore,
        matchedSubmissionId: plagiarismCheck.matchedSubmissionId,
      },
    });

    return {
      ...validation,
      plagiarism: {
        flagged: plagiarismCheck.flagged,
        similarityScore: plagiarismCheck.similarityScore,
      },
    };
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
