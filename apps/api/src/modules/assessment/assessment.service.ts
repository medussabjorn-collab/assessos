import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { SubmitAdaptiveAnswerDto } from './dto/submit-adaptive-answer.dto';
import { WebhookDispatchService } from '../webhooks/webhook-dispatch.service';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { AdaptiveTestingService, AnsweredItem } from '../question-bank/adaptive-testing.service';
import { IrtAbility } from '../question-bank/three-pl-irt.service';
import { PillarQuestionService } from '../pillar-questions/pillar-question.service';
import { IdentityService } from '../proctoring/identity.service';

// Fallback adaptive-test length when a module config's totalQuestions isn't
// set to something sane (0 default from a config that was only ever meant
// for the fixed-batch pillar path).
const DEFAULT_MIN_ADAPTIVE_QUESTIONS = 10;

@Injectable({ scope: Scope.REQUEST })
export class AssessmentService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private webhookDispatch: WebhookDispatchService,
    private questionBank: QuestionBankService,
    private adaptiveTesting: AdaptiveTestingService,
    private pillarQuestions: PillarQuestionService,
    private identity: IdentityService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  // Never send the answer key to the candidate.
  private stripAnswerKey(question: any) {
    const { correctIndex, explanation, ...safe } = question;
    return safe;
  }

  private async resolveUserId(firebaseUid: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.id;
  }

  // The frontend Timer auto-submits at timeLimitMin, but that's a client
  // behavior a candidate can bypass by calling the API directly. This is
  // the actual enforcement.
  private assertWithinTimeLimit(startedAt: Date | null, timeLimitMin: number) {
    if (!startedAt || timeLimitMin <= 0) return;
    const deadline = new Date(startedAt.getTime() + timeLimitMin * 60_000);
    if (new Date() > deadline) {
      throw new BadRequestException('Time limit for this assessment session has expired');
    }
  }

  // IdentityService.checkBinding sets this on a device/IP/biometric mismatch
  // mid-session, but nothing previously stopped the session from continuing
  // to accept answers afterward.
  private assertNotRevoked(proctoringRevoked: boolean) {
    if (proctoringRevoked) {
      throw new BadRequestException(
        'This session has been revoked due to a proctoring integrity check failure',
      );
    }
  }

  async startSession(firebaseUid: string, createSessionDto: CreateSessionDto) {
    const { configId } = createSessionDto;
    const userId = await this.resolveUserId(firebaseUid);

    const config = await this.prisma.assessmentConfig.findUnique({
      where: { id: configId },
    });

    if (!config || config.tenantId !== this.tenantId) {
      throw new BadRequestException('Assessment config not found');
    }

    if (config.aiProctoring) {
      const verified = await this.identity.isVerifiedForUser(this.tenantId, userId);
      if (!verified) {
        throw new BadRequestException(
          'Identity verification required before starting this assessment',
        );
      }
    }

    // Module-based configs (technical/attitude/behavioral/psychometric/
    // communication) run a real-time computerized adaptive test against the
    // Mongo question bank; pillar configs (leadership) keep the existing
    // fixed-batch flow untouched.
    if (config.moduleId) {
      return this.startAdaptiveSession(userId, config);
    }

    const session = await this.prisma.assessmentSession.create({
      data: {
        tenantId: this.tenantId,
        userId,
        configId,
        pillar: config.pillar,
        status: 'active',
        startedAt: new Date(),
      },
    });

    // Fixed-form question set, one dimension at a time — real, admin-
    // editable Likert items (replaces the old hardcoded mock array).
    const dimensions = (config.dimensions ?? []) as Array<{ id: string; label?: string; weight?: number }>;
    const questionsByDimension = await Promise.all(
      dimensions.map((d) => this.pillarQuestions.getQuestionsForDimension(this.tenantId, d.id)),
    );
    // Mongo docs use _id; the frontend's Question/QuestionCard shape expects
    // a plain `id` string — normalize at this API boundary so no frontend
    // component needs to know the storage detail.
    const questions = questionsByDimension.flat().map((q: any) => ({
      id: String(q._id),
      dimensionId: q.dimensionId,
      text: q.text,
      options: q.options,
    }));

    return {
      sessionId: session.id,
      pillar: session.pillar,
      timeLimitMin: config.timeLimitMin,
      questions,
    };
  }

  private async startAdaptiveSession(
    userId: string,
    config: { id: string; moduleId: string | null; totalQuestions: number; timeLimitMin: number },
  ) {
    const moduleId = config.moduleId as string;
    const minQuestions = config.totalQuestions > 0 ? config.totalQuestions : DEFAULT_MIN_ADAPTIVE_QUESTIONS;

    const first = await this.adaptiveTesting.next(this.tenantId, {
      moduleId,
      answered: [],
      initialTheta: 0,
      minQuestions,
    });

    if (!first.nextQuestionId) {
      throw new BadRequestException(`No questions available for module "${moduleId}"`);
    }

    const session = await this.prisma.assessmentSession.create({
      data: {
        tenantId: this.tenantId,
        userId,
        configId: config.id,
        pillar: moduleId,
        status: 'active',
        startedAt: new Date(),
        moduleId: moduleId as any,
        questionOrder: [first.nextQuestionId],
      },
    });

    const question = await this.questionBank.get(this.tenantId, first.nextQuestionId);

    return {
      sessionId: session.id,
      moduleId,
      timeLimitMin: config.timeLimitMin,
      question: this.stripAnswerKey(question),
      progress: { answered: 0, total: minQuestions },
      ability: first.ability,
    };
  }

  async submitAdaptiveAnswer(sessionId: string, firebaseUid: string, dto: SubmitAdaptiveAnswerDto) {
    const userId = await this.resolveUserId(firebaseUid);
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { config: true },
    });

    if (!session || session.tenantId !== this.tenantId || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }
    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }
    if (!session.moduleId) {
      throw new BadRequestException('This session is not an adaptive module assessment');
    }
    this.assertNotRevoked(session.proctoringRevoked);
    this.assertWithinTimeLimit(session.startedAt, session.config.timeLimitMin);

    const pendingQuestionId = session.questionOrder[session.currentIndex];
    if (!pendingQuestionId || pendingQuestionId !== dto.questionId) {
      throw new BadRequestException('This is not the current pending question for this session');
    }

    const question: any = await this.questionBank.get(this.tenantId, dto.questionId);
    const isCorrect = dto.selectedIndex === question.correctIndex;

    await this.prisma.sessionAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      update: {
        selectedOption: dto.selectedIndex,
        isCorrect,
        timeSpentSec: dto.timeTakenSec,
        answeredAt: new Date(),
      },
      create: {
        tenantId: this.tenantId,
        sessionId,
        questionId: dto.questionId,
        selectedOption: dto.selectedIndex,
        isCorrect,
        timeSpentSec: dto.timeTakenSec,
        answeredAt: new Date(),
      },
    });

    const answeredRows = await this.prisma.sessionAnswer.findMany({
      where: { sessionId },
      select: { questionId: true, isCorrect: true },
    });
    const answered: AnsweredItem[] = answeredRows.map((r) => ({
      questionId: r.questionId,
      correct: r.isCorrect ?? false,
    }));

    const minQuestions =
      session.config.totalQuestions > 0 ? session.config.totalQuestions : DEFAULT_MIN_ADAPTIVE_QUESTIONS;
    const next = await this.adaptiveTesting.next(this.tenantId, {
      moduleId: session.moduleId as string,
      answered,
      initialTheta: 0,
      minQuestions,
    });

    const newCurrentIndex = session.currentIndex + 1;

    if (next.terminate) {
      return this.finalizeAdaptiveSession(session, userId, answered, next.ability, newCurrentIndex, isCorrect);
    }

    const nextQuestionOrder = [...session.questionOrder, next.nextQuestionId as string];
    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { questionOrder: nextQuestionOrder, currentIndex: newCurrentIndex },
    });

    const nextQuestion = await this.questionBank.get(this.tenantId, next.nextQuestionId as string);

    return {
      done: false,
      correct: isCorrect,
      question: this.stripAnswerKey(nextQuestion),
      progress: { answered: newCurrentIndex, total: minQuestions },
      ability: next.ability,
    };
  }

  private async finalizeAdaptiveSession(
    session: { id: string; moduleId: string | null; config: { passMark: number } },
    userId: string,
    answered: AnsweredItem[],
    ability: IrtAbility,
    answeredCount: number,
    lastAnswerCorrect: boolean,
  ) {
    const correctAnswers = answered.filter((a) => a.correct).length;
    const wrongAnswers = answered.length - correctAnswers;
    const score = answered.length > 0 ? Math.round((correctAnswers / answered.length) * 100) : 0;
    const passed = score >= session.config.passMark;

    const submittedSession = await this.prisma.assessmentSession.update({
      where: { id: session.id },
      data: { status: 'done', submittedAt: new Date(), currentIndex: answeredCount },
    });

    await this.prisma.assessmentResult.upsert({
      where: { sessionId: session.id },
      update: {
        score,
        passed,
        totalQuestions: answered.length,
        correctAnswers,
        wrongAnswers,
        skippedAnswers: 0,
        irtTheta: ability.theta,
        irtSe: ability.se,
        irtTier: ability.tier,
      },
      create: {
        tenantId: this.tenantId,
        userId,
        sessionId: session.id,
        moduleId: session.moduleId as any,
        score,
        passed,
        totalQuestions: answered.length,
        correctAnswers,
        wrongAnswers,
        skippedAnswers: 0,
        irtTheta: ability.theta,
        irtSe: ability.se,
        irtTier: ability.tier,
      },
    });

    // Fire-and-forget — a slow/down subscriber must never block submission.
    void this.webhookDispatch.dispatch(this.tenantId, 'assessment.completed', {
      sessionId: submittedSession.id,
      userId,
      pillar: submittedSession.pillar,
    });

    return {
      done: true,
      correct: lastAnswerCorrect,
      result: {
        score,
        passed,
        totalQuestions: answered.length,
        correctAnswers,
        wrongAnswers,
        ability,
      },
    };
  }

  async getSession(sessionId: string, firebaseUid: string) {
    const userId = await this.resolveUserId(firebaseUid);
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { config: true },
    });

    if (!session || session.tenantId !== this.tenantId || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    return session;
  }

  async submitAnswers(
    sessionId: string,
    firebaseUid: string,
    submitAnswersDto: SubmitAnswersDto,
  ) {
    const userId = await this.resolveUserId(firebaseUid);
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { config: true },
    });

    if (!session || session.tenantId !== this.tenantId || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }
    this.assertNotRevoked(session.proctoringRevoked);
    this.assertWithinTimeLimit(session.startedAt, session.config.timeLimitMin);

    // Enrich each raw answer with the real question text + selected
    // option's meaning before persisting — the AI report prompt
    // (report-generator.service.ts) just JSON.stringifies whatever's
    // stored here, so without this it only ever saw opaque ids and had
    // no actual basis to score anything.
    const enrichedAnswers = await Promise.all(
      submitAnswersDto.answers.map(async (a) => {
        const question: any = await this.pillarQuestions.getQuestionById(this.tenantId, a.questionId);
        const option = question?.options?.find((o: any) => o.id === a.selectedOptionId);
        return {
          ...a,
          dimensionId: question?.dimensionId ?? null,
          questionText: question?.text ?? null,
          selectedOptionText: option?.text ?? null,
          selectedOptionValue: option?.value ?? null,
        };
      }),
    );

    const submittedSession = await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'done',
        submittedAt: new Date(),
        answers: enrichedAnswers,
        answersMetadata: submitAnswersDto.metadata,
      },
    });

    // Fire-and-forget — a slow/down subscriber must never block submission.
    void this.webhookDispatch.dispatch(this.tenantId, 'assessment.completed', {
      sessionId: submittedSession.id,
      userId,
      pillar: submittedSession.pillar,
    });

    return {
      sessionId: submittedSession.id,
      status: submittedSession.status,
      message: 'Assessment submitted. Request your report from the Reports page.',
    };
  }

  async getConfig(configId: string) {
    const config = await this.prisma.assessmentConfig.findUnique({
      where: { id: configId },
    });

    if (!config || config.tenantId !== this.tenantId) {
      throw new BadRequestException('Config not found');
    }

    return config;
  }
}
