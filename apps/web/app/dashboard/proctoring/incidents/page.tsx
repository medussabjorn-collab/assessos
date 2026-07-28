'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Loader, CheckCircle2, XCircle, FileSearch } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import {
  listIncidents,
  assignIncident,
  reviewIncident,
  resolveAppeal,
  getEvidenceExport,
  ProctoringIncident,
  IncidentResolution,
  EvidenceExport,
} from '@/lib/incidents';
import PageHeader from '@/components/PageHeader';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-hairline text-subtle',
};

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-red-50 text-red-600',
  in_review: 'bg-amber-50 text-amber-600',
  resolved: 'bg-green-50 text-green-600',
  dismissed: 'bg-hairline text-subtle',
};

const RESOLUTION_OPTIONS: { value: IncidentResolution; label: string }[] = [
  { value: 'no_action', label: 'No action' },
  { value: 'warning_issued', label: 'Warning issued' },
  { value: 'result_flagged', label: 'Result flagged' },
  { value: 'result_cancelled', label: 'Result cancelled' },
  { value: 'candidate_banned', label: 'Candidate banned' },
];

export default function IncidentsPage() {
  const { userId, hasPermission } = useAuth();
  const canReview = hasPermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW);
  const canManageAppeals = hasPermission(PERMISSIONS.PROCTORING_INCIDENTS_APPEALS_MANAGE);

  const [incidents, setIncidents] = useState<ProctoringIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<IncidentResolution>('no_action');
  const [note, setNote] = useState('');

  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidenceExport | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setIncidents(
        await listIncidents({
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
        }),
      );
    } catch {
      setError('Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canReview) {
      setLoading(false);
      return;
    }
    load();
  }, [canReview, statusFilter, severityFilter]);

  const assignToMe = async (id: string) => {
    if (!userId) return;
    try {
      const updated = await assignIncident(id, userId);
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      // leave as-is; user can retry
    }
  };

  const submitReview = async (id: string, dismiss: boolean) => {
    try {
      const updated = await reviewIncident(id, { resolution, note: note.trim() || undefined, dismiss });
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setReviewingId(null);
      setNote('');
      setResolution('no_action');
    } catch {
      // leave the form open for retry
    }
  };

  const decideAppeal = async (id: string, outcome: 'upheld' | 'overturned') => {
    try {
      const updated = await resolveAppeal(id, outcome, note.trim() || undefined);
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setNote('');
    } catch {
      // leave as-is; user can retry
    }
  };

  const viewEvidence = async (id: string) => {
    if (evidenceFor === id) {
      setEvidenceFor(null);
      setEvidence(null);
      return;
    }
    setEvidenceFor(id);
    setEvidence(null);
    setEvidenceLoading(true);
    try {
      setEvidence(await getEvidenceExport(id));
    } catch {
      setEvidence(null);
    } finally {
      setEvidenceLoading(false);
    }
  };

  if (!canReview) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="Proctoring Incidents" icon={ShieldAlert} />
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          Only proctoring reviewers can view this queue.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Proctoring Incidents"
        subtitle="Auto-escalated and manually opened proctoring incidents awaiting review."
        icon={ShieldAlert}
      />

      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-surface"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-surface"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="p-2 text-red-400">{error}</div>
      ) : incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          No incidents match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-surface border border-hairline rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SEVERITY_STYLE[inc.severity]}`}>
                    {inc.severity}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[inc.status]}`}>
                    {inc.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-ink capitalize">{inc.category.replace(/_/g, ' ')}</span>
                  {inc.appealStatus === 'requested' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Appeal pending
                    </span>
                  )}
                </div>
                <span className="text-xs text-subtle">{new Date(inc.createdAt).toLocaleString()}</span>
              </div>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-subtle">
                <span>Session: <code className="text-ink">{inc.sessionId.slice(0, 8)}</code></span>
                <span>User: <code className="text-ink">{inc.userId.slice(0, 8)}</code></span>
                <span>Risk score: {inc.riskScore ?? '—'}</span>
                <span>SLA due: {inc.slaDueAt ? new Date(inc.slaDueAt).toLocaleString() : '—'}</span>
              </div>

              {inc.description && <p className="mt-2 text-sm text-subtle">{inc.description}</p>}

              {inc.status === 'resolved' || inc.status === 'dismissed' ? (
                <p className="mt-3 text-xs text-subtle">
                  {inc.status === 'resolved' ? `Resolved: ${inc.resolution?.replace(/_/g, ' ')}` : 'Dismissed'}
                  {inc.resolutionNote && ` — ${inc.resolutionNote}`}
                </p>
              ) : (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {!inc.assignedTo && (
                    <button
                      onClick={() => assignToMe(inc.id)}
                      className="px-3 py-1.5 rounded-lg border border-hairline text-sm hover:bg-canvas transition"
                    >
                      Assign to me
                    </button>
                  )}
                  {reviewingId === inc.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as IncidentResolution)}
                        className="border border-hairline rounded-lg px-2 py-1.5 text-sm bg-canvas"
                      >
                        {RESOLUTION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Review note (optional)…"
                        className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas w-56"
                      />
                      <button
                        onClick={() => submitReview(inc.id, false)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm inline-flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                      <button
                        onClick={() => submitReview(inc.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-hairline text-ink text-sm inline-flex items-center gap-1"
                      >
                        <XCircle size={14} /> Dismiss
                      </button>
                      <button
                        onClick={() => setReviewingId(null)}
                        className="px-3 py-1.5 rounded-lg border border-hairline text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(inc.id)}
                      className="text-sm text-brand-500 hover:underline"
                    >
                      Review
                    </button>
                  )}

                  {inc.appealStatus === 'requested' && canManageAppeals && (
                    <>
                      <button
                        onClick={() => decideAppeal(inc.id, 'upheld')}
                        className="px-3 py-1.5 rounded-lg border border-hairline text-sm hover:bg-canvas transition"
                      >
                        Uphold
                      </button>
                      <button
                        onClick={() => decideAppeal(inc.id, 'overturned')}
                        className="px-3 py-1.5 rounded-lg border border-hairline text-sm hover:bg-canvas transition"
                      >
                        Overturn
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => viewEvidence(inc.id)}
                    className="text-sm text-subtle hover:text-ink inline-flex items-center gap-1 ml-auto"
                  >
                    <FileSearch size={14} /> Evidence
                  </button>
                </div>
              )}

              {evidenceFor === inc.id && (
                <div className="mt-3 border-t border-hairline pt-3 text-xs text-subtle">
                  {evidenceLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : evidence ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <span>Events: {evidence.counts.events}</span>
                      <span>Evidence: {evidence.counts.evidence}</span>
                      <span>Identity checks: {evidence.counts.identityChecks}</span>
                      <span>Env scans: {evidence.counts.environmentScans}</span>
                      <span className={evidence.integrity.valid ? 'text-green-600' : 'text-red-600'}>
                        Chain: {evidence.integrity.valid ? 'verified intact' : `tampered at seq ${evidence.integrity.brokenAtSeq}`}
                      </span>
                    </div>
                  ) : (
                    <span>Failed to load evidence export.</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
