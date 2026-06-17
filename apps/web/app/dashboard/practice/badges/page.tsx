'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Badge {
  id: string;
  name: string;
  awardedAt: string;
}

export default function PracticeBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/practice/badges');
        setBadges(res.data.data ?? []);
      } catch {
        // leave empty
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 bg-surface border border-hairline rounded-xl p-5"
          >
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-yellow-500/15 text-yellow-400">
              <Award size={22} />
            </span>
            <span className="font-semibold text-ink">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
