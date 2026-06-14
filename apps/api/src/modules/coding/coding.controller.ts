import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CodingService } from './coding.service';

@Controller('api/coding')
export class CodingController {
  constructor(private coding: CodingService) {}

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
  submitSolution(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: this.coding.submitSolution(id, body.code, body.language) };
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
}
