'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface GroupBreakdown {
  category: string;
  total: number;
  selected?: number;
  selectionRate?: number;
  impactRatio?: number;
  flagged?: boolean;
  suppressed: boolean;
}

interface AdverseImpactReport {
  jobRoleId: string | null;
  decidedCandidateCount: number;
  selfIdResponseRate: number;
  dimensions: {
    gender: GroupBreakdown[];
    raceEthnicity: GroupBreakdown[];
    ageBand: GroupBreakdown[];
  };
  generatedAt: string;
}

interface ReviewRequest {
  id: string;
  reportId: string;
  requestedById: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  gender: 'Gender',
  raceEthnicity: 'Race / Ethnicity',
  ageBand: 'Age Band',
};

function DimensionTable({ title, groups }: { title: string; groups: GroupBreakdown[] }) {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5">
      <h3 className="font-semibold text-ink mb-3">{title}</h3>
      {groups.length === 0 ? (
        <p className="text-sm text-subtle">No self-ID data for this dimension.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-subtle border-b border-hairline">
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Selection rate</th>
              <th className="pb-2 font-medium">Impact ratio</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.category} className="border-b border-hairline last:border-0">
                <td className="py-2 capitalize">{g.category.replace(/_/g, ' ')}</td>
                <td className="py-2">{g.total}</td>
                <td className="py-2">
                  {g.suppressed ? '—' : g.selectionRate != null ? `${Math.round(g.selectionRate * 100)}%` : '—'}
                </td>
                <td className="py-2">
                  {g.suppressed ? '—' : g.impactRatio != null ? g.impactRatio.toFixed(2) : '—'}
                </td>
                <td className="py-2">
                  {g.suppressed ? (
                    <span className="text-xs text-subtle">Suppressed (n&lt;5)</span>
                  ) : g.flagged ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                      <AlertTriangle size={12} /> Below 4/5ths rule
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 size={12} /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CompliancePage() {
  const { role } = useAuth();
  const isAdmin = role === 'org_admin' || role === 'super_admin';

  const [report, setReport] = useState<AdverseImpactReport | null>(null);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [biasRes, reqRes] = await Promise.all([
          api.get('/api/compliance/bias-audit'),
          api.get('/api/compliance/review-requests'),
        ]);
        setReport(biasRes.data.data);
        setRequests(reqRes.data.data ?? []);
      } catch {
        setError('Failed to load compliance data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  const resolve = async (requestId: string) => {
    if (!resolutionNote.trim()) return;
    try {
      await api.post(`/api/compliance/review-requests/${requestId}/resolve`, { resolutionNote });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setResolvingId(null);
      setResolutionNote('');
    } catch {
      // leave the request in the list; the note stays for retry
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="Compliance" icon={ShieldAlert} />
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          Only org admins can view compliance reports.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-2 text-red-400">{error}</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Compliance"
        subtitle="Adverse-impact analysis and pending decision-review requests."
        icon={ShieldAlert}
      />

      {report && (
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4 text-sm text-subtle">
            <span>{report.decidedCandidateCount} decided candidates</span>
            <span>{Math.round(report.selfIdResponseRate * 100)}% self-ID response rate</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(Object.keys(report.dimensions) as Array<keyof typeof report.dimensions>).map((dim) => (
              <DimensionTable key={dim} title={DIMENSION_LABELS[dim]} groups={report.dimensions[dim]} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-hairline rounded-xl p-5">
        <h3 className="font-semibold text-ink mb-3">Pending review requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-subtle">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="border border-hairline rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Report <code className="text-xs">{r.reportId.slice(0, 8)}</code> — requested by{' '}
                    <code className="text-xs">{r.requestedById.slice(0, 8)}</code>
                  </span>
                  <span className="text-xs text-subtle">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.reason && <p className="text-sm text-subtle mt-2">&quot;{r.reason}&quot;</p>}

                {resolvingId === r.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Resolution note…"
                      className="flex-1 border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                    />
                    <button
                      onClick={() => resolve(r.id)}
                      disabled={!resolutionNote.trim()}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => {
                        setResolvingId(null);
                        setResolutionNote('');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-hairline text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(r.id)}
                    className="mt-3 text-sm text-brand-500 hover:underline"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
