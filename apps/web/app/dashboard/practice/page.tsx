'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, Flame, Target, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

// The backend (GET /api/practice/dashboard) models practice as a
// spaced-repetition session — one question at a time, chosen server-side —
// not a browsable list of fixed questions with stable ids. There is no
// "list all questions" endpoint to page through, so this is a stats +
// "start practice" landing rather than a question library.
interface Dashboard {
  stats: {
    totalQuestionsAnswered: number;
    correctAnswers: number;
    accuracyRate: number;
    currentStreak: number;
    longestStreak: number;
    timeSpentHours: number;
  };
  dueToday: number;
  suggestedDomain: string;
  recentBadges: string[];
  nextMilestone: { name: string; progress: number; target: number };
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5">
      <div className="flex items-center gap-2 text-subtle text-sm mb-2">
        <Icon size={15} />
        {label}
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function PracticeDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/practice/dashboard');
        setDashboard(res.data.data ?? null);
      } catch {
        // leave null
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div>
      <PageHeader
        eyebrow="Practice"
        title="Practice"
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-surface border border-hairline animate-pulse" />
          ))}
        </div>
      ) : !dashboard ? (
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          Couldn't load your practice dashboard.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <StatCard icon={Target} label="Due today" value={dashboard.dueToday} />
            <StatCard icon={Flame} label="Current streak" value={`${dashboard.stats.currentStreak} days`} />
            <StatCard icon={TrendingUp} label="Accuracy" value={`${dashboard.stats.accuracyRate}%`} />
            <StatCard icon={Award} label="Longest streak" value={`${dashboard.stats.longestStreak} days`} />
            <StatCard icon={BookOpen} label="Questions answered" value={dashboard.stats.totalQuestionsAnswered} />
            <StatCard icon={Clock} label="Time spent" value={`${dashboard.stats.timeSpentHours}h`} />
          </div>

          <div className="bg-surface border border-hairline rounded-xl p-5 mb-6">
            <p className="text-sm text-subtle mb-2">
              Next milestone: <span className="text-ink font-medium">{dashboard.nextMilestone.name}</span>
            </p>
            <div className="h-2 rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full bg-brand-600"
                style={{
                  width: `${Math.min(100, (dashboard.nextMilestone.progress / dashboard.nextMilestone.target) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-subtle mt-1">
              {dashboard.nextMilestone.progress} / {dashboard.nextMilestone.target}
            </p>
          </div>

          <Link
            href={`/dashboard/practice/${dashboard.suggestedDomain}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
          >
            <BookOpen size={18} />
            Start practice — {dashboard.suggestedDomain}
          </Link>
        </>
      )}
    </div>
  );
}
