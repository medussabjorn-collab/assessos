'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader, Star, Plus, X, ShieldAlert } from 'lucide-react';

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

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'decline_to_state', label: 'Decline to state' },
];
const RACE_OPTIONS = [
  { value: 'hispanic_or_latino', label: 'Hispanic or Latino' },
  { value: 'white', label: 'White' },
  { value: 'black_or_african_american', label: 'Black or African American' },
  { value: 'native_hawaiian_or_pacific_islander', label: 'Native Hawaiian or Pacific Islander' },
  { value: 'asian', label: 'Asian' },
  { value: 'american_indian_or_alaska_native', label: 'American Indian or Alaska Native' },
  { value: 'two_or_more_races', label: 'Two or more races' },
  { value: 'decline_to_state', label: 'Decline to state' },
];
const AGE_OPTIONS = [
  { value: 'under_40', label: 'Under 40' },
  { value: 'forty_and_over', label: '40 and over' },
  { value: 'decline_to_state', label: 'Decline to state' },
];
const CONSENT_SCOPES = [
  { value: 'facial_detection', label: 'Facial detection' },
  { value: 'eye_tracking', label: 'Eye tracking' },
  { value: 'voice_analysis', label: 'Voice analysis' },
];

export default function HiringPipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [complianceCandidateId, setComplianceCandidateId] = useState<string | null>(null);
  const [selfId, setSelfId] = useState({ gender: '', raceEthnicity: '', ageBand: '' });
  const [consentScope, setConsentScope] = useState<string[]>([]);
  const [retentionDays, setRetentionDays] = useState(90);
  const [complianceStatus, setComplianceStatus] = useState<string | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [complianceBusy, setComplianceBusy] = useState(false);

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

  const openCompliance = (candidateId: string) => {
    setComplianceCandidateId(candidateId);
    setSelfId({ gender: '', raceEthnicity: '', ageBand: '' });
    setConsentScope([]);
    setRetentionDays(90);
    setComplianceStatus(null);
    setComplianceError(null);
  };

  const toggleScope = (scope: string) => {
    setConsentScope((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const submitSelfId = async () => {
    if (!complianceCandidateId) return;
    setComplianceBusy(true);
    setComplianceError(null);
    try {
      await api.post(`/api/compliance/candidates/${complianceCandidateId}/self-id`, {
        gender: selfId.gender || undefined,
        raceEthnicity: selfId.raceEthnicity || undefined,
        ageBand: selfId.ageBand || undefined,
      });
      setComplianceStatus('Self-ID recorded.');
    } catch (err: any) {
      setComplianceError(
        err?.response?.data?.message ?? 'Failed to submit self-ID.',
      );
    } finally {
      setComplianceBusy(false);
    }
  };

  const grantConsent = async () => {
    if (!complianceCandidateId || consentScope.length === 0) return;
    setComplianceBusy(true);
    setComplianceError(null);
    try {
      await api.post(`/api/compliance/candidates/${complianceCandidateId}/biometric-consent`, {
        scope: consentScope,
        retentionDays,
      });
      setComplianceStatus('Biometric consent granted.');
    } catch (err: any) {
      setComplianceError(
        err?.response?.data?.message ?? 'Failed to grant consent.',
      );
    } finally {
      setComplianceBusy(false);
    }
  };

  const revokeConsent = async () => {
    if (!complianceCandidateId) return;
    setComplianceBusy(true);
    setComplianceError(null);
    try {
      await api.post(`/api/compliance/candidates/${complianceCandidateId}/biometric-consent/revoke`);
      setComplianceStatus('Biometric consent revoked.');
    } catch (err: any) {
      setComplianceError(
        err?.response?.data?.message ?? 'Failed to revoke consent.',
      );
    } finally {
      setComplianceBusy(false);
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

      {complianceCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="frost-card w-full max-w-lg p-6 bg-surface max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink">Compliance</h2>
              <button
                onClick={() => setComplianceCandidateId(null)}
                className="text-subtle hover:text-ink transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-600">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>
                Provisional: EEOC/BIPA best practice is for the candidate to submit this
                themselves. This form lets a recruiter record it on their behalf until a
                candidate-facing intake portal exists — treat data collected here as not
                fully compliant with that separation requirement.
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">Voluntary self-identification (EEO)</h3>
                <div className="space-y-2">
                  <select
                    value={selfId.gender}
                    onChange={(e) => setSelfId({ ...selfId, gender: e.target.value })}
                    className={field}
                  >
                    <option value="">Gender…</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={selfId.raceEthnicity}
                    onChange={(e) => setSelfId({ ...selfId, raceEthnicity: e.target.value })}
                    className={field}
                  >
                    <option value="">Race / ethnicity…</option>
                    {RACE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={selfId.ageBand}
                    onChange={(e) => setSelfId({ ...selfId, ageBand: e.target.value })}
                    className={field}
                  >
                    <option value="">Age band…</option>
                    {AGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={submitSelfId}
                    disabled={complianceBusy}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                  >
                    Save self-ID
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline">
                <h3 className="text-sm font-semibold text-ink mb-2">Biometric proctoring consent (BIPA)</h3>
                <div className="space-y-2">
                  {CONSENT_SCOPES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={consentScope.includes(s.value)}
                        onChange={() => toggleScope(s.value)}
                      />
                      {s.label}
                    </label>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-subtle">Retention (days):</span>
                    <input
                      type="number"
                      min={1}
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      className={`${field} w-24`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={grantConsent}
                      disabled={complianceBusy || consentScope.length === 0}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
                    >
                      Grant consent
                    </button>
                    <button
                      onClick={revokeConsent}
                      disabled={complianceBusy}
                      className="flex-1 border border-hairline text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>

              {complianceStatus && <p className="text-sm text-green-500">{complianceStatus}</p>}
              {complianceError && <p className="text-sm text-red-500">{complianceError}</p>}
            </div>
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
                      <div className="flex gap-2">
                        {next && (
                          <button
                            onClick={() => moveCandidate(candidate.id, next)}
                            className="flex-1 text-xs bg-brand-600 hover:bg-brand-700 px-2 py-1 rounded transition"
                          >
                            Advance →
                          </button>
                        )}
                        <button
                          onClick={() => openCompliance(candidate.id)}
                          className="inline-flex items-center gap-1 text-xs border border-hairline hover:bg-canvas px-2 py-1 rounded transition"
                          title="Self-ID & biometric consent"
                        >
                          <ShieldAlert size={12} />
                        </button>
                      </div>
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
