'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { api } from '@/lib/api';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  starterCode: string;
}

interface GradeResult {
  passed: boolean;
  passedCases: number;
  totalCases: number;
  score: number;
  rank: number;
}

const FALLBACK: Problem = {
  id: 'ch-001',
  title: 'Two Sum',
  difficulty: 'easy',
  description:
    'Given an array of integers, return indices of two numbers that add to target.',
  starterCode: 'function twoSum(nums, target) {\n  // your code here\n}',
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
};

export default function ChallengePage() {
  const params = useParams();
  const id = String(params.id);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState('');
  // Uncontrolled editor: value lives in the DOM. Rendered only once `problem`
  // has loaded and never rewritten, so clear()/fill() are never undone.
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/challenges/${id}`);
        setProblem(res.data.data ?? FALLBACK);
      } catch {
        setProblem(FALLBACK);
      }
    })();
  }, [id]);

  const submit = async () => {
    const code = editorRef.current?.value ?? '';
    if (!code.trim()) {
      setError('Code cannot be empty');
      setResult(null);
      return;
    }
    setError('');
    try {
      const res = await api.post(`/api/challenges/${id}/submit`, { code });
      setResult(res.data.data);
    } catch {
      // ignore
    }
  };

  if (!problem) {
    return <div className="p-2 text-slate-400">Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          {problem.title}
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              DIFFICULTY_STYLES[problem.difficulty] ?? 'bg-slate-700 text-slate-300'
            }`}
          >
            {problem.difficulty}
          </span>
        </h1>
        <Link
          href={`/dashboard/challenges/${id}/leaderboard`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 transition"
        >
          <Trophy size={15} className="text-yellow-400" /> Leaderboard
        </Link>
      </div>
      <p className="text-slate-300 mb-4">{problem.description}</p>

      <textarea
        aria-label="Code editor"
        ref={editorRef}
        defaultValue={problem.starterCode}
        spellCheck={false}
        className="w-full h-56 font-mono text-sm p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      <button
        onClick={submit}
        className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Submit
      </button>

      {error && <p className="text-red-400 mt-3">{error}</p>}

      {result && (
        <div className="mt-6 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p
            className={`inline-flex items-center gap-2 font-semibold ${
              result.passed ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.passed ? 'Passed' : 'Failed'}
          </p>
          <p className="text-slate-300 mt-2">
            {result.passedCases} / {result.totalCases} test cases passed
          </p>
          {result.passed && (
            <p className="text-slate-300 mt-1">Rank #{result.rank}</p>
          )}
        </div>
      )}
    </div>
  );
}
