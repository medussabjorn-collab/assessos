'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Option {
  id: string;
  text: string;
}

// Real shape from PracticeService.getQuestionForLearning — one question at a
// time, chosen server-side for the given domain (spaced repetition, not a
// fixed id you can browse to).
interface Question {
  id: string;
  domain: string;
  topic: string;
  difficulty: string;
  question: string;
  options: Option[];
  estimatedTime: number;
}

// Real shape from PracticeService.submitAnswer — no streakCount here (streak
// lives on the dashboard's stats, not the per-answer response).
interface AnswerResult {
  isCorrect: boolean;
  quality: number;
  explanation: string;
  nextReviewDate: string;
}

export default function PracticeSessionPage() {
  const params = useParams();
  const domain = String(params.domain);
  const { user } = useAuth();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setSelected(null);
    setResult(null);
    try {
      const res = await api.get('/api/practice/question', { params: { domain } });
      setQuestion(res.data.data);
      setStartedAt(Date.now());
    } catch {
      setQuestion(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    // Wait for Firebase auth state to rehydrate before fetching — on a
    // direct navigation/reload, auth.currentUser is briefly null while
    // onAuthStateChanged is still resolving, and firing the request too
    // early sends no Authorization header (403, not a real "no questions"
    // state).
    if (!user) return;
    loadQuestion();
  }, [user, loadQuestion]);

  const submit = async () => {
    if (!question || !selected) return;
    try {
      const timeTakenSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const res = await api.post('/api/practice/answer', {
        questionId: question.id,
        selectedOptionId: selected,
        timeTakenSec,
      });
      setResult(res.data.data);
    } catch {
      // ignore — stays on the question, user can retry
    }
  };

  if (loading) return <div className="p-2 text-subtle">Loading…</div>;
  if (notFound || !question) {
    return <div className="p-2 text-subtle">No questions available for &quot;{domain}&quot; right now.</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Practice" title={`${domain} practice`} icon={BookOpen} />

      <div className="max-w-2xl bg-surface border border-hairline rounded-xl p-6">
        <p className="text-xs text-subtle mb-2 capitalize">
          {question.topic} · {question.difficulty}
        </p>
        <p className="text-xl text-ink mb-6">{question.question}</p>

        <div className="space-y-2 mb-6">
          {question.options.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              disabled={!!result}
              className={`block w-full text-left p-3 rounded-lg border-2 transition ${
                selected === o.id ? 'border-blue-600 bg-blue-950' : 'border-hairline hover:border-hairline'
              }`}
            >
              {o.text}
            </button>
          ))}
        </div>

        {!result ? (
          <button
            onClick={submit}
            disabled={!selected}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={loadQuestion}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Next Question
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4 max-w-2xl p-5 rounded-xl bg-surface border border-hairline">
          <p
            className={`inline-flex items-center gap-2 font-semibold ${
              result.isCorrect ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.isCorrect ? 'Correct' : 'Incorrect'}
          </p>
          <p className="text-slate-600 mt-2">{result.explanation}</p>
          <p className="text-subtle text-sm mt-2">
            Next review: {new Date(result.nextReviewDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
