'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Plus, Loader, X, Trash2, ShieldOff, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface JobProfile {
  id: string;
  tenantId: string | null;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  cultureFitDimensions: string[];
  technicalLevel: string;
  assessmentDimensionWeights: Record<string, number>;
}

const TECHNICAL_LEVELS = ['junior', 'mid', 'senior', 'lead'];

const emptyDraft = () => ({
  title: '',
  department: '',
  description: '',
  requiredSkills: [] as string[],
  niceToHaveSkills: [] as string[],
  cultureFitDimensions: [] as string[],
  technicalLevel: 'mid',
  assessmentDimensionWeights: {} as Record<string, number>,
});

const listToText = (list: string[]) => list.join(', ');
const textToList = (text: string) =>
  text.split(',').map((s) => s.trim()).filter(Boolean);

export default function JobProfilesPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.ASSESSMENT_CONFIGS_MANAGE);

  const [roles, setRoles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const selected = roles.find((r) => r.id === selectedId) ?? null;

  const load = async () => {
    try {
      const res = await api.get('/api/job-roles');
      setRoles(res.data.data ?? []);
    } catch {
      setError('Failed to load job profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading]);

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft(emptyDraft());
    setError(null);
  };

  const selectRole = (role: JobProfile) => {
    setCreating(false);
    setSelectedId(role.id);
    setError(null);
    setDraft({
      title: role.title,
      department: role.department,
      description: role.description,
      requiredSkills: role.requiredSkills,
      niceToHaveSkills: role.niceToHaveSkills,
      cultureFitDimensions: role.cultureFitDimensions,
      technicalLevel: role.technicalLevel,
      assessmentDimensionWeights: role.assessmentDimensionWeights,
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (creating) {
        await api.post('/api/job-roles', draft);
        setCreating(false);
      } else if (selectedId) {
        await api.put(`/api/job-roles/${selectedId}`, draft);
      }
      setSelectedId(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save job profile.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this job profile? This cannot be undone.')) return;
    try {
      await api.delete(`/api/job-roles/${id}`);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError("Failed to delete — shared defaults can't be removed, only your own custom profiles.");
    }
  };

  const setWeight = (dim: string, value: number) => {
    setDraft((d) => ({ ...d, assessmentDimensionWeights: { ...d.assessmentDimensionWeights, [dim]: value } }));
  };
  const removeWeight = (dim: string) => {
    setDraft((d) => {
      const w = { ...d.assessmentDimensionWeights };
      delete w[dim];
      return { ...d, assessmentDimensionWeights: w };
    });
  };
  const addWeight = () => {
    let i = 1;
    let key = 'dimension';
    while (key in draft.assessmentDimensionWeights) {
      key = `dimension_${i++}`;
    }
    setWeight(key, 0);
  };

  const showEditor = creating || !!selected;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Assessments"
        title="Job Profiles"
        subtitle="The role catalog behind assessment creation — required/nice-to-have skills, culture-fit dimensions, and scoring weights per role."
        icon={Briefcase}
        action={
          canWrite ? (
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700 transition"
            >
              <Plus size={15} /> New job profile
            </button>
          ) : undefined
        }
      />

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`rounded-xl border p-4 transition ${
                selectedId === role.id ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface'
              }`}
            >
              <button onClick={() => selectRole(role)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{role.title}</span>
                  {role.tenantId === null && (
                    <span title="Shared default" className="text-subtle shrink-0">
                      <Globe size={13} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-subtle mt-1">
                  {role.department} · {role.technicalLevel}
                </p>
              </button>
              {canWrite && role.tenantId !== null && (
                <button
                  onClick={() => remove(role.id)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-500 hover:underline"
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          ))}
          {roles.length === 0 && (
            <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-subtle text-sm">
              No job profiles yet.
            </div>
          )}
        </div>

        <div>
          {!showEditor && (
            <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
              Select a job profile to view{canWrite ? ' or edit' : ''}, or create a new one.
            </div>
          )}

          {!canWrite && showEditor && (
            <div className="frost-card p-8 text-center">
              <ShieldOff className="w-10 h-10 text-hairline mx-auto mb-3" />
              <p className="text-ink font-medium mb-1">Read-only</p>
              <p className="text-subtle text-sm">Editing job profiles needs assessment-config manage access.</p>
            </div>
          )}

          {canWrite && showEditor && (
            <div className="bg-surface border border-hairline rounded-xl p-5">
              {!creating && selected?.tenantId === null && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-600">
                  <Globe size={13} /> This is a shared default visible to every organization — it can't be edited or deleted here.
                </div>
              )}
              <fieldset disabled={!creating && selected?.tenantId === null} className="space-y-4 disabled:opacity-60">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-subtle block mb-1">Title</label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-subtle block mb-1">Department</label>
                    <input
                      value={draft.department}
                      onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
                      className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Description</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    rows={2}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Technical level</label>
                  <select
                    value={draft.technicalLevel}
                    onChange={(e) => setDraft((d) => ({ ...d, technicalLevel: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas capitalize"
                  >
                    {TECHNICAL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Required skills (comma-separated)</label>
                  <input
                    value={listToText(draft.requiredSkills)}
                    onChange={(e) => setDraft((d) => ({ ...d, requiredSkills: textToList(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Nice-to-have skills (comma-separated)</label>
                  <input
                    value={listToText(draft.niceToHaveSkills)}
                    onChange={(e) => setDraft((d) => ({ ...d, niceToHaveSkills: textToList(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Culture-fit dimensions (comma-separated)</label>
                  <input
                    value={listToText(draft.cultureFitDimensions)}
                    onChange={(e) => setDraft((d) => ({ ...d, cultureFitDimensions: textToList(e.target.value) }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-subtle">Assessment dimension weights</p>
                    <button type="button" onClick={addWeight} className="text-xs text-brand-600 hover:underline">
                      + Add weight
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(draft.assessmentDimensionWeights).map(([dim, weight]) => (
                      <div key={dim} className="flex gap-2 items-center">
                        <input
                          value={dim}
                          readOnly
                          className="flex-1 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas text-subtle"
                        />
                        <input
                          type="number"
                          step="0.05"
                          value={weight}
                          onChange={(e) => setWeight(dim, Number(e.target.value))}
                          className="w-24 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                        />
                        <button type="button" onClick={() => removeWeight(dim)} className="text-red-500 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {Object.keys(draft.assessmentDimensionWeights).length === 0 && (
                      <p className="text-xs text-subtle">No weights yet.</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {(creating || selected?.tenantId !== null) && (
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(null);
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
                    {saving ? 'Saving…' : creating ? 'Create profile' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
