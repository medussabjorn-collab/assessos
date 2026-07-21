'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

// The backend has no dedicated badges endpoint — GET /api/practice/dashboard
// returns recentBadges as a bare array of slugs (e.g. "first_question",
// "streak_7"), not rich objects with names/award dates. Humanize the slug
// client-side rather than inventing data the API doesn't provide.
function humanize(slug: string): string {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PracticeBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/practice/dashboard');
        setBadges(res.data.data?.recentBadges ?? []);
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
        title="Badges"
        subtitle="Milestones earned through consistent practice and review streaks."
        icon={Award}
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface border border-hairline animate-pulse" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          No badges earned yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((slug) => (
            <div
              key={slug}
              className="flex items-center gap-3 bg-surface border border-hairline rounded-xl p-5"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-yellow-500/15 text-yellow-400">
                <Award size={22} />
              </span>
              <span className="font-semibold text-ink">{humanize(slug)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
