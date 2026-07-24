'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Plus, History, Loader, ShieldOff, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import { socketService } from '@/lib/socket';
import PageHeader from '@/components/PageHeader';

interface Dimension {
  id: string;
  label: string;
  weight: number;
}

interface AssessmentConfig {
  id: string;
  assessmentGroupId: string;
  version: number;
  isCurrent: boolean;
  publishedAt: string;
  pillar: string;
  dimensions: Dimension[];
  timeLimitMin: number;
  passMark: number;
  aiProctoring: boolean;
  benchmarkGroup: string | null;
  moduleId: string | null;
  negativeMarking: boolean;
  negativePenalty: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  adaptiveMode: boolean;
  totalQuestions: number;
}

const MODULE_IDS = ['', 'technical', 'attitude', 'behavioral', 'psychometric', 'communication'];

const emptyDraft = (): Omit<AssessmentConfig, 'id' | 'assessmentGroupId' | 'version' | 'isCurrent' | 'publishedAt'> => ({
  pillar: 'leadership',
  dimensions: [],
  timeLimitMin: 30,
  passMark: 60,
  aiProctoring: true,
  benchmarkGroup: null,
  moduleId: null,
  negativeMarking: false,
  negativePenalty: 0.25,
  shuffleQuestions: true,
  shuffleOptions: true,
  adaptiveMode: false,
  totalQuestions: 100,
});

