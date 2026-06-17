'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Row {
  rank: number;
  username: string;
  score: number;
  executionMs: number;
}

export default function ChallengeLeaderboardPage() {
  const params = useParams();
  const id = String(params.id);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/challenges/${id}/leaderboard`);
        setRows(res.data.data ?? []);
      } catch {
        // leave empty
      }
    })();
  }, [id]);

  return (
    <div>
      <PageHeader
        eyebrow="Challenge"
        title="Leaderboard"
        subtitle="Fastest correct solutions, ranked."
        icon={Trophy}
      />

      <div className="max-w-2xl overflow-hidden rounded-xl border border-slate-800">
        {rows.map((r, i) => (
          <div
            key={r.username}
            className={`flex items-center justify-between px-5 py-3 ${
              i % 2 ? 'bg-slate-900/40' : 'bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="text-sm text-slate-400 w-16">Rank #{r.rank}</span>
              <span className="font-medium">{r.username}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-300">{r.score}</span>
              <span className="text-slate-500">{r.executionMs} ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
