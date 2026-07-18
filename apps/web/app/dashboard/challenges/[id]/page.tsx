'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Trophy, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import CodeEditor, { SupportedLanguage } from '@/components/CodeEditor';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation: string }>;
}

interface TestResult {
  passed: boolean;
  output: string;
  error?: string;
}

// Real shape from CodeExecutionService.validateSolution (via
// CodingService.submitSolution) — passed/failed are COUNTS, not a single
// pass/fail boolean; `valid` is the overall verdict.
interface SubmitResult {
  valid: boolean;
  score: number;
  feedback: string;
  passed: number;
  failed: number;
  results: TestResult[];
  plagiarism: { flagged: boolean; similarityScore?: number };
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
};

export default function ChallengePage() {
  const params = useParams();
  const id = String(params.id);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setProblem(null);
    setNotFound(false);
    setResult(null);
    (async () => {
      try {
        // Ported from a page that was calling /api/challenges/:id, an
        // endpoint that never existed here — this module lives at
        // /api/coding, so it always 404'd and silently fell back to a
        // hardcoded stub. Fixed to the real route.
        const res = await api.get(`/api/coding/problems/${id}`);
        setProblem(res.data.data);
      } catch {
        setNotFound(true);
      }
    })();
  }, [id]);

  const submit = async (code: string, language: SupportedLanguage) => {
    if (!code.trim()) {
      setError('Code cannot be empty');
      setResult(null);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/api/coding/problems/${id}/submit`, { code, language });
      setResult(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return <div className="p-2 text-subtle">Problem not found.</div>;
  }

  if (!problem) {
    return <div className="p-2 text-subtle">Loading…</div>;
  }

  const totalCases = result ? result.passed + result.failed : 0;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
          {problem.title}
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              DIFFICULTY_STYLES[problem.difficulty] ?? 'bg-slate-700 text-slate-600'
            }`}
          >
            {problem.difficulty}
          </span>
        </h1>
        <Link
          href={`/dashboard/challenges/${id}/leaderboard`}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-sm text-slate-700 hover:bg-canvas transition"
        >
          <Trophy size={15} className="text-yellow-400" /> Leaderboard
        </Link>
      </div>
      <p className="text-slate-600 mb-4">{problem.description}</p>

      {problem.examples?.length > 0 && (
        <div className="mb-4 space-y-2">
          {problem.examples.map((ex, i) => (
            <div key={i} className="rounded-lg bg-canvas border border-hairline p-3 text-sm font-mono">
              <div className="text-subtle">Input: <span className="text-ink">{ex.input}</span></div>
              <div className="text-subtle">Output: <span className="text-ink">{ex.output}</span></div>
              {ex.explanation && <div className="text-subtle mt-1">{ex.explanation}</div>}
            </div>
          ))}
        </div>
      )}

      <CodeEditor onSubmit={submit} submitting={submitting} />

      {error && <p className="text-red-400 mt-3">{error}</p>}

      {result && (
        <div className="mt-6 p-5 rounded-xl bg-surface border border-hairline">
          <p
            className={`inline-flex items-center gap-2 font-semibold ${
              result.valid ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.valid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.valid ? 'Passed' : 'Failed'}
          </p>
          <p className="text-slate-600 mt-2">
            {result.passed} / {totalCases} test cases passed · score {result.score}
          </p>
          <p className="text-subtle text-sm mt-1">{result.feedback}</p>

          {result.plagiarism.flagged && (
            <p className="mt-3 flex items-center gap-2 text-amber-500 text-sm">
              <AlertTriangle size={15} /> Flagged for similarity to a prior submission
              {result.plagiarism.similarityScore != null &&
                ` (${Math.round(result.plagiarism.similarityScore * 100)}% match)`}
            </p>
          )}

          {result.results?.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.passed ? (
                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <span className="text-subtle">Test case {i + 1}</span>
                  {!r.passed && r.error && (
                    <span className="text-red-400 font-mono text-xs truncate">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
