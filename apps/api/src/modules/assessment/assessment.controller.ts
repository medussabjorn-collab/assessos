import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { AssessmentService } from './assessment.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

@Controller('api/assessments')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @Post('sessions/start')
  @UseGuards(FirebaseAuthGuard)
  async startSession(
    @Request() req: any,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    const { uid } = req.user;
    const result = await this.assessmentService.startSession(
      uid,
      createSessionDto,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('sessions/:sessionId')
  @UseGuards(FirebaseAuthGuard)
  async getSession(@Request() req: any, @Param('sessionId') sessionId: string) {
    const { uid } = req.user;
    const session = await this.assessmentService.getSession(sessionId, uid);

    return {
      success: true,
      data: session,
    };
  }

  @Post('sessions/:sessionId/submit')
  @UseGuards(FirebaseAuthGuard)
  async submitAnswers(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() submitAnswersDto: SubmitAnswersDto,
  ) {
    const { uid } = req.user;
    const result = await this.assessmentService.submitAnswers(
      sessionId,
      uid,
      submitAnswersDto,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('configs/:configId')
  @UseGuards(FirebaseAuthGuard)
  async getConfig(@Param('configId') configId: string) {
    const config = await this.assessmentService.getConfig(configId);

    return {
      success: true,
      data: config,
    };
  }
}
