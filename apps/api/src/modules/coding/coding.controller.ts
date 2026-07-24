import { Controller, Get, NotFoundException, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CodingService } from './coding.service';
import { LockdownViolationService } from './lockdown-violation.service';
import { CodeExecutionService } from './code-execution.service';
import { CodingProblem } from './problem.service';

@Controller('api/coding')
export class CodingController {
  constructor(
    private coding: CodingService,
    private lockdownViolations: LockdownViolationService,
    private execution: CodeExecutionService,
  ) {}

  // testCases carries expectedOutput — the graded answer key. Never send it
  // to the client (found while wiring up the real coding-challenge page:
  // both list and single-problem reads returned it unfiltered, so anyone
  // could read it from the network tab and hardcode a "solution").
  private redact(problem: CodingProblem) {
    const { testCases: _testCases, ...safe } = problem;
    return safe;
  }

  @Get('problems')
  listProblems() {
    return { success: true, data: this.coding.listProblems().map((p) => this.redact(p)) };
  }

  @Get('problems/:id')
  getProblem(@Param('id') id: string) {
    const problem = this.coding.getProblem(id);
    if (!problem) throw new NotFoundException('Problem not found');
    return { success: true, data: this.redact(problem) };
  }

  // Ported from leadership-assessment codeExecutionController.getLanguages.
  @Get('languages')
  async getLanguages() {
    return { success: true, data: await this.execution.getLanguages() };
  }

  // Rate-limited (ported from leadership-assessment's 20/min submit limiter)
  // — Judge0 execution is a metered external call, unlike the rest of this
  // API which has no rate limiting.
  @Post('problems/:id/submit')
  @UseGuards(FirebaseAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async submitSolution(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const result = await this.coding.submitSolution(
      id,
      body.code,
      body.language,
      req.user.uid,
    );
    return { success: true, data: result };
  }

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  getDashboard() {
    return { success: true, data: this.coding.getDashboard() };
  }

  @Get('leaderboards')
  getLeaderboards() {
    return { success: true, data: this.coding.getLeaderboards() };
  }

  @Post('lockdown-violations')
  @UseGuards(FirebaseAuthGuard)
  async reportLockdownViolation(
    @Request() req: any,
    @Body() body: { context: string; violationType: string },
  ) {
    const record = await this.lockdownViolations.record(
      req.user.uid,
      body.context,
      body.violationType,
    );
    return { success: true, data: record };
  }
}
