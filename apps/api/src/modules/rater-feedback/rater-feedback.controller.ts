import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { RaterFeedbackService } from './rater-feedback.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('api/rater-feedback')
export class RaterFeedbackController {
  constructor(private raterFeedbackService: RaterFeedbackService) {}

  @Post('sessions/:sessionId')
  @UseGuards(FirebaseAuthGuard)
  async submit(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    const { uid } = req.user;
    const result = await this.raterFeedbackService.submitFeedback(sessionId, uid, dto);

    return { success: true, data: result };
  }

  @Get('sessions/:sessionId')
  @UseGuards(FirebaseAuthGuard)
  async list(@Request() req: any, @Param('sessionId') sessionId: string) {
    const { uid } = req.user;
    const result = await this.raterFeedbackService.listForSession(sessionId, uid);

    return { success: true, data: result };
  }
}
