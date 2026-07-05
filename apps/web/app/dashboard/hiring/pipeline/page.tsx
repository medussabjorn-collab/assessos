'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader, Star, Plus, X } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  technicalScore: number;
  cultureFitScore: number;
}

interface Position {
  id: string;
  title: string;
}

const STAGES = [
  { key: 'screening', label: 'Screening', color: 'border-blue-500' },
  { key: 'technical', label: 'Technical', color: 'border-purple-500' },
  { key: 'culture_fit', label: 'Culture Fit', color: 'border-cyan-500' },
  { key: 'offer', label: 'Offer', color: 'border-green-500' },
  { key: 'hired', label: 'Hired', color: 'border-emerald-500' },
];

const EMPTY_FORM = {
  jobRoleId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  linkedinUrl: '',
};

export default function HiringPipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candRes, posRes] = await Promise.all([
          api.get('/api/hiring/candidates'),
          api.get('/api/hiring/positions'),
        ]);
        setCandidates(candRes.data.data ?? []);
        setPositions(posRes.data.data ?? []);
      } catch {
        setError('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const moveCandidate = async (id: string, newStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
    );
    try {
      await api.post(`/api/hiring/candidates/${id}/stage`, { stage: newStage });
    } catch {
      // Optimistic update already applied.
    }
  };

  const nextStage = (stage: string) => {
    const idx = STAGES.findIndex((s) => s.key === stage);
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1].key : null;
  };

  const submitCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.post('/api/hiring/candidates', {
        jobRoleId: form.jobRoleId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
      });
      const created = res.data.data;
      setCandidates((prev) => [
        {
          id: created.id,
          name: `${created.firstName} ${created.lastName}`,
          role: created.roleTitle,
          stage: created.stage,
          technicalScore: created.technicalScore ?? 0,
          cultureFitScore: created.cultureFitScore ?? 0,
        },
        ...prev,
      ]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError('Failed to add candidate. Check the fields and try again.');
    } finally {
      setSubmitting(false);
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

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hiring Pipeline</h1>
          <p className="text-subtle">Move candidates through each evaluation stage</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Add Candidate
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="frost-card w-full max-w-md p-6 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink">Add Candidate</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-subtle hover:text-ink transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitCandidate} className="space-y-3">
              <select
                required
                value={form.jobRoleId}
                onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })}
                className={field}
              >
                <option value="" disabled>
                  Select position…
                </option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className={field}
                />
                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className={field}
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={field}
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={field}
              />
              <input
                placeholder="LinkedIn URL (optional)"
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                className={field}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
              >
                {submitting ? 'Adding…' : 'Add to Screening'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const inStage = candidates.filter((c) => c.stage === stage.key);
          return (
            <div key={stage.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{stage.label}</h2>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">
                  {inStage.length}
                </span>
              </div>

              <div className="space-y-3">
                {inStage.map((candidate) => {
                  const next = nextStage(candidate.stage);
                  return (
                    <div
                      key={candidate.id}
                      className={`bg-canvas border-l-4 ${stage.color} border border-hairline rounded-lg p-3`}
                    >
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-subtle mb-2">{candidate.role}</div>
                      <div className="flex gap-3 text-xs mb-3">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-brand-500" />
                          Tech {candidate.technicalScore}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-green-400" />
                          Fit {candidate.cultureFitScore}
                        </span>
                      </div>
                      {next && (
                        <button
                          onClick={() => moveCandidate(candidate.id, next)}
                          className="w-full text-xs bg-brand-600 hover:bg-brand-700 px-2 py-1 rounded transition"
                        >
                          Advance →
                        </button>
                      )}
                    </div>
                  );
                })}
                {inStage.length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-hairline rounded-lg">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
