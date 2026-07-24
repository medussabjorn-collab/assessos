import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../auth/permissions.service';
import { PERMISSIONS } from '../auth/permissions.constants';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Injectable({ scope: Scope.REQUEST })
export class RaterFeedbackService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  private async resolveUser(firebaseUid: string) {
    const user = await this.permissions.resolveUser(firebaseUid, this.tenantId);
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async submitFeedback(
    sessionId: string,
    raterFirebaseUid: string,
    dto: SubmitFeedbackDto,
  ) {
    const rater = await this.resolveUser(raterFirebaseUid);

    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.tenantId !== this.tenantId) {
      throw new BadRequestException('Session not found');
    }

    const feedback = await this.prisma.raterFeedback.upsert({
      where: { sessionId_raterId: { sessionId, raterId: rater.id } },
      update: {
        relationship: dto.relationship,
        ratings: dto.ratings,
        comments: dto.comments,
        isAnonymous: dto.isAnonymous ?? true,
        submittedAt: new Date(),
      },
      create: {
        tenantId: this.tenantId,
        sessionId,
        subjectId: session.userId,
        raterId: rater.id,
        relationship: dto.relationship,
        ratings: dto.ratings,
        comments: dto.comments,
        isAnonymous: dto.isAnonymous ?? true,
        submittedAt: new Date(),
      },
    });

    return feedback;
  }

  async listForSession(sessionId: string, requesterFirebaseUid: string) {
    const requester = await this.resolveUser(requesterFirebaseUid);

    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.tenantId !== this.tenantId) {
      throw new BadRequestException('Session not found');
    }

    const isSubject = session.userId === requester.id;
    const isReviewer = this.permissions.hasPermission(requester, PERMISSIONS.RATER_FEEDBACK_REVIEW);
    if (!isSubject && !isReviewer) {
      throw new ForbiddenException('Not authorized to view this feedback');
    }

    const entries = await this.prisma.raterFeedback.findMany({
      where: { sessionId, tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // The subject sees anonymous entries with rater identity stripped;
    // managers/admins always see who submitted what.
    if (isSubject && !isReviewer) {
      return entries.map((entry) =>
        entry.isAnonymous ? { ...entry, raterId: null } : entry,
      );
    }
    return entries;
  }
}
