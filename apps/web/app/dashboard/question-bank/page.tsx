'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, Loader, X, Search, ShieldOff, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

type BankType = 'pillar' | 'sjt';

interface LikertOption {
  id: string;
  text: string;
  value: number;
}

interface PillarQuestion {
  id: string;
  dimensionId: string;
  text: string;
  options: LikertOption[];
  isActive: boolean;
}

interface SjtOption {
  id: string;
  text: string;
}

interface SjtQuestion {
  id: string;
  dimensionId: string;
  prompt: string;
  options: SjtOption[];
  bestOptionId: string;
  worstOptionId: string;
  optionScores: Record<string, number>;
  isActive: boolean;
}

const BANKS: { key: BankType; label: string; endpoint: string }[] = [
  { key: 'pillar', label: 'Leadership (Likert)', endpoint: '/api/pillar-questions' },
  { key: 'sjt', label: 'Situational Judgment (SJT)', endpoint: '/api/scored-sjt-questions' },
];

const emptyPillarDraft = (): Omit<PillarQuestion, 'id'> => ({
  dimensionId: '',
  text: '',
  options: [
    { id: 'A', text: '', value: 1 },
    { id: 'B', text: '', value: 3 },
    { id: 'C', text: '', value: 5 },
  ],
  isActive: true,
});

const emptySjtDraft = (): Omit<SjtQuestion, 'id'> => ({
  dimensionId: '',
  prompt: '',
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  bestOptionId: 'A',
  worstOptionId: 'B',
  optionScores: { A: 2, B: 0, C: 0, D: -2 },
  isActive: true,
});

