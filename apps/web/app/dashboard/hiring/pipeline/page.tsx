'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader, Star } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  technicalScore: number;
  cultureFitScore: number;
}

const STAGES = [
  { key: 'screening', label: 'Screening', color: 'border-blue-500' },
  { key: 'technical', label: 'Technical', color: 'border-purple-500' },
  { key: 'culture_fit', label: 'Culture Fit', color: 'border-cyan-500' },
  { key: 'offer', label: 'Offer', color: 'border-green-500' },
  { key: 'hired', label: 'Hired', color: 'border-emerald-500' },
];

export default function HiringPipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get('/api/hiring/candidates');
        setCandidates(res.data.data || FALLBACK_CANDIDATES);
      } catch {
        setCandidates(FALLBACK_CANDIDATES);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const moveCandidate = async (id: string, newStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c)),
    );
    try {
      await api.post(`/api/hiring/candidates/${id}/stage`, { stage: newStage });
    } catch {
      // Optimistic update already applied.
    }
  };

  const nextStage = (stage: string) => {
    const idx = STAGES.findIndex((s) => s.key === stage);
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1].key : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hiring Pipeline</h1>
        <p className="text-slate-400">Move candidates through each evaluation stage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const inStage = candidates.filter((c) => c.stage === stage.key);
          return (
            <div key={stage.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{stage.label}</h2>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">
                  {inStage.length}
                </span>
              </div>

              <div className="space-y-3">
                {inStage.map((candidate) => {
                  const next = nextStage(candidate.stage);
                  return (
                    <div
                      key={candidate.id}
                      className={`bg-slate-800 border-l-4 ${stage.color} border border-slate-700 rounded-lg p-3`}
                    >
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{candidate.role}</div>
                      <div className="flex gap-3 text-xs mb-3">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-blue-400" />
                          Tech {candidate.technicalScore}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-green-400" />
                          Fit {candidate.cultureFitScore}
                        </span>
                      </div>
                      {next && (
                        <button
                          onClick={() => moveCandidate(candidate.id, next)}
                          className="w-full text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition"
                        >
                          Advance →
                        </button>
                      )}
                    </div>
                  );
                })}
                {inStage.length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-4 border border-dashed border-slate-700 rounded-lg">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const FALLBACK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Jane Doe', role: 'Software Engineer', stage: 'technical', technicalScore: 8.5, cultureFitScore: 9.0 },
  { id: 'c2', name: 'John Smith', role: 'Product Manager', stage: 'screening', technicalScore: 7.2, cultureFitScore: 8.1 },
  { id: 'c3', name: 'Aisha Khan', role: 'Data Analyst', stage: 'offer', technicalScore: 9.1, cultureFitScore: 8.8 },
  { id: 'c4', name: 'Carlos Reyes', role: 'Sales Lead', stage: 'culture_fit', technicalScore: 6.9, cultureFitScore: 9.3 },
];
