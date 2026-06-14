import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { PracticeService } from './practice.service';

@Controller('api/practice')
export class PracticeController {
  constructor(private practiceService: PracticeService) {}

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  async getDashboard() {
    const dashboard = await this.practiceService.getDashboard();
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('question')
  @UseGuards(FirebaseAuthGuard)
  async getQuestion(@Request() req: any) {
    const domain = req.query.domain;
    const question = await this.practiceService.getQuestionForLearning(domain);
    return {
      success: true,
      data: question,
    };
  }

  @Post('answer')
  @UseGuards(FirebaseAuthGuard)
  async submitAnswer(
    @Body() body: { questionId: string; selectedOptionId: string; timeTakenSec: number },
  ) {
    const result = await this.practiceService.submitAnswer(
      body.questionId,
      body.selectedOptionId,
      body.timeTakenSec,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('domain/:domain/progress')
  @UseGuards(FirebaseAuthGuard)
  async getDomainProgress(@Param('domain') domain: string) {
    const progress = await this.practiceService.getDomainProgress(domain);
    return {
      success: true,
      data: progress,
    };
  }

  @Get('certifications/:certification')
  @UseGuards(FirebaseAuthGuard)
  async getCertificationRequirements(
    @Param('certification') certification: string,
  ) {
    const requirements = await this.practiceService.getCertificationRequirements(
      certification,
    );
    return {
      success: true,
      data: requirements,
    };
  }

  @Post('certifications/:certification/earn')
  @UseGuards(FirebaseAuthGuard)
  async earnCertification(@Param('certification') certification: string) {
    const result = await this.practiceService.earnCertification(certification);
    return {
      success: true,
      data: result,
      message: 'Certification earned!',
    };
  }

  @Get('study-plan')
  @UseGuards(FirebaseAuthGuard)
  async getStudyPlan() {
    const plan = await this.practiceService.getStudyPlan();
    return {
      success: true,
      data: plan,
    };
  }

  @Get('leaderboard')
  @UseGuards(FirebaseAuthGuard)
  async getLeaderboard(@Request() req: any) {
    const domain = req.query.domain;
    const timeFrame = req.query.timeFrame || 'week';
    const leaderboard = await this.practiceService.getLeaderboard(domain, timeFrame);
    return {
      success: true,
      data: leaderboard,
    };
  }
}
