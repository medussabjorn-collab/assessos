import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { DiscQuestionsService } from './disc-questions.service';
import { DiscAnswer, DiscService } from './disc.service';

@Controller('api/disc')
export class DiscController {
  constructor(
    private discService: DiscService,
    private questionsService: DiscQuestionsService,
  ) {}

  @Get('questions')
  @UseGuards(FirebaseAuthGuard)
  getQuestions() {
    return {
      success: true,
      data: this.questionsService.getGroups(),
    };
  }

  @Post('submit')
  @UseGuards(FirebaseAuthGuard)
  async submit(@Request() req: any, @Body() body: { answers: DiscAnswer[] }) {
    const result = await this.discService.submit(req.user.uid, body.answers ?? []);
    return {
      success: true,
      data: result,
    };
  }

  @Get('result')
  @UseGuards(FirebaseAuthGuard)
  async getResult(@Request() req: any) {
    const result = await this.discService.getLatestResult(req.user.uid);
    return {
      success: true,
      data: result,
    };
  }
}
