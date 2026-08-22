'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { Loader, Search, Star, Users, UserCheck, Clock } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  technicalScore: number;
  cultureFitScore: number;
  shortlisted: boolean;
}

const STAGE_LABEL: Record<string, string> = {
  screening: 'Screening',
  technical: 'Technical',
  culture_fit: 'Culture Fit',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

const STAGE_PILL: Record<string, string> = {
  screening: 'bg-blue-500/10 text-blue-600',
  technical: 'bg-violet-500/10 text-accent-violet',
  culture_fit: 'bg-cyan-500/10 text-accent-teal',
  offer: 'bg-amber-500/10 text-amber-600',
  hired: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-500/10 text-red-500',
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get('/api/hiring/candidates');
        setCandidates(res.data.data ?? []);
      } catch {
        setError('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const toggleShortlist = async (id: string, current: boolean) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, shortlisted: !current } : c)));
    try {
      await api.post(`/api/hiring/candidates/${id}/shortlist`, { shortlisted: !current });
    } catch {
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, shortlisted: current } : c)));
    }
  };

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
      const matchesSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [candidates, search, stageFilter]);

  const stats = useMemo(() => {
    const active = candidates.filter((c) => c.stage !== 'hired' && c.stage !== 'rejected').length;
    const hired = candidates.filter((c) => c.stage === 'hired').length;
    const shortlisted = candidates.filter((c) => c.shortlisted || c.stage === 'shortlisted').length;
    return { total: candidates.length, active, hired, shortlisted };
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        eyebrow="Hiring"
        title="Candidates"
        subtitle="Every candidate across every open role, in one searchable list."
        action={
          <Link
            href="/dashboard/hiring/pipeline"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Open Pipeline
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Candidates" value={stats.total} icon={Users} color="green" />
        <StatCard label="Active" value={stats.active} icon={Clock} color="violet" />
        <StatCard label="Hired" value={stats.hired} icon={UserCheck} color="teal" />
        <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} color="amber" />
      </div>

      <div className="frost-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-lg bg-canvas px-3 py-2">
          <Search size={16} className="text-subtle shrink-0" />
          <input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full text-ink placeholder:text-subtle"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="all">All stages</option>
          {Object.entries(STAGE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="frost-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-subtle">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Technical</th>
              <th className="px-4 py-3 font-medium">Culture Fit</th>
              <th className="px-4 py-3 font-medium">Shortlist</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-hairline last:border-0 hover:bg-canvas transition">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/hiring/candidates/${c.id}`} className="font-medium text-ink hover:text-brand-600 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-subtle">{c.role}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STAGE_PILL[c.stage] ?? 'bg-slate-500/10 text-subtle'}`}>
                    {STAGE_LABEL[c.stage] ?? c.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{c.technicalScore}</td>
                <td className="px-4 py-3 text-ink">{c.cultureFitScore}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleShortlist(c.id, c.shortlisted)}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition ${
                      c.shortlisted ? 'text-amber-500' : 'text-subtle hover:text-amber-500'
                    }`}
                    title={c.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                  >
                    <Star size={16} fill={c.shortlisted ? 'currentColor' : 'none'} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-subtle">
                  No candidates match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
