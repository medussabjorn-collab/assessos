'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface PracticeQuestion {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  dueAt: string | null;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
};

export default function PracticeLibraryPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/practice/questions');
        setQuestions(res.data.data ?? []);
      } catch {
        // leave empty
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div>
      <PageHeader
        eyebrow="Practice"
        title="Question Library"
        subtitle="Sharpen leadership competencies with spaced-repetition review. Questions resurface as they come due."
        icon={BookOpen}
        action={
          <Link
            href="/dashboard/practice/badges"
            className="inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm text-slate-700 hover:bg-canvas transition"
          >
            <Award size={16} className="text-yellow-400" />
            View badges
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-surface border border-hairline animate-pulse"
            />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          No practice questions available yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/practice/${q.id}`}
              className="group flex items-center justify-between bg-surface border border-hairline rounded-xl p-5 hover:border-blue-600/50 transition"
            >
              <div>
                <p className="font-semibold text-ink">{q.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-subtle">{q.category}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      DIFFICULTY_STYLES[q.difficulty] ?? 'bg-slate-700 text-slate-600'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {q.dueAt && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                      Due for review
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-600 group-hover:text-blue-400 transition"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
