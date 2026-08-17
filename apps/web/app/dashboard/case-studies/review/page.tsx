'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader, ShieldOff, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface RubricDimension {
  dimension: string;
  description: string;
  weight: number;
}

interface PendingCaseStudy {
  id: string;
  title: string;
  industry: string;
  roleLevel: string;
  scenario: string;
  rubric: RubricDimension[];
  status: string;
  createdAt: string;
}

const ROLE_LEVELS = ['manager', 'director', 'vp', 'c_suite'];

const emptyForm = { industry: '', roleLevel: 'director', focusDimension: '' };

export default function CaseStudyReviewPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const allowed = hasPermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE);

  const [pending, setPending] = useState<PendingCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const res = await api.get('/api/case-studies/pending-review');
    setPending(res.data.data ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!allowed) {
      setLoading(false);
      return;
    }
    load()
      .catch(() => setError('Failed to load pending case studies'))
      .finally(() => setLoading(false));
  }, [authLoading, allowed]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.post('/api/case-studies/generate', form);
      setPending((prev) => [res.data.data, ...prev]);
      setForm(emptyForm);
    } catch (err: any) {
      setGenerateError(err?.response?.data?.detail ?? 'Failed to generate case study.');
    } finally {
      setGenerating(false);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/api/case-studies/${id}/approve`);
      setPending((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setBusyId(id);
    try {
      await api.post(`/api/case-studies/${id}/reject`, { reason: rejectReason });
      setPending((prev) => prev.filter((c) => c.id !== id));
      setRejectingId(null);
      setRejectReason('');
    } finally {
      setBusyId(null);
    }
  };

  const field =
    'w-full border border-hairline rounded-lg px-3 py-2 text-sm bg-surface text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">
          Case study review is visible to org admins only. Ask your administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Case Studies"
        title="Case Study Review"
        subtitle="Generate AI executive case studies and approve them before candidates can attempt them."
        icon={Sparkles}
      />

      <form onSubmit={generate} className="frost-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Generate a new case study</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Industry (e.g. healthcare)"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className={field}
          />
          <select
            value={form.roleLevel}
            onChange={(e) => setForm({ ...form, roleLevel: e.target.value })}
            className={field}
          >
            {ROLE_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Focus dimension (e.g. stakeholder alignment under resource constraints)"
            value={form.focusDimension}
            onChange={(e) => setForm({ ...form, focusDimension: e.target.value })}
            className={`${field} sm:col-span-2`}
          />
        </div>
        {generateError && <p className="text-sm text-red-500">{generateError}</p>}
        <button
          type="submit"
          disabled={generating}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles size={16} />}
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            Pending review ({pending.length})
          </h2>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs text-subtle hover:text-ink transition"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="frost-card p-8 text-center text-subtle">No case studies pending review.</div>
        ) : (
          pending.map((c) => (
            <div key={c.id} className="frost-card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <div className="flex items-center gap-2 text-xs text-subtle mt-1">
                  <span className="frost-pill bg-slate-100 text-slate-600">{c.industry}</span>
                  <span className="frost-pill bg-slate-100 text-slate-600">{c.roleLevel}</span>
                </div>
              </div>

              <p className="text-sm text-ink">{c.scenario}</p>

              <div className="space-y-2">
                {c.rubric.map((r) => (
                  <div key={r.dimension} className="flex items-start justify-between gap-4 text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                    <div>
                      <p className="font-medium text-ink">{r.dimension}</p>
                      <p className="text-subtle text-xs mt-0.5">{r.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-subtle">{Math.round(r.weight * 100)}%</span>
                  </div>
                ))}
              </div>

              {rejectingId === c.id ? (
                <div className="space-y-2 pt-2 border-t border-hairline">
                  <input
                    autoFocus
                    placeholder="Reason for rejection…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className={field}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reject(c.id)}
                      disabled={busyId === c.id || !rejectReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      className="flex-1 border border-hairline text-sm font-medium py-2 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-hairline">
                  <button
                    onClick={() => approve(c.id)}
                    disabled={busyId === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(c.id)}
                    disabled={busyId === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 border border-hairline hover:bg-canvas disabled:opacity-50 text-sm font-medium py-2 rounded-lg transition"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
