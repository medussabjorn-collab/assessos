'use client';

import { Fragment, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Loader, RefreshCcw } from 'lucide-react';

type Dim = 'D' | 'I' | 'S' | 'C';

interface DiscGroup {
  id: number;
  options: Array<{ text: string; dimension: Dim }>;
}

interface DiscResult {
  scores: Record<Dim, number>;
  primaryType: Dim;
  secondaryType: Dim | null;
  profileLabel: string;
  dimensionNames: Record<Dim, string>;
  createdAt: string;
}

interface Answer {
  most: Dim | null;
  least: Dim | null;
}

const DIM_COLORS: Record<Dim, string> = {
  D: 'bg-red-500',
  I: 'bg-amber-500',
  S: 'bg-green-500',
  C: 'bg-blue-500',
};

export default function DiscPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<DiscGroup[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [result, setResult] = useState<DiscResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [resultRes, questionsRes] = await Promise.all([
          api.get('/api/psych/disc/result'),
          api.get('/api/psych/disc/questions'),
        ]);
        setResult(resultRes.data.data);
        setGroups(questionsRes.data.data ?? []);
      } catch {
        setError('Failed to load DISC assessment');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const setAnswer = (groupId: number, kind: 'most' | 'least', dim: Dim) => {
    setAnswers((prev) => {
      const current = prev[groupId] ?? { most: null, least: null };
      const other = kind === 'most' ? 'least' : 'most';
      return {
        ...prev,
        [groupId]: {
          ...current,
          [kind]: dim,
          // Same word can't be both most and least.
          [other]: current[other] === dim ? null : current[other],
        },
      };
    });
  };

  const answeredCount = groups.filter(
    (g) => answers[g.id]?.most && answers[g.id]?.least,
  ).length;
  const complete = groups.length > 0 && answeredCount === groups.length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/api/psych/disc/submit', {
        answers: groups.map((g) => ({
          groupId: g.id,
          most: answers[g.id].most,
          least: answers[g.id].least,
        })),
      });
      setResult(res.data.data);
      setRetaking(false);
      setAnswers({});
    } catch {
      setError('Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error && !groups.length) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  // Result view
  if (result && !retaking) {
    const dims: Dim[] = ['D', 'I', 'S', 'C'];
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-ink">Your DISC Profile</h1>
          <p className="text-subtle">
            Taken {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="frost-card p-8 text-center">
          <div className="text-5xl font-bold text-ink mb-2">
            {result.primaryType}
            {result.secondaryType ?? ''}
          </div>
          <div className="text-xl font-semibold text-brand-600 mb-1">
            {result.profileLabel}
          </div>
          <p className="text-subtle text-sm">
            Primary: {result.dimensionNames[result.primaryType]}
            {result.secondaryType &&
              ` · Secondary: ${result.dimensionNames[result.secondaryType]}`}
          </p>
        </div>

        <div className="frost-card p-6 space-y-4">
          {dims.map((d) => (
            <div key={d}>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium text-ink">
                  {d} — {result.dimensionNames[d]}
                </span>
                <span className="font-bold text-ink">{result.scores[d]}</span>
              </div>
              <div className="w-full bg-hairline rounded-full h-2.5">
                <div
                  className={`${DIM_COLORS[d]} h-2.5 rounded-full transition-all`}
                  style={{ width: `${result.scores[d]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setRetaking(true)}
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition"
        >
          <RefreshCcw size={14} /> Retake assessment
        </button>
      </div>
    );
  }

  // Quiz view
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-ink">DISC Assessment</h1>
        <p className="text-subtle">
          For each group pick the word <strong>most</strong> like you and the
          word <strong>least</strong> like you. {answeredCount}/{groups.length}{' '}
          complete.
        </p>
      </div>

      {groups.map((group) => {
        const a = answers[group.id] ?? { most: null, least: null };
        return (
          <div key={group.id} className="frost-card p-5">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 items-center">
              <span className="text-xs font-semibold text-subtle uppercase">
                Group {group.id}
              </span>
              <span className="text-xs font-semibold text-subtle">Most</span>
              <span className="text-xs font-semibold text-subtle">Least</span>
              {group.options.map((opt) => (
                <Fragment key={`${group.id}-${opt.dimension}`}>
                  <span className="text-sm text-ink">{opt.text}</span>
                  <input
                    type="radio"
                    name={`most-${group.id}`}
                    checked={a.most === opt.dimension}
                    onChange={() => setAnswer(group.id, 'most', opt.dimension)}
                    className="accent-brand-600 w-4 h-4 justify-self-center"
                  />
                  <input
                    type="radio"
                    name={`least-${group.id}`}
                    checked={a.least === opt.dimension}
                    onChange={() => setAnswer(group.id, 'least', opt.dimension)}
                    className="accent-red-500 w-4 h-4 justify-self-center"
                  />
                </Fragment>
              ))}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={submit}
        disabled={!complete || submitting}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
      >
        {submitting
          ? 'Scoring…'
          : complete
            ? 'See My Profile'
            : `Answer all groups (${answeredCount}/${groups.length})`}
      </button>
    </div>
  );
}
