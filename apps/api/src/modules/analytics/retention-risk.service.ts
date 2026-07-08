import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Heuristic engagement-risk proxy — NOT a trained ML model. #19 asked for
// an XGBoost retention classifier; that needs labeled outcome data
// (who actually left, when) that doesn't exist anywhere in this schema —
// same blocker as #8's validation study. Building a "model" with nothing
// to train or validate against would just be a hollow wrapper around
// arbitrary numbers, so this is a transparent weighted heuristic over real
// engagement signals instead, in the same style as LeadershipIndexService's
// hand-set dimension weights. Promotion-readiness/performance-forecast/
// culture-fit from the same request aren't implemented — they'd need even
// weaker proxy signal than retention risk has, not stronger.
const WEIGHTS = {
  inactivity: 0.4,
  abandonment: 0.3,
  feedbackDecline: 0.3,
};

// Days of no activity (no submitted session, no feedback received) treated
// as maximum inactivity signal. Arbitrary but disclosed threshold, not a
// derived/validated cutoff.
const INACTIVITY_CEILING_DAYS = 90;

export interface RetentionRiskResult {
  riskScore: number; // 0-100, higher = more risk signal
  riskBand: 'low' | 'medium' | 'high';
  factors: {
    daysSinceLastActivity: number | null;
    incompleteSessionRatio: number;
    feedbackTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  };
  methodologyNote: string;
}

@Injectable({ scope: Scope.REQUEST })
export class RetentionRiskService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  async computeRiskScore(userId: string): Promise<RetentionRiskResult> {
    const [sessions, feedback] = await Promise.all([
      this.prisma.assessmentSession.findMany({
        where: { tenantId: this.tenantId, userId },
        select: { status: true, createdAt: true, submittedAt: true },
      }),
      this.prisma.raterFeedback.findMany({
        where: { tenantId: this.tenantId, subjectId: userId, submittedAt: { not: null } },
        select: { ratings: true, submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    const lastActivity = this.mostRecentDate([
      ...sessions.map((s) => s.submittedAt ?? s.createdAt),
      ...feedback.map((f) => f.submittedAt!),
    ]);
    const daysSinceLastActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / 86_400_000)
      : null;
    const inactivityScore =
      daysSinceLastActivity == null
        ? 100
        : Math.min(100, (daysSinceLastActivity / INACTIVITY_CEILING_DAYS) * 100);

    const staleThresholdMs = 14 * 86_400_000;
    const abandonedCount = sessions.filter(
      (s) => s.status === 'active' && Date.now() - s.createdAt.getTime() > staleThresholdMs,
    ).length;
    const incompleteSessionRatio = sessions.length ? abandonedCount / sessions.length : 0;
    const abandonmentScore = incompleteSessionRatio * 100;

    const { trend, score: feedbackDeclineScore } = this.computeFeedbackTrend(feedback);

    const weightsUsed =
      trend === 'insufficient_data'
        ? { inactivity: 0.6, abandonment: 0.4, feedbackDecline: 0 }
        : WEIGHTS;

    const riskScore = Math.round(
      inactivityScore * weightsUsed.inactivity +
        abandonmentScore * weightsUsed.abandonment +
        feedbackDeclineScore * weightsUsed.feedbackDecline,
    );

    return {
      riskScore,
      riskBand: riskScore >= 66 ? 'high' : riskScore >= 33 ? 'medium' : 'low',
      factors: {
        daysSinceLastActivity,
        incompleteSessionRatio: Math.round(incompleteSessionRatio * 100) / 100,
        feedbackTrend: trend,
      },
      methodologyNote:
        'Heuristic engagement-risk proxy based on activity recency, session abandonment, and ' +
        'feedback-rating trend. Not a trained or validated predictive model — no labeled ' +
        'retention outcome data exists in this system to train or validate one against.',
    };
  }

  private mostRecentDate(dates: Date[]): Date | null {
    if (dates.length === 0) return null;
    return dates.reduce((latest, d) => (d > latest ? d : latest));
  }

  private computeFeedbackTrend(
    feedback: Array<{ ratings: unknown }>,
  ): { trend: RetentionRiskResult['factors']['feedbackTrend']; score: number } {
    if (feedback.length < 2) {
      return { trend: 'insufficient_data', score: 0 };
    }

    const avgRating = (ratings: unknown): number => {
      const values = Object.values((ratings as Record<string, number>) ?? {});
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const midpoint = Math.floor(feedback.length / 2);
    const earlier = feedback.slice(0, midpoint).map((f) => avgRating(f.ratings));
    const later = feedback.slice(midpoint).map((f) => avgRating(f.ratings));
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const laterAvg = later.reduce((a, b) => a + b, 0) / later.length;

    const delta = laterAvg - earlierAvg;
    if (Math.abs(delta) < 0.25) return { trend: 'stable', score: 0 };
    if (delta > 0) return { trend: 'improving', score: 0 };
    // Declining, on a typical 1-5 rating scale: scale the drop to 0-100.
    const score = Math.min(100, (Math.abs(delta) / 4) * 100);
    return { trend: 'declining', score };
  }
}
