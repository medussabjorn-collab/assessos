import { Injectable, BadRequestException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

@Injectable({ scope: Scope.REQUEST })
export class AssessmentService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async startSession(userId: string, createSessionDto: CreateSessionDto) {
    const { configId } = createSessionDto;

    const config = await this.prisma.assessmentConfig.findUnique({
      where: { id: configId },
    });

    if (!config || config.tenantId !== this.tenantId) {
      throw new BadRequestException('Assessment config not found');
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

    return {
      sessionId: session.id,
      pillar: session.pillar,
      timeLimitMin: config.timeLimitMin,
    };
  }

  async getSession(sessionId: string, userId: string) {
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
    userId: string,
    submitAnswersDto: SubmitAnswersDto,
  ) {
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

    const submittedSession = await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'done',
        submittedAt: new Date(),
        answers: submitAnswersDto.answers,
        answersMetadata: submitAnswersDto.metadata,
      },
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
