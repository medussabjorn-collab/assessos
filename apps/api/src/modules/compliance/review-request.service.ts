import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// GDPR Art. 22 / CPRA: lets a data subject request human review of an
// automated decision (an AiReport), and lets an org admin resolve it.
@Injectable({ scope: Scope.REQUEST })
export class ReviewRequestService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  private async resolveUserId(firebaseUid: string) {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, tenantId: this.tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async requestReview(reportId: string, firebaseUid: string, reason?: string) {
    const user = await this.resolveUserId(firebaseUid);

    const report = await this.prisma.aiReport.findFirst({
      where: { id: reportId, tenantId: this.tenantId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (report.userId !== user.id) {
      throw new ForbiddenException('You can only request review of your own report');
    }

    return this.prisma.decisionReviewRequest.create({
      data: {
        tenantId: this.tenantId,
        reportId,
        requestedById: user.id,
        reason,
      },
    });
  }

  async listPending() {
    return this.prisma.decisionReviewRequest.findMany({
      where: { tenantId: this.tenantId, status: { in: ['pending', 'in_review'] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolve(
    requestId: string,
    resolverFirebaseUid: string,
    resolutionNote: string,
  ) {
    const resolver = await this.resolveUserId(resolverFirebaseUid);

    const reviewRequest = await this.prisma.decisionReviewRequest.findFirst({
      where: { id: requestId, tenantId: this.tenantId },
    });
    if (!reviewRequest) {
      throw new NotFoundException('Review request not found');
    }

    return this.prisma.decisionReviewRequest.update({
      where: { id: requestId },
      data: {
        status: 'resolved',
        resolvedById: resolver.id,
        resolutionNote,
        resolvedAt: new Date(),
      },
    });
  }
}
