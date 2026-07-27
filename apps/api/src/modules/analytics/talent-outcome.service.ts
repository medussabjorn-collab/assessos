import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { TalentOutcomeType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RecordOutcomeInput {
  userId: string;
  outcomeType: TalentOutcomeType;
  occurredAt: string; // ISO date
  details?: Record<string, unknown>;
  note?: string;
}

// The ground-truth collection point every prediction service's disclosed
// limitation points at: without real outcomes recorded here, there's
// nothing to ever validate or train the heuristics in
// RetentionRiskService/PromotionReadinessService/PerformanceForecastService
// against. This doesn't make today's predictions any more accurate — it's
// what makes tomorrow's possible.
@Injectable({ scope: Scope.REQUEST })
export class TalentOutcomeService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async recordOutcome(input: RecordOutcomeInput, recordedByUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: input.userId, tenantId: this.tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.talentOutcome.create({
      data: {
        tenantId: this.tenantId,
        userId: input.userId,
        outcomeType: input.outcomeType,
        occurredAt: new Date(input.occurredAt),
        details: (input.details as object) ?? undefined,
        note: input.note,
        recordedById: recordedByUserId,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.talentOutcome.findMany({
      where: { tenantId: this.tenantId, userId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async listRecent(limit = 50) {
    return this.prisma.talentOutcome.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    });
  }
}