export default function AssessmentsPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const allowed = hasPermission(PERMISSIONS.ASSESSMENT_CONFIGS_MANAGE);

  const [configs, setConfigs] = useState<AssessmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<AssessmentConfig[] | null>(null);
  const [versionsGroupId, setVersionsGroupId] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<{ groupId: string; version: number } | null>(null);

  const selected = configs.find((c) => c.assessmentGroupId === selectedGroupId) ?? null;

  const load = async () => {
    const res = await api.get('/api/assessment-configs');
    setConfigs(res.data.data ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!allowed) {
      setLoading(false);
      return;
    }
    load()
      .catch(() => setError('Failed to load assessments.'))
      .finally(() => setLoading(false));
  }, [authLoading, allowed]);

  // Realtime: every connected admin sees a published version instantly.
  // Always refresh the list quietly; if the assessment currently open in the
  // editor was just updated by someone else, surface it instead of silently
  // letting a later save clobber their published change.
  useEffect(() => {
    if (!allowed) return;
    const unsubscribe = socketService.on('assessment_config.published', (data: unknown) => {
      const published = data as AssessmentConfig;
      load().catch(() => {});
      if (published?.assessmentGroupId && published.assessmentGroupId === selectedGroupId) {
        setLiveNotice({ groupId: published.assessmentGroupId, version: published.version });
      }
    });
    return unsubscribe;
  }, [allowed, selectedGroupId]);

  const startCreate = () => {
    setCreating(true);
    setSelectedGroupId(null);
    setVersionsGroupId(null);
    setDraft(emptyDraft());
    setError(null);
    setLiveNotice(null);
  };

  const selectConfig = (config: AssessmentConfig) => {
    setCreating(false);
    setSelectedGroupId(config.assessmentGroupId);
    setVersionsGroupId(null);
    setLiveNotice(null);
    setDraft({
      pillar: config.pillar,
      dimensions: config.dimensions,
      timeLimitMin: config.timeLimitMin,
      passMark: config.passMark,
      aiProctoring: config.aiProctoring,
      benchmarkGroup: config.benchmarkGroup,
      moduleId: config.moduleId,
      negativeMarking: config.negativeMarking,
      negativePenalty: config.negativePenalty,
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
      adaptiveMode: config.adaptiveMode,
      totalQuestions: config.totalQuestions,
    });
    setError(null);
  };

  const viewVersions = async (groupId: string) => {
    setVersionsGroupId(groupId);
    try {
      const res = await api.get(`/api/assessment-configs/${groupId}/versions`);
      setVersions(res.data.data ?? []);
    } catch {
      setError('Failed to load version history.');
    }
  };

  const addDimension = () => {
    setDraft((d) => ({ ...d, dimensions: [...d.dimensions, { id: '', label: '', weight: 0 }] }));
  };

  const updateDimension = (index: number, patch: Partial<Dimension>) => {
    setDraft((d) => ({
      ...d,
      dimensions: d.dimensions.map((dim, i) => (i === index ? { ...dim, ...patch } : dim)),
    }));
  };

  const removeDimension = (index: number) => {
    setDraft((d) => ({ ...d, dimensions: d.dimensions.filter((_, i) => i !== index) }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (creating) {
        await api.post('/api/assessment-configs', draft);
        setCreating(false);
      } else if (selected) {
        await api.post(`/api/assessment-configs/${selected.assessmentGroupId}/versions`, draft);
      }
      await load();
      setSelectedGroupId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">
          Assessment authoring is visible to org admins only. Ask your administrator for access.
        </p>
      </div>
    );
  }

  const showEditor = creating || !!selected;

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Assessments"
        subtitle="Author assessment definitions. Every save publishes a new version — past versions stay frozen for already-graded reports."
        icon={ClipboardList}
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700 transition"
          >
            <Plus size={15} /> New assessment
          </button>
        }
      />

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          {configs.map((c) => (
            <div
              key={c.assessmentGroupId}
              className={`rounded-xl border p-4 transition ${
                selectedGroupId === c.assessmentGroupId ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface'
              }`}
            >
              <button onClick={() => selectConfig(c)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink capitalize">{c.moduleId ?? c.pillar}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-subtle">v{c.version}</span>
                </div>
                <p className="text-xs text-subtle mt-1">
                  {c.timeLimitMin} min · pass {c.passMark} · {c.dimensions.length} dimension
                  {c.dimensions.length === 1 ? '' : 's'}
                </p>
              </button>
              <button
                onClick={() => viewVersions(c.assessmentGroupId)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-subtle hover:text-brand-600"
              >
                <History size={11} /> Version history
              </button>
            </div>
          ))}
          {configs.length === 0 && (
            <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-subtle text-sm">
              No assessments yet.
            </div>
          )}
        </div>

        <div>
          {versionsGroupId && versions && (
            <div className="bg-surface border border-hairline rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink">Version history</h3>
                <button onClick={() => setVersionsGroupId(null)} className="text-subtle hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm border border-hairline rounded-lg px-3 py-2"
                  >
                    <span>
                      v{v.version} — pass {v.passMark}, {v.timeLimitMin} min
                    </span>
                    <div className="flex items-center gap-2">
                      {v.isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">current</span>
                      )}
                      <span className="text-xs text-subtle">{new Date(v.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showEditor && !versionsGroupId && (
            <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
              Select an assessment to edit, or create a new one.
            </div>
          )}

          {showEditor && (
            <div className="bg-surface border border-hairline rounded-xl p-5">
              {liveNotice && selected && liveNotice.groupId === selected.assessmentGroupId && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm text-amber-600">
                  <span>
                    Another admin just published v{liveNotice.version} of this assessment. Your changes here are
                    based on an older version.
                  </span>
                  <button
                    onClick={() => selectConfig(selected)}
                    className="shrink-0 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-xs font-medium transition"
                  >
                    Reload latest
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-subtle block mb-1">Pillar</label>
                  <input
                    value={draft.pillar}
                    onChange={(e) => setDraft((d) => ({ ...d, pillar: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Module (leave blank for pillar-based)</label>
                  <select
                    value={draft.moduleId ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, moduleId: e.target.value || null }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas capitalize"
                  >
                    {MODULE_IDS.map((m) => (
                      <option key={m} value={m}>
                        {m || '(none)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Time limit (min)</label>
                  <input
                    type="number"
                    value={draft.timeLimitMin}
                    onChange={(e) => setDraft((d) => ({ ...d, timeLimitMin: Number(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Pass mark</label>
                  <input
                    type="number"
                    value={draft.passMark}
                    onChange={(e) => setDraft((d) => ({ ...d, passMark: Number(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Total questions</label>
                  <input
                    type="number"
                    value={draft.totalQuestions}
                    onChange={(e) => setDraft((d) => ({ ...d, totalQuestions: Number(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Benchmark group</label>
                  <input
                    value={draft.benchmarkGroup ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, benchmarkGroup: e.target.value || null }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                {(
                  [
                    ['aiProctoring', 'AI proctoring'],
                    ['negativeMarking', 'Negative marking'],
                    ['shuffleQuestions', 'Shuffle questions'],
                    ['shuffleOptions', 'Shuffle options'],
                    ['adaptiveMode', 'Adaptive mode'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
                {draft.negativeMarking && (
                  <label className="flex items-center gap-2">
                    Penalty
                    <input
                      type="number"
                      step="0.05"
                      value={draft.negativePenalty}
                      onChange={(e) => setDraft((d) => ({ ...d, negativePenalty: Number(e.target.value) }))}
                      className="w-20 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-subtle">Dimensions</p>
                <button onClick={addDimension} className="text-xs text-brand-600 hover:underline">
                  + Add dimension
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {draft.dimensions.map((dim, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="id"
                      value={dim.id}
                      onChange={(e) => updateDimension(i, { id: e.target.value })}
                      className="w-28 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      placeholder="label"
                      value={dim.label}
                      onChange={(e) => updateDimension(i, { label: e.target.value })}
                      className="flex-1 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      type="number"
                      step="0.05"
                      placeholder="weight"
                      value={dim.weight}
                      onChange={(e) => updateDimension(i, { weight: Number(e.target.value) })}
                      className="w-20 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <button onClick={() => removeDimension(i)} className="text-red-500 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {draft.dimensions.length === 0 && (
                  <p className="text-xs text-subtle">No dimensions yet.</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setSelectedGroupId(null);
                    setLiveNotice(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-subtle hover:bg-canvas transition"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving…' : creating ? 'Create assessment' : 'Publish new version'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
