import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Returns a user's latest results across whichever psychometric models they
// have completed, side by side. Deliberately does NOT compute a fabricated
// cross-instrument mapping (e.g. "DISC D maps to Big Five score X") — that
// would be inventing a formula with no validated basis, the same category
// of dishonesty declined for #8's validation study and the extended-DISC
// dimensions. If a real, cited DISC/Big-Five correlational mapping is
// wanted later, it needs a specific published source to implement against.
@Injectable({ scope: Scope.REQUEST })
export class CompositeProfileService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async getCompositeProfile(userId: string) {
    const results = await this.prisma.psychometricResult.findMany({
      where: { tenantId: this.tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });

    // Latest result per model, since a user may have retaken a model.
    const latestByModel = new Map<string, (typeof results)[number]>();
    for (const r of results) {
      if (!latestByModel.has(r.modelKey)) {
        latestByModel.set(r.modelKey, r);
      }
    }

    return {
      userId,
      profiles: [...latestByModel.values()].map((r) => ({
        modelKey: r.modelKey,
        scores: r.scores,
        interpretation: r.interpretation,
        completedAt: r.createdAt,
      })),
    };
  }
}
