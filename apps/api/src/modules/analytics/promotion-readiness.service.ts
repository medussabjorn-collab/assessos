import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadershipIndexService } from './leadership-index.service';

// Heuristic promotion-readiness proxy — NOT a trained ML model, same
// reasoning as RetentionRiskService: no labeled promotion-outcome data
// exists (who was actually promoted, when) to train or validate a real
// model against. TalentOutcomeService starts collecting that ground truth
// going forward; this stays a transparent weighted heuristic until there's
// enough paired prediction→outcome history to do better.
const WEIGHTS = {
  leadershipIndex: 0.4,
  feedback: 0.25,
  trend: 0.2,
  tenure: 0.15,
};

const METHODOLOGY_VERSION = 'heuristic-v1';

// Below this, there isn't enough tenure to have a meaningful track record
// regardless of score — an arbitrary but disclosed floor, not derived from
// any validated promotion-timeline data.
const MIN_TENURE_DAYS_FOR_FULL_SCORE = 365;

export interface PromotionReadinessResult {
  readinessScore: number; // 0-100
  tier: 'ready_now' | 'ready_2yr' | 'ready_5yr' | 'not_ready';
  factors: {
    leadershipIndex: number | null;
    tenureDays: number;
    recentFeedbackAvg: number | null; // 0-5 scale
    leadershipTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    reportCount: number;
  };
  methodologyNote: string;
}

@Injectable({ scope: Scope.REQUEST })
export class PromotionReadinessService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    private leadershipIndex: LeadershipIndexService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async computeReadiness(userId: string): Promise<PromotionReadinessResult> {
    const [user, reports, feedback] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, tenantId: this.tenantId },
        select: { createdAt: true },
      }),
      this.prisma.aiReport.findMany({
        where: { tenantId: this.tenantId, userId, status: 'ready' },
        select: { dimensionScores: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.raterFeedback.findMany({
        where: { tenantId: this.tenantId, subjectId: userId, submittedAt: { not: null } },
        select: { ratings: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
    ]);

    const tenureDays = user
      ? Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000)
      : 0;
    const tenureScore = Math.min(100, (tenureDays / MIN_TENURE_DAYS_FOR_FULL_SCORE) * 100);

    const compositeScores = reports.map((r) =>
      this.averageDimensionScore(r.dimensionScores as Record<string, number>),
    );
    const latestComposite = compositeScores.length
      ? compositeScores[compositeScores.length - 1]
      : null;
    // AiReport dimensionScores are 0-100 already (report-generator.service.ts's
    // prompt contract) — no rescale needed, unlike LeadershipIndexService's
    // 0-5 scale inputs from the pillar-assessment flow.
    const leadershipIndexScore = latestComposite;

    const recentFeedbackAvg = feedback.length
      ? feedback.reduce((sum, f) => sum + this.avgRating(f.ratings), 0) / feedback.length
      : null;
    const feedbackScore = recentFeedbackAvg != null ? (recentFeedbackAvg / 5) * 100 : null;

    const { trend, trendScore } = this.computeTrend(compositeScores);

    const weightsUsed = {
      leadershipIndex: leadershipIndexScore != null ? WEIGHTS.leadershipIndex : 0,
      feedback: feedbackScore != null ? WEIGHTS.feedback : 0,
      trend: trend !== 'insufficient_data' ? WEIGHTS.trend : 0,
      tenure: WEIGHTS.tenure,
    };
    const totalWeight = Object.values(weightsUsed).reduce((a, b) => a + b, 0);

    const readinessScore = totalWeight
      ? Math.round(
          ((leadershipIndexScore ?? 0) * weightsUsed.leadershipIndex +
            (feedbackScore ?? 0) * weightsUsed.feedback +
            trendScore * weightsUsed.trend +
            tenureScore * weightsUsed.tenure) /
            totalWeight,
        )
      : 0;

    const tier = this.leadershipIndex.assignSuccessionTier(readinessScore);

    const result: PromotionReadinessResult = {
      readinessScore,
      tier,
      factors: {
        leadershipIndex: leadershipIndexScore != null ? Math.round(leadershipIndexScore) : null,
        tenureDays,
        recentFeedbackAvg: recentFeedbackAvg != null ? Math.round(recentFeedbackAvg * 100) / 100 : null,
        leadershipTrend: trend,
        reportCount: reports.length,
      },
      methodologyNote:
        'Heuristic promotion-readiness proxy based on latest leadership assessment score, ' +
        'recent 360 feedback, leadership-score trend across assessments, and tenure. Not a ' +
        'trained or validated predictive model — no labeled promotion-outcome data exists in ' +
        'this system to train or validate one against.',
    };

    await this.prisma.talentPredictionSnapshot.create({
      data: {
        tenantId: this.tenantId,
        userId,
        predictionType: 'promotion_readiness',
        result: result as unknown as object,
        methodologyVersion: METHODOLOGY_VERSION,
      },
    });

    return result;
  }

  private averageDimensionScore(scores: Record<string, number>): number {
    const values = Object.values(scores ?? {});
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private avgRating(ratings: unknown): number {
    const values = Object.values((ratings as Record<string, number>) ?? {});
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  // Same midpoint-split trend method as RetentionRiskService.computeFeedbackTrend,
  // but rewarding improvement (for readiness) instead of only penalizing decline.
  private computeTrend(
    values: number[],
  ): { trend: PromotionReadinessResult['factors']['leadershipTrend']; trendScore: number } {
    if (values.length < 2) {
      return { trend: 'insufficient_data', trendScore: 0 };
    }
    const midpoint = Math.floor(values.length / 2);
    const earlier = values.slice(0, midpoint);
    const later = values.slice(midpoint);
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const laterAvg = later.reduce((a, b) => a + b, 0) / later.length;

    const delta = laterAvg - earlierAvg;
    if (Math.abs(delta) < 2) return { trend: 'stable', trendScore: 50 };
    if (delta < 0) return { trend: 'declining', trendScore: Math.max(0, 50 - Math.min(50, Math.abs(delta))) };
    return { trend: 'improving', trendScore: Math.min(100, 50 + Math.min(50, delta)) };
  }
}