export default function QuestionBankPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.QUESTION_BANK_WRITE);

  const [bank, setBank] = useState<BankType>('pillar');
  const [items, setItems] = useState<(PillarQuestion | SjtQuestion)[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dimensionFilter, setDimensionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pillarDraft, setPillarDraft] = useState(emptyPillarDraft());
  const [sjtDraft, setSjtDraft] = useState(emptySjtDraft());
  const [saving, setSaving] = useState(false);

  const activeBank = BANKS.find((b) => b.key === bank)!;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(activeBank.endpoint, {
        params: { page, limit: 20, dimensionId: dimensionFilter || undefined },
      });
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch {
      setError('Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, page, dimensionFilter]);

  const switchBank = (b: BankType) => {
    setBank(b);
    setPage(1);
    setSelectedId(null);
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setPillarDraft(emptyPillarDraft());
    setSjtDraft(emptySjtDraft());
    setError(null);
  };

  const selectItem = (item: PillarQuestion | SjtQuestion) => {
    setCreating(false);
    setSelectedId(item.id);
    setError(null);
    if (bank === 'pillar') {
      const q = item as PillarQuestion;
      setPillarDraft({ dimensionId: q.dimensionId, text: q.text, options: q.options, isActive: q.isActive });
    } else {
      const q = item as SjtQuestion;
      setSjtDraft({
        dimensionId: q.dimensionId,
        prompt: q.prompt,
        options: q.options,
        bestOptionId: q.bestOptionId,
        worstOptionId: q.worstOptionId,
        optionScores: q.optionScores,
        isActive: q.isActive,
      });
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = bank === 'pillar' ? pillarDraft : sjtDraft;
      if (creating) {
        await api.post(activeBank.endpoint, body);
        setCreating(false);
      } else if (selectedId) {
        await api.put(`${activeBank.endpoint}/${selectedId}`, body);
      }
      setSelectedId(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await api.delete(`${activeBank.endpoint}/${id}`);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError('Failed to delete question.');
    }
  };

  const showEditor = creating || !!selectedId;

  if (authLoading) {
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
        title="Question Bank"
        subtitle="Browse and author the item banks behind every assessment — Leadership Likert questions and Situational Judgment scenarios."
        icon={BookOpen}
        action={
          canWrite ? (
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700 transition"
            >
              <Plus size={15} /> New question
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-4">
        {BANKS.map((b) => (
          <button
            key={b.key}
            onClick={() => switchBank(b.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              bank === b.key ? 'bg-brand-600 text-white' : 'bg-canvas text-subtle hover:bg-hairline/30'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <div className="flex items-center gap-2 mb-3 rounded-lg bg-canvas px-3 py-2">
            <Search size={15} className="text-subtle shrink-0" />
            <input
              placeholder="Filter by dimension id…"
              value={dimensionFilter}
              onChange={(e) => {
                setPage(1);
                setDimensionFilter(e.target.value);
              }}
              className="bg-transparent text-sm outline-none w-full text-ink placeholder:text-subtle"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const label = bank === 'pillar' ? (item as PillarQuestion).text : (item as SjtQuestion).prompt;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${
                      selectedId === item.id ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface'
                    }`}
                  >
                    <button onClick={() => selectItem(item)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-subtle shrink-0">
                          {item.dimensionId}
                        </span>
                        {!item.isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 shrink-0">
                            inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink mt-1.5 line-clamp-2">{label}</p>
                    </button>
                    {canWrite && (
                      <button
                        onClick={() => remove(item.id)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-500 hover:underline"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-subtle text-sm">
                  No questions found.
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm text-subtle">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div>
          {!showEditor && (
            <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
              Select a question to view{canWrite ? ' or edit' : ''}, or create a new one.
            </div>
          )}

          {!canWrite && showEditor && (
            <div className="frost-card p-8 text-center">
              <ShieldOff className="w-10 h-10 text-hairline mx-auto mb-3" />
              <p className="text-ink font-medium mb-1">Read-only</p>
              <p className="text-subtle text-sm">You can view this question, but editing needs Question Bank write access.</p>
            </div>
          )}

          {canWrite && showEditor && bank === 'pillar' && (
            <div className="bg-surface border border-hairline rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-subtle block mb-1">Dimension id</label>
                  <input
                    value={pillarDraft.dimensionId}
                    onChange={(e) => setPillarDraft((d) => ({ ...d, dimensionId: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pillarDraft.isActive}
                    onChange={(e) => setPillarDraft((d) => ({ ...d, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="text-xs text-subtle block mb-1">Question text</label>
                <textarea
                  value={pillarDraft.text}
                  onChange={(e) => setPillarDraft((d) => ({ ...d, text: e.target.value }))}
                  rows={3}
                  className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                />
              </div>
              <p className="text-xs text-subtle mb-2">Options (Likert value 1–5)</p>
              <div className="space-y-2 mb-4">
                {pillarDraft.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="id"
                      value={opt.id}
                      onChange={(e) =>
                        setPillarDraft((d) => ({
                          ...d,
                          options: d.options.map((o, j) => (j === i ? { ...o, id: e.target.value } : o)),
                        }))
                      }
                      className="w-16 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      placeholder="text"
                      value={opt.text}
                      onChange={(e) =>
                        setPillarDraft((d) => ({
                          ...d,
                          options: d.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                        }))
                      }
                      className="flex-1 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={opt.value}
                      onChange={(e) =>
                        setPillarDraft((d) => ({
                          ...d,
                          options: d.options.map((o, j) => (j === i ? { ...o, value: Number(e.target.value) } : o)),
                        }))
                      }
                      className="w-16 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <button
                      onClick={() =>
                        setPillarDraft((d) => ({ ...d, options: d.options.filter((_, j) => j !== i) }))
                      }
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setPillarDraft((d) => ({ ...d, options: [...d.options, { id: '', text: '', value: 3 }] }))
                  }
                  className="text-xs text-brand-600 hover:underline"
                >
                  + Add option
                </button>
              </div>
              <div className="flex justify-end gap-2">
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
                  {saving ? 'Saving…' : creating ? 'Create question' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {canWrite && showEditor && bank === 'sjt' && (
            <div className="bg-surface border border-hairline rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-subtle block mb-1">Dimension id</label>
                  <input
                    value={sjtDraft.dimensionId}
                    onChange={(e) => setSjtDraft((d) => ({ ...d, dimensionId: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  />
                </div>
                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sjtDraft.isActive}
                    onChange={(e) => setSjtDraft((d) => ({ ...d, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="text-xs text-subtle block mb-1">Scenario prompt</label>
                <textarea
                  value={sjtDraft.prompt}
                  onChange={(e) => setSjtDraft((d) => ({ ...d, prompt: e.target.value }))}
                  rows={3}
                  className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                />
              </div>
              <p className="text-xs text-subtle mb-2">Options + scores</p>
              <div className="space-y-2 mb-4">
                {sjtDraft.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="id"
                      value={opt.id}
                      onChange={(e) => {
                        const newId = e.target.value;
                        const oldId = opt.id;
                        setSjtDraft((d) => {
                          const options = d.options.map((o, j) => (j === i ? { ...o, id: newId } : o));
                          const optionScores = { ...d.optionScores };
                          if (oldId in optionScores) {
                            optionScores[newId] = optionScores[oldId];
                            if (newId !== oldId) delete optionScores[oldId];
                          }
                          return {
                            ...d,
                            options,
                            optionScores,
                            bestOptionId: d.bestOptionId === oldId ? newId : d.bestOptionId,
                            worstOptionId: d.worstOptionId === oldId ? newId : d.worstOptionId,
                          };
                        });
                      }}
                      className="w-16 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      placeholder="text"
                      value={opt.text}
                      onChange={(e) =>
                        setSjtDraft((d) => ({
                          ...d,
                          options: d.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                        }))
                      }
                      className="flex-1 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <input
                      type="number"
                      placeholder="score"
                      value={sjtDraft.optionScores[opt.id] ?? 0}
                      onChange={(e) =>
                        setSjtDraft((d) => ({
                          ...d,
                          optionScores: { ...d.optionScores, [opt.id]: Number(e.target.value) },
                        }))
                      }
                      className="w-16 border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                    <button
                      onClick={() =>
                        setSjtDraft((d) => ({ ...d, options: d.options.filter((_, j) => j !== i) }))
                      }
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setSjtDraft((d) => ({ ...d, options: [...d.options, { id: '', text: '' }] }))
                  }
                  className="text-xs text-brand-600 hover:underline"
                >
                  + Add option
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-subtle block mb-1">Best option id</label>
                  <select
                    value={sjtDraft.bestOptionId}
                    onChange={(e) => setSjtDraft((d) => ({ ...d, bestOptionId: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  >
                    {sjtDraft.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtle block mb-1">Worst option id</label>
                  <select
                    value={sjtDraft.worstOptionId}
                    onChange={(e) => setSjtDraft((d) => ({ ...d, worstOptionId: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                  >
                    {sjtDraft.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
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
                  {saving ? 'Saving…' : creating ? 'Create question' : 'Save changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
