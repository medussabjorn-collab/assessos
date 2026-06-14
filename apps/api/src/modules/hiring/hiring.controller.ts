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
import { HiringService } from './hiring.service';

@Controller('api/hiring')
export class HiringController {
  constructor(private hiringService: HiringService) {}

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  async getDashboard() {
    const dashboard = await this.hiringService.getHiringDashboard();
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('positions')
  @UseGuards(FirebaseAuthGuard)
  async getPositions() {
    const positions = await this.hiringService.getJobPositions();
    return {
      success: true,
      data: positions,
    };
  }

  @Get('positions/:jobRoleId/pipeline')
  @UseGuards(FirebaseAuthGuard)
  async getPipeline(@Param('jobRoleId') jobRoleId: string) {
    const pipeline = await this.hiringService.getCandidatePipeline(jobRoleId);
    return {
      success: true,
      data: pipeline,
    };
  }

  @Get('candidates/:candidateId')
  @UseGuards(FirebaseAuthGuard)
  async getCandidateProfile(@Param('candidateId') candidateId: string) {
    const profile = await this.hiringService.getCandidateProfile(candidateId);
    return {
      success: true,
      data: profile,
    };
  }

  @Get('positions/:jobRoleId/top-candidates')
  @UseGuards(FirebaseAuthGuard)
  async getTopCandidates(
    @Param('jobRoleId') jobRoleId: string,
    @Request() req: any,
  ) {
    const comparison = await this.hiringService.compareTopCandidates(
      jobRoleId,
      3,
    );
    return {
      success: true,
      data: comparison,
    };
  }

  @Get('analytics')
  @UseGuards(FirebaseAuthGuard)
  async getAnalytics() {
    const analytics = await this.hiringService.getHiringAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }

  @Post('candidates/:candidateId/background-check')
  @UseGuards(FirebaseAuthGuard)
  async initiateBackgroundCheck(@Param('candidateId') candidateId: string) {
    const result = await this.hiringService.initiateBackgroundCheck(candidateId);
    return {
      success: true,
      data: result,
      message: 'Background check initiated',
    };
  }

  @Post('candidates/:candidateId/send-offer')
  @UseGuards(FirebaseAuthGuard)
  async sendOffer(
    @Param('candidateId') candidateId: string,
    @Body()
    body: {
      role: string;
      salary: string;
      startDate: string;
    },
  ) {
    const result = await this.hiringService.sendOfferLetter(candidateId, body);
    return {
      success: true,
      data: result,
      message: 'Offer letter sent to candidate',
    };
  }
}
