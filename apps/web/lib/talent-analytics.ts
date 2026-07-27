'use client';

import { api } from './api';

// Mirrors apps/api/src/modules/analytics/{retention-risk,promotion-readiness,
// performance-forecast,talent-outcome}.service.ts — keep in sync. All three
// prediction endpoints are disclosed heuristics, not trained ML models (see
// each result's methodologyNote) — the UI must never present them as more
// certain than that.

export type RiskBand = 'low' | 'medium' | 'high';
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'insufficient_data';
export type SuccessionTier = 'ready_now' | 'ready_2yr' | 'ready_5yr' | 'not_ready';

export interface RetentionRiskResult {
  riskScore: number;
  riskBand: RiskBand;
  factors: {
    daysSinceLastActivity: number | null;
    incompleteSessionRatio: number;
    feedbackTrend: TrendDirection;
  };
  methodologyNote: string;
}

export interface PromotionReadinessResult {
  readinessScore: number;
  tier: SuccessionTier;
  factors: {
    leadershipIndex: number | null;
    tenureDays: number;
    recentFeedbackAvg: number | null;
    leadershipTrend: TrendDirection;
    reportCount: number;
  };
  methodologyNote: string;
}

export interface PerformanceForecastResult {
  trajectory: TrendDirection;
  confidence: 'low' | 'medium';
  factors: {
    assessmentScoreTrend: TrendDirection;
    feedbackTrend: TrendDirection;
    dataPoints: number;
    elevatedRetentionRisk: boolean;
  };
  methodologyNote: string;
}

export type TalentOutcomeType =
  | 'departure_voluntary'
  | 'departure_involuntary'
  | 'promotion'
  | 'performance_rating';

export interface TalentOutcome {
  id: string;
  userId: string;
  outcomeType: TalentOutcomeType;
  occurredAt: string;
  details: Record<string, unknown> | null;
  note: string | null;
  recordedById: string;
  recordedAt: string;
  user?: { name: string; email: string };
}

export async function getRetentionRisk(userId: string): Promise<RetentionRiskResult> {
  const res = await api.get(`/api/analytics/retention-risk/${userId}`);
  return res.data.data;
}

export async function getPromotionReadiness(userId: string): Promise<PromotionReadinessResult> {
  const res = await api.get(`/api/analytics/promotion-readiness/${userId}`);
  return res.data.data;
}

export async function getPerformanceForecast(userId: string): Promise<PerformanceForecastResult> {
  const res = await api.get(`/api/analytics/performance-forecast/${userId}`);
  return res.data.data;
}

export async function recordTalentOutcome(input: {
  userId: string;
  outcomeType: TalentOutcomeType;
  occurredAt: string;
  details?: Record<string, unknown>;
  note?: string;
}): Promise<TalentOutcome> {
  const res = await api.post('/api/analytics/talent-outcomes', input);
  return res.data.data;
}

export async function listTalentOutcomesForUser(userId: string): Promise<TalentOutcome[]> {
  const res = await api.get(`/api/analytics/talent-outcomes/${userId}`);
  return res.data.data;
}
