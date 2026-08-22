'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download-file';
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Loader,
  Download,
  ClipboardCheck,
  UserPlus,
  CheckCircle2,
  Star,
  Hourglass,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  openPositions: number;
  totalCandidates: number;
  pipelineStages: Record<string, number>;
  avgTimeToHire: string;
  offerAcceptanceRate: number;
  hiringTeamSize: number;
}

interface RiskAlert {
  type: 'proctoring_incident' | 'identity_drift' | 'stalled_candidate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  subjectName: string;
  subjectEmail: string;
  detail: string;
  createdAt: string;
}

interface RecruiterMetrics {
  activeAssessments: number;
  candidatesInvited: number;
  completedAssessments: number;
  shortlistedCount: number;
  pendingEvaluations: number;
  avgFitScore: number | null;
  riskAlerts: RiskAlert[];
  riskAlertsCount: number;
}

const SEVERITY_PILL: Record<RiskAlert['severity'], string> = {
  low: 'bg-slate-500/10 text-subtle',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-orange-500/10 text-accent-coral',
  critical: 'bg-red-500/10 text-red-500',
};

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
  { key: 'shortlisted', label: 'Shortlisted', color: 'text-teal-600'   },
  { key: 'technical',   label: 'Technical',   color: 'text-purple-600' },
  { key: 'culture_fit', label: 'Culture Fit', color: 'text-cyan-600'   },
  { key: 'offer',       label: 'Offer',       color: 'text-amber-600'  },
  { key: 'hired',       label: 'Hired',       color: 'text-green-600'  },
  { key: 'rejected',    label: 'Rejected',    color: 'text-red-500'    },
];

export default function HiringDashboard() {
  const { user, tenantId } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recruiterMetrics, setRecruiterMetrics] = useState<RecruiterMetrics | null>(null);
  const [topCandidates, setTopCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/api/hiring/candidates/export', { responseType: 'blob' });
      downloadBlob(res.data, 'candidates.csv', 'text/csv');
    } catch {
      // Non-fatal — dashboard already loaded, only the export failed.
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const [dashRes, candRes, recruiterRes] = await Promise.all([
          api.get('/api/hiring/dashboard'),
          api.get('/api/hiring/candidates'),
          api.get('/api/hiring/recruiter-dashboard'),
        ]);
        setMetrics(dashRes.data.data);
        setRecruiterMetrics(recruiterRes.data.data);
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Hiring Dashboard</h1>
          <p className="text-subtle">Recruit, evaluate, and hire top talent</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition text-sm"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Recruiter overview */}
      {recruiterMetrics && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Recruiter Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Active Assessments</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-500">
                  <ClipboardCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.activeAssessments}</p>
            </div>
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Candidates Invited</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-accent-teal">
                  <UserPlus className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.candidatesInvited}</p>
            </div>
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Completed Assessments</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-50 text-accent-violet">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.completedAssessments}</p>
            </div>
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Shortlisted</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-500">
                  <Star className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.shortlistedCount}</p>
            </div>
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Pending Evaluations</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-accent-coral">
                  <Hourglass className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.pendingEvaluations}</p>
            </div>
            <div className="frost-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Average Fit Score</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-accent-teal">
                  <Gauge className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">
                {recruiterMetrics.avgFitScore !== null ? recruiterMetrics.avgFitScore : '—'}
              </p>
            </div>
            <div className="frost-card p-5 col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-subtle text-sm font-medium">Risk Alerts</p>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-500">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-ink mt-3">{recruiterMetrics.riskAlertsCount}</p>
              <p className="text-xs text-subtle mt-1">Proctoring integrity flags + stalled candidates</p>
            </div>
          </div>

          {recruiterMetrics.riskAlerts.length > 0 && (
            <div className="frost-card p-6">
              <h3 className="text-base font-bold text-ink mb-4">Risk Alert Feed</h3>
              <div className="space-y-2">
                {recruiterMetrics.riskAlerts.slice(0, 8).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-canvas rounded-xl">
                    <div className="min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{alert.subjectName}</p>
                      <p className="text-xs text-subtle truncate">{alert.detail}</p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_PILL[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
