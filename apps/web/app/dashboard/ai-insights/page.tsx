'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Search, Loader, ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import TalentPredictionsPanel from '@/components/TalentPredictionsPanel';

interface LeadershipRow {
  userId: string;
  userName: string;
  email: string;
  department: string;
  leadershipIndex: number;
  tier: string;
  successorReadiness: number;
}

const TIER_PILL: Record<string, string> = {
  exceptional: 'bg-violet-100 text-violet-800',
  strong: 'bg-brand-100 text-brand-700',
  solid: 'bg-amber-100 text-amber-800',
  emerging: 'bg-orange-100 text-orange-800',
};

export default function AiInsightsPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const allowed = hasPermission(PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW);

  const [people, setPeople] = useState<LeadershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!allowed) {
      setLoading(false);
      return;
    }
    api
      .get('/api/analytics/dashboard')
      .then((res) => setPeople(res.data.data?.leadershipData ?? []))
      .catch(() => setError('Failed to load talent insights.'))
      .finally(() => setLoading(false));
  }, [authLoading, allowed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.userName.toLowerCase().includes(q) || p.department.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    );
  }, [people, search]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">
          AI Insights is visible to org admins and managers only. Ask your administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="AI Insights"
        subtitle="Quick, heuristic reads on skills, leadership potential, role fit, strengths, risks, and interview recommendations — not trained ML predictions, see methodology notes per person."
        icon={Sparkles}
      />

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div>
          <div className="flex items-center gap-2 mb-3 rounded-lg bg-canvas px-3 py-2">
            <Search size={15} className="text-subtle shrink-0" />
            <input
              placeholder="Search by name, email, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full text-ink placeholder:text-subtle"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.userId}
                onClick={() => setSelected({ userId: p.userId, userName: p.userName })}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  selected?.userId === p.userId ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface hover:bg-canvas'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink text-sm truncate">{p.userName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${TIER_PILL[p.tier] ?? 'bg-canvas text-subtle'}`}>
                    {p.tier}
                  </span>
                </div>
                <p className="text-xs text-subtle mt-1">{p.department} · Index {p.leadershipIndex}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-subtle text-sm">
                No one matches this search.
              </div>
            )}
          </div>
        </div>

        <div>
          {!selected && (
            <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
              Select a person to see their predictive profile.
            </div>
          )}
          {selected && (
            <TalentPredictionsPanel
              userId={selected.userId}
              userName={selected.userName}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
