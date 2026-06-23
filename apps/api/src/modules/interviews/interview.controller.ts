import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { InterviewService } from './interview.service';

@Controller('api/interviews')
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  @Post(':interviewId/start')
  @UseGuards(FirebaseAuthGuard)
  async startInterview(
    @Param('interviewId') interviewId: string,
    @Body() body: { candidateName: string },
  ) {
    const result = await this.interviewService.startInterview(
      interviewId,
      body.candidateName,
    );
    return { success: true, data: result };
  }

  @Post(':interviewId/end')
  @UseGuards(FirebaseAuthGuard)
  async endInterview(@Param('interviewId') interviewId: string) {
    const result = await this.interviewService.endInterview(interviewId);
    return { success: true, data: result };
  }

  @Post(':interviewId/feedback')
  @UseGuards(FirebaseAuthGuard)
  async submitFeedback(
    @Param('interviewId') interviewId: string,
    @Body() feedback: any,
  ) {
    const result = await this.interviewService.submitInterviewFeedback(
      interviewId,
      feedback,
    );
    return { success: true, data: result, message: 'Feedback submitted' };
  }

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard)
  async getDashboard() {
    const dashboard = await this.interviewService.getInterviewDashboard();
    return { success: true, data: dashboard };
  }

  @Post('candidates/:candidateId/schedule-next-round')
  @UseGuards(FirebaseAuthGuard)
  async scheduleNextRound(
    @Param('candidateId') candidateId: string,
    @Body() body: { roundType: string },
  ) {
    const result = await this.interviewService.scheduleNextRound(
      candidateId,
      body.roundType,
    );
    return { success: true, data: result };
  }
}
