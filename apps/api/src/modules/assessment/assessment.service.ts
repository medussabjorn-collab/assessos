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

@Injectable({ scope: Scope.REQUEST })
export class AssessmentService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
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

  async startSession(firebaseUid: string, createSessionDto: CreateSessionDto) {
    const { configId } = createSessionDto;
    const userId = await this.resolveUserId(firebaseUid);

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
