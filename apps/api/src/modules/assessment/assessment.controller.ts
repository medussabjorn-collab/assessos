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
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { AssessmentService } from './assessment.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { ScenarioGeneratorService, GenerateScenarioParams } from './scenario-generator.service';
import { ScenarioReviewService } from './scenario-review.service';
import { IrtAdaptiveTestingService, GradedResponse } from './irt-adaptive-testing.service';
import { QuestionBankService } from './question-bank.service';

@Controller('api/assessments')
export class AssessmentController {
  constructor(
    private assessmentService: AssessmentService,
    private scenarioGenerator: ScenarioGeneratorService,
    private scenarioReview: ScenarioReviewService,
    private irt: IrtAdaptiveTestingService,
    private questionBank: QuestionBankService,
  ) {}

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

  // #20: GenAI SJT scenario generation, gated behind human review.
  @Post('scenarios/generate')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE)
  async generateScenario(@Body() body: GenerateScenarioParams) {
    const scenario = await this.scenarioGenerator.generate(body);
    return { success: true, data: scenario };
  }

  @Get('scenarios/pending-review')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE)
  async listPendingScenarios() {
    const scenarios = await this.scenarioReview.listPendingReview();
    return { success: true, data: scenarios };
  }

  @Post('scenarios/:id/approve')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE)
  async approveScenario(@Request() req: any, @Param('id') id: string) {
    const scenario = await this.scenarioReview.approve(id, req.resolvedUser.id);
    return { success: true, data: scenario };
  }

  @Post('scenarios/:id/reject')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE)
  async rejectScenario(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const scenario = await this.scenarioReview.reject(id, req.resolvedUser.id, body.reason);
    return { success: true, data: scenario };
  }

  // #11: IRT/CAT engine, stateless. Not yet wired into the live session
  // flow — AssessmentService.submitAnswers still takes a fixed answer batch,
  // not one-item-at-a-time adaptive delivery. That session-flow rewrite is
  // separate, larger scope than shipping a correct estimation engine.
  @Post('irt/estimate-ability')
  @UseGuards(FirebaseAuthGuard)
  estimateAbility(@Body() body: { responses: GradedResponse[] }) {
    const responses = (body.responses ?? []).map((r) => ({
      params: this.irt.defaultParametersFor(r.questionId),
      category: r.category,
    }));
    const estimate = this.irt.estimateAbility(responses);
    return { success: true, data: estimate };
  }

  @Post('irt/next-item')
  @UseGuards(FirebaseAuthGuard)
  selectNextItem(
    @Body() body: { currentTheta: number; answeredQuestionIds: string[]; dimensionId?: string },
  ) {
    const pool = this.questionBank.getQuestions(body.dimensionId);
    const answered = new Set(body.answeredQuestionIds ?? []);
    const availableParams = pool
      .filter((q) => !answered.has(q.id))
      .map((q) => this.irt.defaultParametersFor(q.id));

    const next = this.irt.selectNextItem(body.currentTheta, availableParams);
    return { success: true, data: next };
  }
}
