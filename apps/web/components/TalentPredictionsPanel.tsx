'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, HelpCircle, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import {
  getRetentionRisk,
  getPromotionReadiness,
  getPerformanceForecast,
  recordTalentOutcome,
  listTalentOutcomesForUser,
  RetentionRiskResult,
  PromotionReadinessResult,
  PerformanceForecastResult,
  TalentOutcome,
  TalentOutcomeType,
} from '@/lib/talent-analytics';

interface TalentPredictionsPanelProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const TREND_ICON: Record<string, JSX.Element> = {
  improving: <TrendingUp className="w-4 h-4 text-green-600" />,
  declining: <TrendingDown className="w-4 h-4 text-red-600" />,
  stable: <Minus className="w-4 h-4 text-amber-600" />,
  insufficient_data: <HelpCircle className="w-4 h-4 text-subtle" />,
};

const BAND_COLOR: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  high: 'text-red-600 bg-red-50',
};

const TIER_LABEL: Record<string, string> = {
  ready_now: 'Ready Now',
  ready_2yr: 'Ready in 2 Yrs',
  ready_5yr: 'Ready in 5 Yrs',
  not_ready: 'Not Ready',
};

const OUTCOME_LABEL: Record<TalentOutcomeType, string> = {
  departure_voluntary: 'Voluntary departure',
  departure_involuntary: 'Involuntary departure',
  promotion: 'Promotion',
  performance_rating: 'Performance rating',
};

export default function TalentPredictionsPanel({ userId, userName, onClose }: TalentPredictionsPanelProps) {
  const { hasPermission } = useAuth();
  const canRecordOutcomes = hasPermission(PERMISSIONS.USERS_MANAGE);

  const [retention, setRetention] = useState<RetentionRiskResult | null>(null);
  const [promotion, setPromotion] = useState<PromotionReadinessResult | null>(null);
  const [forecast, setForecast] = useState<PerformanceForecastResult | null>(null);
  const [outcomes, setOutcomes] = useState<TalentOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [outcomeType, setOutcomeType] = useState<TalentOutcomeType>('promotion');
  const [occurredAt, setOccurredAt] = useState('');
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, p, f, o] = await Promise.all([
        getRetentionRisk(userId),
        getPromotionReadiness(userId),
        getPerformanceForecast(userId),
        listTalentOutcomesForUser(userId).catch(() => []),
      ]);
      setRetention(r);
      setPromotion(p);
      setForecast(f);
      setOutcomes(o);
    } catch {
      setError('Failed to load predictive analytics for this person.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [userId]);

  const handleRecordOutcome = async () => {
    if (!occurredAt) return;
    setRecording(true);
    try {
      await recordTalentOutcome({
        userId,
        outcomeType,
        occurredAt,
        note: note.trim() || undefined,
      });
      setShowRecordForm(false);
      setNote('');
      setOccurredAt('');
      const fresh = await listTalentOutcomesForUser(userId).catch(() => []);
      setOutcomes(fresh);
    } catch {
      setError('Failed to record outcome.');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="frost-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Predictive profile — {userName}</h2>
          <p className="text-xs text-subtle">
            Heuristic signals, not trained ML predictions — see methodology notes below.
          </p>
        </div>
        <button onClick={onClose} className="text-subtle hover:text-ink">
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && retention && promotion && forecast && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-hairline rounded-lg p-4">
            <p className="text-xs font-medium text-subtle mb-1">Retention risk</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BAND_COLOR[retention.riskBand]}`}>
                {retention.riskBand.toUpperCase()}
              </span>
              <span className="text-lg font-bold text-ink">{retention.riskScore}</span>
            </div>
            <p className="text-xs text-subtle mt-2">
              Feedback trend: {TREND_ICON[retention.factors.feedbackTrend]} {retention.factors.feedbackTrend.replace('_', ' ')}
            </p>
            <p className="text-xs text-subtle">
              {retention.factors.daysSinceLastActivity != null
                ? `${retention.factors.daysSinceLastActivity}d since last activity`
                : 'No activity recorded'}
            </p>
          </div>

          <div className="border border-hairline rounded-lg p-4">
            <p className="text-xs font-medium text-subtle mb-1">Promotion readiness</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                {TIER_LABEL[promotion.tier]}
              </span>
              <span className="text-lg font-bold text-ink">{promotion.readinessScore}</span>
            </div>
            <p className="text-xs text-subtle mt-2">
              Trend: {TREND_ICON[promotion.factors.leadershipTrend]} {promotion.factors.leadershipTrend.replace('_', ' ')}
            </p>
            <p className="text-xs text-subtle">Tenure: {promotion.factors.tenureDays}d</p>
          </div>

          <div className="border border-hairline rounded-lg p-4">
            <p className="text-xs font-medium text-subtle mb-1">Performance forecast</p>
            <div className="flex items-center gap-2">
              {TREND_ICON[forecast.trajectory]}
              <span className="text-sm font-semibold text-ink capitalize">
                {forecast.trajectory.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-subtle mt-2">Confidence: {forecast.confidence}</p>
            {forecast.factors.elevatedRetentionRisk && (
              <p className="text-xs text-amber-600 mt-1">Elevated retention-risk signal</p>
            )}
          </div>
        </div>
      )}

      {!loading && retention && (
        <details className="text-xs text-subtle">
          <summary className="cursor-pointer font-medium">Methodology notes</summary>
          <p className="mt-2">{retention.methodologyNote}</p>
          <p className="mt-2">{promotion?.methodologyNote}</p>
          <p className="mt-2">{forecast?.methodologyNote}</p>
        </details>
      )}

      <div className="border-t border-hairline pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Recorded outcomes</h3>
          {canRecordOutcomes && !showRecordForm && (
            <button
              onClick={() => setShowRecordForm(true)}
              className="text-xs text-brand-600 hover:underline"
            >
              + Record outcome
            </button>
          )}
        </div>

        {showRecordForm && (
          <div className="bg-canvas border border-hairline rounded-lg p-3 mb-3 space-y-2">
            <div className="flex gap-2">
              <select
                value={outcomeType}
                onChange={(e) => setOutcomeType(e.target.value as TalentOutcomeType)}
                className="flex-1 border border-hairline rounded-lg px-2 py-1.5 text-sm bg-surface"
              >
                {(Object.keys(OUTCOME_LABEL) as TalentOutcomeType[]).map((t) => (
                  <option key={t} value={t}>{OUTCOME_LABEL[t]}</option>
                ))}
              </select>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="border border-hairline rounded-lg px-2 py-1.5 text-sm bg-surface"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)…"
              className="w-full border border-hairline rounded-lg px-2 py-1.5 text-sm bg-surface"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRecordOutcome}
                disabled={!occurredAt || recording}
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
              >
                {recording ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setShowRecordForm(false)}
                className="px-3 py-1.5 rounded-lg border border-hairline text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {outcomes.length === 0 ? (
          <p className="text-xs text-subtle">No outcomes recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {outcomes.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs border-b border-hairline last:border-0 py-1.5">
                <span>{OUTCOME_LABEL[o.outcomeType]}{o.note ? ` — ${o.note}` : ''}</span>
                <span className="text-subtle">{new Date(o.occurredAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
