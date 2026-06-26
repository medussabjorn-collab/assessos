'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Users, TrendingUp, Award, AlertCircle, Loader } from 'lucide-react';

interface DashboardData {
  summary: {
    totalLeaders: number;
    avgLeadershipIndex: number;
    healthRating: string;
    distribution: Record<string, number>;
  };
  leadershipData: Array<{
    userId: string;
    userName: string;
    email: string;
    department: string;
    leadershipIndex: number;
    tier: string;
    successorReadiness: number;
  }>;
  topPerformers: any[];
  developmentPriorities: any[];
  succession: {
    ready_now: any[];
    ready_2yr: any[];
    ready_5yr: any[];
    not_ready: any[];
  };
}

const TIER_PILL: Record<string, string> = {
  exceptional: 'bg-violet-100 text-violet-800',
  strong:      'bg-brand-100 text-brand-700',
  solid:       'bg-amber-100 text-amber-800',
  emerging:    'bg-orange-100 text-orange-800',
};

const HEALTH_COLOR: Record<string, string> = {
  Exceptional:     'text-violet-600',
  Strong:          'text-brand-600',
  Healthy:         'text-green-600',
  'Needs Attention': 'text-amber-600',
  'At Risk':       'text-red-600',
};

export default function CHRODashboard() {
  const { user, tenantId } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/analytics/dashboard');
        setDashboard(response.data.data);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user, tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!dashboard) return <div className="p-8 text-subtle">No data available</div>;

  const { summary, leadershipData, topPerformers, developmentPriorities, succession } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">Organization Leadership Health</h1>
        <p className="text-subtle">CHRO Dashboard &amp; Succession Pipeline</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Total Leaders</p>
              <p className="text-3xl font-bold text-ink mt-2">{summary.totalLeaders}</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-500">
              <Users className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Avg Leadership Index</p>
              <p className="text-3xl font-bold text-ink mt-2">{summary.avgLeadershipIndex.toFixed(2)}</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-accent-teal">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Health Status</p>
              <p className={`text-2xl font-bold mt-2 ${HEALTH_COLOR[summary.healthRating] ?? 'text-ink'}`}>
                {summary.healthRating}
              </p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-500">
              <Award className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <p className="text-subtle text-sm font-medium mb-3">Distribution</p>
          <div className="space-y-1 text-xs">
            <p className="text-violet-600"><strong>{summary.distribution.exceptional}</strong> Exceptional</p>
            <p className="text-brand-600"><strong>{summary.distribution.strong}</strong> Strong</p>
            <p className="text-amber-600"><strong>{summary.distribution.solid}</strong> Solid</p>
            <p className="text-orange-600"><strong>{summary.distribution.emerging}</strong> Emerging</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="frost-card p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Top Performers</h2>
          <div className="space-y-3">
            {topPerformers.map((leader, idx) => (
              <div key={leader.userId} className="flex items-center justify-between pb-3 border-b border-hairline last:border-b-0">
                <div>
                  <p className="font-semibold text-ink text-sm">{idx + 1}. {leader.userName}</p>
                  <p className="text-xs text-subtle">{leader.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand-600">{leader.leadershipIndex.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TIER_PILL[leader.tier] ?? 'bg-hairline text-subtle'}`}>
                    {leader.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Succession Pipeline */}
        <div className="frost-card p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Succession Pipeline</h2>
          <div className="space-y-4">
            {[
              { label: 'Ready Now',       key: 'ready_now', bar: 'bg-green-500',      text: 'text-green-600' },
              { label: 'Ready in 2 Yrs',  key: 'ready_2yr', bar: 'bg-brand-500',      text: 'text-brand-600' },
              { label: 'Ready in 5 Yrs',  key: 'ready_5yr', bar: 'bg-amber-500',      text: 'text-amber-600' },
            ].map(({ label, key, bar, text }) => {
              const count = succession[key as keyof typeof succession].length;
              const pct = leadershipData.length ? Math.min(100, (count / leadershipData.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-subtle">{label}</span>
                    <span className={`text-sm font-bold ${text}`}>{count}</span>
                  </div>
                  <div className="w-full bg-hairline rounded-full h-2">
                    <div className={`${bar} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Development Priorities */}
      <div className="frost-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-accent-coral" />
          <h2 className="text-lg font-bold text-ink">Development Priorities</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {developmentPriorities.map((leader) => (
            <div key={leader.userId} className="border-l-4 border-accent-coral pl-4 py-2">
              <p className="font-semibold text-ink text-sm">{leader.userName}</p>
              <p className="text-xs text-subtle mb-2">{leader.department}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TIER_PILL[leader.tier] ?? 'bg-hairline text-subtle'}`}>
                  {leader.tier}
                </span>
                <span className="text-xs font-bold text-ink">
                  {leader.leadershipIndex.toFixed(2)}/5
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
