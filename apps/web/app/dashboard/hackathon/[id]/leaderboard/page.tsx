'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Row {
  rank: number;
  teamName: string;
  totalScore: number;
  prize: string;
}

const MEDAL = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

export default function HackathonLeaderboardPage() {
  const params = useParams();
  const id = String(params.id);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/hackathons/${id}/leaderboard`);
        setRows(res.data.data ?? []);
      } catch {
        // leave empty
      }
    })();
  }, [id]);

  return (
    <div>
      <PageHeader
        eyebrow="Hackathon"
        title="Leaderboard"
        subtitle="Final standings and prize allocations after judging."
        icon={Trophy}
      />

      <div className="max-w-2xl space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.rank}
            className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-4"
          >
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 font-bold ${
                  MEDAL[i] ?? 'text-slate-400'
                }`}
              >
                {r.rank}
              </span>
              <span
                data-testid="leaderboard-team-name"
                className="font-semibold text-white"
              >
                {r.teamName}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-slate-400">{r.totalScore} pts</span>
              <span className="font-semibold text-green-400">{r.prize}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
