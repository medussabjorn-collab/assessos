'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Code, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/coding/problems');
        setProblems(res.data.data ?? []);
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
        eyebrow="Engagement"
        title="Coding Challenges"
        subtitle="Auto-graded problems with live leaderboards. Submit a solution to see your rank."
        icon={Code}
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
      ) : (
        <div className="grid gap-3">
          {problems.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/challenges/${p.id}`}
              className="group flex items-center justify-between bg-surface border border-hairline rounded-xl p-5 hover:border-blue-600/50 transition"
            >
              <div className="flex items-center gap-3">
                <p className="font-semibold text-ink">{p.title}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    DIFFICULTY_STYLES[p.difficulty] ?? 'bg-slate-700 text-slate-600'
                  }`}
                >
                  {p.difficulty}
                </span>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-600 group-hover:text-brand-500 transition"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
