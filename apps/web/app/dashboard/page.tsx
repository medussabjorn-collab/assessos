'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  BarChart3,
  Users,
  BookOpen,
  Video,
  Code,
  Trophy,
  TrendingUp,
  FileText,
  Loader,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';

interface UserStats {
  assessmentsCompleted: number;
  assessmentsInProgress: number;
  reportsReady: number;
  averagePercentile: number | null;
  recentActivity: Array<{ label: string; at: string }>;
}

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/users/me/stats');
        setStats(res.data.data ?? null);
      } catch {
        // Cards render em-dashes when stats are unavailable.
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-subtle">Loading…</div>;
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-[60vh] text-subtle">Please log in</div>;
  }

  const pillars = [
    { title: 'Leadership Assessment', desc: 'Track your competencies', icon: BarChart3, href: '/dashboard/assessment', tint: 'text-brand-500 bg-brand-50' },
    { title: 'Hiring', desc: 'View candidates & pipeline', icon: Users, href: '/dashboard/hiring', tint: 'text-accent-violet bg-violet-50' },
    { title: 'Practice', desc: 'Spaced-repetition learning', icon: BookOpen, href: '/dashboard/practice', tint: 'text-accent-mint bg-emerald-50' },
    { title: 'Live Interviews', desc: 'Schedule & conduct', icon: Video, href: '/dashboard/interviews', tint: 'text-accent-coral bg-orange-50' },
    { title: 'Coding Challenges', desc: 'Solve & compete', icon: Code, href: '/dashboard/challenges', tint: 'text-amber-500 bg-amber-50' },
    { title: 'Hackathons', desc: 'Team competitions', icon: Trophy, href: '/dashboard/hackathon', tint: 'text-brand-600 bg-brand-50' },
  ];

  const value = (v: number | string | null | undefined) =>
    statsLoading ? '…' : v ?? '—';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-600 to-accent-teal rounded-2xl p-8 text-white shadow-frost">
        <h1 className="text-3xl font-bold mb-1">
          Welcome back, {user.email?.split('@')[0]}
        </h1>
        <p className="text-white/80">Here&apos;s your leadership development at a glance.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assessments Completed" value={value(stats?.assessmentsCompleted)} icon={BarChart3} color="green" />
        <StatCard label="Average Percentile" value={value(stats?.averagePercentile != null ? `${stats.averagePercentile}%` : null)} icon={TrendingUp} color="teal" />
        <StatCard label="In Progress" value={value(stats?.assessmentsInProgress)} icon={Loader} color="amber" />
        <StatCard label="Reports Ready" value={value(stats?.reportsReady)} icon={FileText} color="violet" />
      </div>

      {/* Pillars */}
      <div>
        <h2 className="text-xl font-bold text-ink mb-4">Workspace</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="frost-card p-6 hover:shadow-frost-lg transition group"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${p.tint}`}>
                  <p.icon size={22} />
                </span>
                <ChevronRight size={18} className="text-subtle group-hover:text-brand-500 transition" />
              </div>
              <h3 className="font-semibold text-ink mt-4">{p.title}</h3>
              <p className="text-sm text-subtle mt-1">{p.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="frost-card p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Recent Activity</h2>
        {stats?.recentActivity?.length ? (
          <div className="space-y-3">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  {a.label}
                </div>
                <span className="text-xs text-subtle">
                  {new Date(a.at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-subtle">
            {statsLoading ? 'Loading…' : 'No activity yet. Start an assessment to see it here.'}
          </p>
        )}
      </div>
    </div>
  );
}
