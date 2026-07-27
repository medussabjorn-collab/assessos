import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Heuristic performance-trajectory proxy — NOT a trained forecasting model
// (no LSTM/time-series model, same reasoning as RetentionRiskService and
// PromotionReadinessService: no labeled performance-outcome history exists
// to train or validate against). Deliberately reports a qualitative
// trajectory + the real underlying signals, not a fabricated precise score
// projection ("expected 4.2 in 6 months") — that would imply a forecasting
// precision this heuristic doesn't have.
const METHODOLOGY_VERSION = 'heuristic-v1';

export interface PerformanceForecastResult {
  trajectory: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  confidence: 'low' | 'medium';
  factors: {
    assessmentScoreTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    feedbackTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    dataPoints: number;
    elevatedRetentionRisk: boolean;
  };
  methodologyNote: string;
}

@Injectable({ scope: Scope.REQUEST })
export class PerformanceForecastService {
  private tenantId: string;

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: any,
  ) {
    this.tenantId = request.headers['x-tenant-id'];
  }

  // retentionRiskBand is passed in rather than computed here — the caller
  // (controller) already has RetentionRiskService available and this avoids
  // a second request-scoped service instantiating its own duplicate queries
  // for the same user in the same request.
  async computeForecast(
    userId: string,
    retentionRiskBand?: 'low' | 'medium' | 'high',
  ): Promise<PerformanceForecastResult> {
    const [reports, feedback] = await Promise.all([
      this.prisma.aiReport.findMany({
        where: { tenantId: this.tenantId, userId, status: 'ready' },
        select: { dimensionScores: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.raterFeedback.findMany({
        where: { tenantId: this.tenantId, subjectId: userId, submittedAt: { not: null } },
        select: { ratings: true, submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    const compositeScores = reports.map((r) =>
      this.averageDimensionScore(r.dimensionScores as Record<string, number>),
    );
    const assessmentScoreTrend = this.computeTrend(compositeScores, 2);

    const feedbackAverages = feedback.map((f) => this.avgRating(f.ratings));
    const feedbackTrend = this.computeTrend(feedbackAverages, 0.25);

    const dataPoints = reports.length + feedback.length;
    const elevatedRetentionRisk = retentionRiskBand === 'high';

    const trajectory = this.combineTrends(assessmentScoreTrend, feedbackTrend);

    const result: PerformanceForecastResult = {
      trajectory,
      confidence: dataPoints >= 4 ? 'medium' : 'low',
      factors: {
        assessmentScoreTrend,
        feedbackTrend,
        dataPoints,
        elevatedRetentionRisk,
      },
      methodologyNote:
        'Heuristic performance-trajectory proxy based on the direction of assessment-score and ' +
        '360-feedback history — deliberately a qualitative direction, not a numeric score ' +
        'projection. Not a trained or validated forecasting model — no labeled performance-' +
        'outcome data exists in this system to train or validate one against.' +
        (elevatedRetentionRisk
          ? ' This person also has a high retention-risk signal, which independently raises ' +
            'uncertainty about any performance trajectory.'
          : ''),
    };

    await this.prisma.talentPredictionSnapshot.create({
      data: {
        tenantId: this.tenantId,
        userId,
        predictionType: 'performance_forecast',
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

  private computeTrend(
    values: number[],
    stableThreshold: number,
  ): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (values.length < 2) return 'insufficient_data';
    const midpoint = Math.floor(values.length / 2);
    const earlier = values.slice(0, midpoint);
    const later = values.slice(midpoint);
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const laterAvg = later.reduce((a, b) => a + b, 0) / later.length;
    const delta = laterAvg - earlierAvg;
    if (Math.abs(delta) < stableThreshold) return 'stable';
    return delta > 0 ? 'improving' : 'declining';
  }

  private combineTrends(
    a: 'improving' | 'stable' | 'declining' | 'insufficient_data',
    b: 'improving' | 'stable' | 'declining' | 'insufficient_data',
  ): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (a === 'insufficient_data' && b === 'insufficient_data') return 'insufficient_data';
    if (a === 'insufficient_data') return b;
    if (b === 'insufficient_data') return a;
    if (a === b) return a;
    // Disagreement between assessment scores and 360 feedback — report as
    // stable rather than picking a side arbitrarily.
    return 'stable';
  }
}
