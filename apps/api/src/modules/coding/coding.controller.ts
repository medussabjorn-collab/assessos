import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CodingService } from './coding.service';
import { LockdownViolationService } from './lockdown-violation.service';

@Controller('api/coding')
export class CodingController {
  constructor(
    private coding: CodingService,
    private lockdownViolations: LockdownViolationService,
  ) {}

  @Get('problems')
  listProblems() {
    return { success: true, data: this.coding.listProblems() };
  }

  @Get('problems/:id')
  getProblem(@Param('id') id: string) {
    return { success: true, data: this.coding.getProblem(id) };
  }

  @Post('problems/:id/submit')
  @UseGuards(FirebaseAuthGuard)
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
