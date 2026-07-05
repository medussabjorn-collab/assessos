'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Users, Briefcase, TrendingUp, Clock, Loader } from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  openPositions: number;
  totalCandidates: number;
  pipelineStages: Record<string, number>;
  avgTimeToHire: string;
  offerAcceptanceRate: number;
  hiringTeamSize: number;
}

interface CandidateRow {
  id: string;
  name: string;
  role: string;
  stage: string;
  technicalScore: number;
  cultureFitScore: number;
}

const PIPELINE_STAGES = [
  { key: 'screening',   label: 'Screening',   color: 'text-blue-600'   },
  { key: 'technical',   label: 'Technical',   color: 'text-purple-600' },
  { key: 'culture_fit', label: 'Culture Fit', color: 'text-cyan-600'   },
  { key: 'offer',       label: 'Offer',       color: 'text-amber-600'  },
  { key: 'hired',       label: 'Hired',       color: 'text-green-600'  },
  { key: 'rejected',    label: 'Rejected',    color: 'text-red-500'    },
];

export default function HiringDashboard() {
  const { user, tenantId } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topCandidates, setTopCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const [dashRes, candRes] = await Promise.all([
          api.get('/api/hiring/dashboard'),
          api.get('/api/hiring/candidates'),
        ]);
        setMetrics(dashRes.data.data);
        const candidates: CandidateRow[] = candRes.data.data ?? [];
        setTopCandidates(
          candidates
            .filter((c) => !['hired', 'rejected'].includes(c.stage))
            .sort(
              (a, b) =>
                b.technicalScore + b.cultureFitScore -
                (a.technicalScore + a.cultureFitScore),
            )
            .slice(0, 3),
        );
      } catch {
        setError('Failed to load hiring dashboard');
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
  if (!metrics) return <div className="p-8 text-subtle">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">Hiring Dashboard</h1>
        <p className="text-subtle">Recruit, evaluate, and hire top talent</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Open Positions</p>
              <p className="text-3xl font-bold text-ink mt-2">{metrics.openPositions}</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-500">
              <Briefcase className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Total Candidates</p>
              <p className="text-3xl font-bold text-ink mt-2">{metrics.totalCandidates}</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-accent-teal">
              <Users className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Avg Time to Hire</p>
              <p className="text-3xl font-bold text-ink mt-2">{metrics.avgTimeToHire}</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-500">
              <Clock className="w-5 h-5" />
            </span>
          </div>
        </div>

        <div className="frost-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-subtle text-sm font-medium">Offer Acceptance</p>
              <p className="text-3xl font-bold text-ink mt-2">{metrics.offerAcceptanceRate}%</p>
            </div>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 text-accent-violet">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs text-subtle mt-2">{metrics.hiringTeamSize} team members</p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="frost-card p-6">
        <h2 className="text-lg font-bold text-ink mb-6">Hiring Pipeline</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {PIPELINE_STAGES.map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <div className={`text-4xl font-bold mb-1 ${color}`}>
                {metrics.pipelineStages[key] ?? 0}
              </div>
              <p className="text-subtle text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions + Top Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="frost-card p-6">
          <h3 className="text-base font-bold text-ink mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium">
              Create New Position
            </button>
            <Link
              href="/dashboard/hiring/pipeline"
              className="block w-full py-2 px-4 bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface transition text-sm font-medium text-center"
            >
              View All Candidates
            </Link>
            <button className="w-full py-2 px-4 bg-canvas border border-hairline text-ink rounded-lg hover:bg-surface transition text-sm font-medium">
              Manage Team Members
            </button>
          </div>
        </div>

        <div className="frost-card p-6">
          <h3 className="text-base font-bold text-ink mb-1">Top Candidates</h3>
          <p className="text-subtle text-xs mb-4">Highest-rated active candidates</p>
          {topCandidates.length ? (
            <div className="space-y-2">
              {topCandidates.map((c) => (
                <div key={c.id} className="p-3 bg-canvas rounded-xl">
                  <p className="font-medium text-ink text-sm">{c.name}</p>
                  <p className="text-xs text-subtle">
                    {c.role} · Tech {c.technicalScore} · Fit {c.cultureFitScore}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-subtle">
              No active candidates yet. Add candidates to see rankings here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
