import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class ScenarioReviewService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async listPendingReview() {
    return this.prisma.generatedScenario.findMany({
      where: { tenantId: this.tenantId, status: 'pending_review' },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findOwn(id: string) {
    const scenario = await this.prisma.generatedScenario.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!scenario) {
      throw new NotFoundException('Generated scenario not found');
    }
    return scenario;
  }

  async approve(id: string, reviewerUserId: string) {
    await this.findOwn(id);
    return this.prisma.generatedScenario.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: reviewerUserId,
        reviewedAt: new Date(),
      },
    });
  }

  async reject(id: string, reviewerUserId: string, reason: string) {
    await this.findOwn(id);
    return this.prisma.generatedScenario.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedById: reviewerUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }
}
