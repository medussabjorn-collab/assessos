'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { PERMISSIONS } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import {
  Briefcase,
  TrendingUp,
  Award,
  GraduationCap,
  ShieldAlert,
  Scale,
  Loader,
  ShieldOff,
} from 'lucide-react';

interface RequisitionsByRow {
  requisitionId: string;
  title: string;
  applicants: number;
  hired: number;
}

interface TechnicalBenchmarkRow {
  moduleId: string;
  totalGraded: number;
  passed: number;
  passRate: number;
  avgScore: number | null;
}

interface GroupBreakdown {
  category: string;
  total: number;
  suppressed: boolean;
  selected: number | null;
  selectionRate: number | null;
  impactRatio: number | null;
  flagged: boolean | null;
}

interface ExecutiveDashboard {
  requisitions: {
    open: number;
    headcountOpen: number;
    byRequisition: RequisitionsByRow[];
  };
  funnel: {
    totalApplicants: number;
    hiredCount: number;
    conversionRate: number;
    avgTimeToScreening: number | null;
    avgTimeTechnical: number | null;
    avgTimeCultureFit: number | null;
    avgTimeToOffer: number | null;
  };
  leadershipFit: {
    totalLeaders: number;
    avgLeadershipIndex: number;
    healthRating: string;
    distribution: Record<string, number>;
  };
  technicalBenchmark: TechnicalBenchmarkRow[];
  integritySummary: {
    totalIncidents: number;
    openCount: number;
    criticalOpenCount: number;
    bySeverity: Record<string, number>;
  };
  adverseImpact: {
    decidedCandidateCount: number;
    selfIdResponseRate: number;
    dimensions: Record<string, GroupBreakdown[]>;
  };
  generatedAt: string;
}

const HEALTH_COLOR: Record<string, string> = {
  Exceptional: 'text-violet-600',
  Strong: 'text-brand-600',
  Healthy: 'text-green-600',
  'Needs Attention': 'text-amber-600',
  'At Risk': 'text-red-600',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="frost-card p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-subtle text-sm font-medium">{label}</p>
        <Icon className="w-4 h-4 text-subtle" />
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-subtle mt-1">{sub}</p>}
    </div>
  );
}

export default function BoardroomPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/analytics/executive-dashboard');
        setDashboard(res.data.data);
      } catch {
        setError('Failed to load boardroom dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-subtle">Loading…</div>;
  }

  if (!hasPermission(PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW)) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">The boardroom view is visible to org admins only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!dashboard) return <div className="p-8 text-subtle">No data available</div>;

  const { requisitions, funnel, leadershipFit, technicalBenchmark, integritySummary, adverseImpact } = dashboard;
  const flaggedDimensions = Object.entries(adverseImpact.dimensions).filter(([, rows]) =>
    rows.some((r) => r.flagged),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Executive"
        title="Boardroom"
        subtitle="Hiring, leadership fit, technical readiness, integrity, and adverse-impact — one board-ready view."
        icon={Briefcase}
      />

      {/* Requisitions + funnel */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle mb-3">Hiring</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Open Requisitions" value={requisitions.open} sub={`${requisitions.headcountOpen} headcount`} />
          <StatCard icon={TrendingUp} label="Total Applicants" value={funnel.totalApplicants} />
          <StatCard icon={Award} label="Hired" value={funnel.hiredCount} sub={`${funnel.conversionRate.toFixed(1)}% conversion`} />
          <StatCard
            icon={TrendingUp}
            label="Avg Time to Offer"
            value={funnel.avgTimeToOffer !== null ? `${funnel.avgTimeToOffer.toFixed(1)}d` : '—'}
          />
        </div>
        {requisitions.byRequisition.length > 0 && (
          <div className="frost-card p-5 mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-subtle uppercase tracking-wide">
                  <th className="pb-2">Requisition</th>
                  <th className="pb-2">Applicants</th>
                  <th className="pb-2">Hired</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.byRequisition.map((r) => (
                  <tr key={r.requisitionId} className="border-t border-hairline">
                    <td className="py-2 text-ink font-medium">{r.title}</td>
                    <td className="py-2">{r.applicants}</td>
                    <td className="py-2">{r.hired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leadership fit */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle mb-3">Leadership Fit</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Award} label="Total Leaders" value={leadershipFit.totalLeaders} />
          <StatCard icon={TrendingUp} label="Avg Leadership Index" value={leadershipFit.avgLeadershipIndex.toFixed(1)} />
          <div className="frost-card p-5">
            <p className="text-subtle text-sm font-medium mb-1">Org Health</p>
            <p className={`text-2xl font-bold ${HEALTH_COLOR[leadershipFit.healthRating] ?? 'text-ink'}`}>
              {leadershipFit.healthRating}
            </p>
          </div>
        </div>
      </div>

      {/* Technical benchmark */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle mb-3">Technical Benchmark</h2>
        {technicalBenchmark.length === 0 ? (
          <p className="text-subtle text-sm">No module-based assessment results yet.</p>
        ) : (
          <div className="frost-card p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-subtle uppercase tracking-wide">
                  <th className="pb-2 flex items-center gap-1">
                    <GraduationCap size={12} /> Module
                  </th>
                  <th className="pb-2">Graded</th>
                  <th className="pb-2">Passed</th>
                  <th className="pb-2">Pass Rate</th>
                  <th className="pb-2">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {technicalBenchmark.map((m) => (
                  <tr key={m.moduleId} className="border-t border-hairline">
                    <td className="py-2 text-ink font-medium">{m.moduleId}</td>
                    <td className="py-2">{m.totalGraded}</td>
                    <td className="py-2">{m.passed}</td>
                    <td className="py-2">{m.passRate.toFixed(1)}%</td>
                    <td className="py-2">{m.avgScore !== null ? m.avgScore.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integrity + adverse impact */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle mb-3 flex items-center gap-1.5">
            <ShieldAlert size={14} /> Integrity
          </h2>
          <div className="frost-card p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-subtle">Total incidents</span>
              <span className="text-ink font-medium">{integritySummary.totalIncidents}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-subtle">Open</span>
              <span className="text-ink font-medium">{integritySummary.openCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-subtle">Critical &amp; open</span>
              <span className={`font-medium ${integritySummary.criticalOpenCount > 0 ? 'text-red-500' : 'text-ink'}`}>
                {integritySummary.criticalOpenCount}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle mb-3 flex items-center gap-1.5">
            <Scale size={14} /> Adverse Impact
          </h2>
          <div className="frost-card p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-subtle">Decided candidates</span>
              <span className="text-ink font-medium">{adverseImpact.decidedCandidateCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-subtle">Self-ID response rate</span>
              <span className="text-ink font-medium">{(adverseImpact.selfIdResponseRate * 100).toFixed(1)}%</span>
            </div>
            {flaggedDimensions.length > 0 ? (
              <div className="pt-2">
                <p className="text-red-500 text-sm font-medium">
                  {flaggedDimensions.length} dimension{flaggedDimensions.length === 1 ? '' : 's'} flagged (four-fifths rule)
                </p>
              </div>
            ) : (
              <p className="text-subtle text-sm pt-2">No dimensions flagged.</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-subtle text-center">
        Generated {new Date(dashboard.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
