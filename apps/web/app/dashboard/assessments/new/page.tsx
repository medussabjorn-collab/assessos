'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wand2,
  Loader,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Plus,
  Sparkles,
  UserPlus,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface JobProfile {
  id: string;
  title: string;
  department: string;
  requiredSkills: string[];
  cultureFitDimensions: string[];
}

type AssessmentType = 'technical' | 'leadership' | 'non_it' | 'mixed';

interface Dimension {
  id: string;
  label: string;
  weight: number;
  type: 'likert' | 'sjt';
}

const TYPE_INFO: { key: AssessmentType; label: string; description: string }[] = [
  { key: 'technical', label: 'Technical', description: 'Adaptive, IRT-scored module (coding/technical question bank).' },
  { key: 'leadership', label: 'Leadership', description: 'Fixed-batch Likert-scale competency questions.' },
  { key: 'non_it', label: 'Non-IT', description: 'Fixed-batch situational-judgment scenarios.' },
  { key: 'mixed', label: 'Mixed', description: 'Combine Likert and SJT dimensions in one sitting — pick per dimension.' },
];

const MODULE_IDS = ['technical', 'attitude', 'behavioral', 'psychometric', 'communication'];
const DIFFICULTIES = ['foundational', 'intermediate', 'advanced', 'expert'];

const STEPS = ['Role', 'Type', 'Skills', 'Criteria', 'Blueprint', 'Publish'];

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
}

