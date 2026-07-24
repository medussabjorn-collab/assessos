'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Leader {
  rank: number;
  name: string;
  solved: number;
  score: number;
  badge?: string;
}

// The backend (GET /api/coding/leaderboards) only tracks one global,
// cross-problem leaderboard — there's no per-problem ranking to scope this
// page to, so it shows the same global board regardless of which challenge
// linked here.
export default function ChallengeLeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/coding/leaderboards');
        const global = res.data.data?.global ?? {};
        setLeaders(global.leaders ?? []);
        setUserRank(global.userRank ?? null);
        setUserScore(global.userScore ?? null);
      } catch {
        // leave empty
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Challenge"
        title="Leaderboard"
        subtitle="Global rankings across all coding challenges."
        icon={Trophy}
      />

      {userRank != null && (
        <p className="mb-4 text-sm text-subtle">
          Your rank: <span className="font-medium text-ink">#{userRank}</span> ({userScore} pts)
        </p>
      )}

      <div className="max-w-2xl overflow-hidden rounded-xl border border-hairline">
        {leaders.map((r, i) => (
          <div
            key={r.rank}
            className={`flex items-center justify-between px-5 py-3 ${
              i % 2 ? 'bg-surface/40' : 'bg-surface'
            }`}
          >
            <div className="flex items-center gap-3 text-ink">
              <span className="text-sm text-subtle w-16">Rank #{r.rank}</span>
              <span className="font-medium">{r.name}</span>
              {r.badge && <span>{r.badge}</span>}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-600">{r.score} pts</span>
              <span className="text-subtle">{r.solved} solved</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