export default function NewAssessmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1: role
  const [roles, setRoles] = useState<JobProfile[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<JobProfile | null>(null);

  // Step 2: type
  const [type, setType] = useState<AssessmentType>('leadership');
  const [moduleId, setModuleId] = useState('technical');

  // Step 3: dimensions
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  // Step 4: criteria
  const [difficulty, setDifficulty] = useState('intermediate');
  const [timeLimitMin, setTimeLimitMin] = useState(30);
  const [passMark, setPassMark] = useState(60);
  const [questionsPerDimension, setQuestionsPerDimension] = useState(10);

  // Step 5: blueprint
  const [blueprint, setBlueprint] = useState<any>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);

  // Step 6: publish + invite
  const [publishing, setPublishing] = useState(false);
  const [publishedConfigId, setPublishedConfigId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [inviting, setInviting] = useState<Set<string>>(new Set());
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .get('/api/job-roles')
      .then((res) => setRoles(res.data.data ?? []))
      .catch(() => setError('Failed to load job profiles.'))
      .finally(() => setRolesLoading(false));
  }, []);

  const selectRole = (role: JobProfile) => {
    setSelectedRole(role);
    // Pre-populate dimensions from the role's real culture-fit dimensions
    // (Phase 5's Job Profiles catalog) so step 3 isn't a blank slate.
    setDimensions(
      role.cultureFitDimensions.map((id) => ({ id, label: id.replace(/_/g, ' '), weight: 1, type: 'likert' })),
    );
  };

  const applyTypeDefaults = (t: AssessmentType) => {
    setType(t);
    if (t === 'non_it') {
      setDimensions((prev) => prev.map((d) => ({ ...d, type: 'sjt' })));
    } else if (t === 'leadership') {
      setDimensions((prev) => prev.map((d) => ({ ...d, type: 'likert' })));
    }
    // 'mixed' leaves each dimension's existing type as-is, user toggles per-dimension.
    // 'technical' doesn't use dimensions at all — module_id picker instead.
  };

  const addDimension = () => {
    setDimensions((d) => [...d, { id: '', label: '', weight: 1, type: type === 'non_it' ? 'sjt' : 'likert' }]);
  };
  const updateDimension = (i: number, patch: Partial<Dimension>) => {
    setDimensions((d) => d.map((dim, j) => (j === i ? { ...dim, ...patch } : dim)));
  };
  const removeDimension = (i: number) => {
    setDimensions((d) => d.filter((_, j) => j !== i));
  };

  const canAdvance = useMemo(() => {
    if (step === 0) return !!selectedRole;
    if (step === 1) return true;
    if (step === 2) return type === 'technical' || dimensions.every((d) => d.id.trim().length > 0);
    if (step === 3) return timeLimitMin > 0 && passMark > 0 && passMark <= 100;
    return true;
  }, [step, selectedRole, type, dimensions, timeLimitMin, passMark]);

  const goNext = async () => {
    setError(null);
    if (step === 3) {
      // Entering step 4 (blueprint) — generate it now.
      if (type !== 'technical') {
        setBlueprintLoading(true);
        try {
          const res = await api.post('/api/assessments/blueprint', {
            role: selectedRole!.title,
            difficulty,
            dimensions: dimensions.map((d) => ({ id: d.id, label: d.label || d.id, type: d.type })),
            questionsPerDimension,
            timeLimitMin,
          });
          setBlueprint(res.data.data);
        } catch {
          setError('Failed to generate blueprint preview — you can still publish without it.');
        } finally {
          setBlueprintLoading(false);
        }
      } else {
        setBlueprint(null);
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        pillar: selectedRole!.id,
        timeLimitMin,
        passMark,
        difficulty,
        questionsPerDimension,
      };
      if (type === 'technical') {
        body.moduleId = moduleId;
      } else {
        body.dimensions = dimensions.map((d) => ({ id: d.id, label: d.label || d.id, weight: d.weight, type: d.type }));
        body.isSjt = type === 'non_it';
      }
      const res = await api.post('/api/assessment-configs', body);
      setPublishedConfigId(res.data.data.id);

      const candRes = await api.get('/api/hiring/candidates');
      const all: Candidate[] = candRes.data.data ?? [];
      setCandidates(all.filter((c) => c.role === selectedRole!.title));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to publish assessment.');
    } finally {
      setPublishing(false);
    }
  };

  const invite = async (candidateId: string) => {
    setInviting((s) => new Set(s).add(candidateId));
    try {
      await api.post(`/api/hiring/candidates/${candidateId}/invite`);
      setInvited((s) => new Set(s).add(candidateId));
    } catch {
      setError(`Failed to invite one candidate — they may already have an account.`);
    } finally {
      setInviting((s) => {
        const next = new Set(s);
        next.delete(candidateId);
        return next;
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Assessments"
        title="New Assessment"
        subtitle="Select role, choose type, pick skills, set criteria, review an AI-generated blueprint, then publish and invite candidates."
        icon={Wand2}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${
                i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-canvas text-subtle'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-ink' : 'text-subtle'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-hairline" />}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="frost-card p-6">
        {/* Step 0: Role */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Select role</h2>
            <p className="text-sm text-subtle mb-4">Pulled from your Job Profiles catalog.</p>
            {rolesLoading ? (
              <Loader className="w-6 h-6 animate-spin text-brand-500" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`text-left rounded-xl border p-4 transition ${
                      selectedRole?.id === role.id ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface hover:bg-canvas'
                    }`}
                  >
                    <p className="font-medium text-ink">{role.title}</p>
                    <p className="text-xs text-subtle mt-1">{role.department}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Choose assessment type</h2>
            <p className="text-sm text-subtle mb-4">For {selectedRole?.title}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TYPE_INFO.map((t) => (
                <button
                  key={t.key}
                  onClick={() => applyTypeDefaults(t.key)}
                  className={`text-left rounded-xl border p-4 transition ${
                    type === t.key ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface hover:bg-canvas'
                  }`}
                >
                  <p className="font-medium text-ink">{t.label}</p>
                  <p className="text-xs text-subtle mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Skills / competencies */}
        {step === 2 && (
          <div>
            {type === 'technical' ? (
              <>
                <h2 className="text-lg font-bold text-ink mb-1">Technical module</h2>
                <p className="text-sm text-subtle mb-4">Adaptive delivery picks questions from this module's bank.</p>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full max-w-xs border border-hairline rounded-lg px-3 py-2 text-sm bg-canvas capitalize"
                >
                  {MODULE_IDS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-ink mb-1">Skills &amp; competencies</h2>
                <p className="text-sm text-subtle mb-4">
                  Pre-filled from {selectedRole?.title}'s culture-fit dimensions — edit, add, or remove.
                  {type === 'mixed' && ' Toggle each dimension between Likert and SJT.'}
                </p>
                <div className="space-y-2 mb-3">
                  {dimensions.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        placeholder="dimension id"
                        value={d.id}
                        onChange={(e) => updateDimension(i, { id: e.target.value })}
                        className="w-40 border border-hairline rounded-lg px-2 py-1.5 text-sm bg-canvas"
                      />
                      <input
                        placeholder="label"
                        value={d.label}
                        onChange={(e) => updateDimension(i, { label: e.target.value })}
                        className="flex-1 border border-hairline rounded-lg px-2 py-1.5 text-sm bg-canvas"
                      />
                      {type === 'mixed' && (
                        <select
                          value={d.type}
                          onChange={(e) => updateDimension(i, { type: e.target.value as 'likert' | 'sjt' })}
                          className="border border-hairline rounded-lg px-2 py-1.5 text-sm bg-canvas"
                        >
                          <option value="likert">Likert</option>
                          <option value="sjt">SJT</option>
                        </select>
                      )}
                      <button onClick={() => removeDimension(i)} className="text-red-500 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addDimension} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                  <Plus size={12} /> Add dimension
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Criteria */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Difficulty, duration &amp; passing criteria</h2>
            <div className="grid grid-cols-2 gap-4 mt-4 max-w-lg">
              <div>
                <label className="text-xs text-subtle block mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas capitalize"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Time limit (min)</label>
                <input
                  type="number"
                  value={timeLimitMin}
                  onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                  className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Pass mark (%)</label>
                <input
                  type="number"
                  value={passMark}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                  className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                />
              </div>
              {type !== 'technical' && (
                <div>
                  <label className="text-xs text-subtle block mb-1">Questions per dimension</label>
                  <input
                    type="number"
                    value={questionsPerDimension}
                    onChange={(e) => setQuestionsPerDimension(Number(e.target.value))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Blueprint */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-500" /> AI-generated blueprint
            </h2>
            <p className="text-sm text-subtle mb-4">Preview only — nothing here is saved or scored yet.</p>
            {blueprintLoading ? (
              <div className="flex items-center gap-2 text-subtle text-sm">
                <Loader className="w-4 h-4 animate-spin" /> Generating example items…
              </div>
            ) : type === 'technical' ? (
              <div className="rounded-lg bg-canvas p-4 text-sm text-ink">
                Adaptive technical assessment — module <strong className="capitalize">{moduleId}</strong>, up to{' '}
                {timeLimitMin} minutes, pass mark {passMark}%. Items are chosen dynamically by ability level; there's no
                fixed blueprint to preview for adaptive delivery.
              </div>
            ) : blueprint ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-canvas p-3">
                    <p className="text-2xl font-bold text-ink">{blueprint.totalItems}</p>
                    <p className="text-xs text-subtle">total items</p>
                  </div>
                  <div className="rounded-lg bg-canvas p-3">
                    <p className="text-2xl font-bold text-ink">{blueprint.dimensionCount}</p>
                    <p className="text-xs text-subtle">dimensions</p>
                  </div>
                  <div className="rounded-lg bg-canvas p-3">
                    <p className="text-2xl font-bold text-ink">{blueprint.estimatedDurationMin}m</p>
                    <p className="text-xs text-subtle">estimated duration</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {blueprint.exampleItems?.map((ex: any, i: number) => (
                    <div key={i} className="border border-hairline rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-brand-600">{ex.dimensionLabel || ex.dimensionId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-subtle uppercase">{ex.type}</span>
                      </div>
                      {ex.example?.error ? (
                        <p className="text-xs text-red-500">{ex.example.error}</p>
                      ) : ex.type === 'sjt' ? (
                        <>
                          <p className="text-sm text-ink">{ex.example?.scenario}</p>
                          <ul className="mt-2 space-y-1">
                            {ex.example?.options?.map((o: any, j: number) => (
                              <li key={j} className="text-xs text-subtle">
                                {o.isBestPractice ? '✓' : '·'} {o.text}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-sm text-ink">{ex.example?.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-subtle">No blueprint generated — you can still publish without it.</p>
            )}
          </div>
        )}

        {/* Step 5: Publish + invite */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Publish &amp; invite candidates</h2>
            {!publishedConfigId ? (
              <>
                <p className="text-sm text-subtle mb-4">
                  This publishes a real assessment for {selectedRole?.title}. Existing candidates for this role can be
                  invited right after.
                </p>
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
                >
                  {publishing ? 'Publishing…' : 'Publish assessment'}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-sm text-brand-700">
                  <Check size={15} /> Assessment published for {selectedRole?.title}.
                </div>
                <h3 className="text-sm font-semibold text-ink mb-2">Candidates for this role</h3>
                {candidates.length === 0 ? (
                  <p className="text-sm text-subtle">
                    No existing candidates for this role yet — add them from the{' '}
                    <a href="/dashboard/hiring/pipeline" className="text-brand-600 hover:underline">
                      Pipeline
                    </a>{' '}
                    page, then invite from there.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((c) => (
                      <div key={c.id} className="flex items-center justify-between border border-hairline rounded-lg px-3 py-2">
                        <span className="text-sm text-ink">{c.name}</span>
                        {invited.has(c.id) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-brand-600">
                            <Check size={12} /> Invited
                          </span>
                        ) : (
                          <button
                            onClick={() => invite(c.id)}
                            disabled={inviting.has(c.id)}
                            className="inline-flex items-center gap-1 text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50"
                          >
                            {inviting.has(c.id) ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                            Invite
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => router.push('/dashboard/assessments')}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-hairline text-sm text-ink hover:bg-canvas"
                >
                  <UserPlus size={14} /> Done — back to Assessments
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="flex justify-between mt-4">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-subtle hover:bg-canvas disabled:opacity-40 transition"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <button
            onClick={goNext}
            disabled={!canAdvance || blueprintLoading}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50 transition"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
