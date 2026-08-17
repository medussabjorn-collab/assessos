'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClipboardCheck, Users, Loader, FileDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download-file';
import PageHeader from '@/components/PageHeader';

interface Panelist {
  feedbackId: string;
  interviewerUserId: string | null;
  interviewerName: string | null;
  interviewerEmail: string | null;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureScore: number;
  overallScore: number;
  recommendation: string;
  strengths: string[];
  areasForImprovement: string[];
  comments: string;
}

interface Consensus {
  interviewId: string;
  candidateId: string;
  jobRoleId: string;
  panelistCount: number;
  panelists: Panelist[];
  averageScores: {
    technical: number | null;
    communication: number | null;
    problemSolving: number | null;
    culture: number | null;
    overall: number | null;
  };
  recommendationDistribution: { recommendation: string; count: number }[];
  consensusRecommendation: string | null;
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
  strong_no: 'Strong No',
  split_decision: 'Split Decision',
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-100 text-green-700',
  yes: 'bg-green-50 text-green-600',
  maybe: 'bg-amber-50 text-amber-600',
  no: 'bg-red-50 text-red-600',
  strong_no: 'bg-red-100 text-red-700',
  split_decision: 'bg-purple-50 text-purple-600',
};

function recommendationLabel(rec: string | null): string {
  if (!rec) return '—';
  return RECOMMENDATION_LABELS[rec] ?? rec;
}

export default function InterviewFeedbackPage() {
  const params = useParams();
  const id = String(params.id);
  const { user, userId } = useAuth();

  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [loadingConsensus, setLoadingConsensus] = useState(true);

  const [technicalScore, setTechnicalScore] = useState(3);
  const [communicationScore, setCommunicationScore] = useState(3);
  const [problemSolvingScore, setProblemSolvingScore] = useState(3);
  const [cultureScore, setCultureScore] = useState(3);
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const scoreFields: [string, number, (v: number) => void][] = [
    ['Technical', technicalScore, setTechnicalScore],
    ['Communication', communicationScore, setCommunicationScore],
    ['Problem Solving', problemSolvingScore, setProblemSolvingScore],
    ['Culture Fit', cultureScore, setCultureScore],
  ];

  const loadConsensus = useCallback(async () => {
    try {
      const res = await api.get(`/api/interviews/${id}/consensus`);
      setConsensus(res.data.data);
    } catch {
      setConsensus(null);
    } finally {
      setLoadingConsensus(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    loadConsensus();
  }, [user, id, loadConsensus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/api/interviews/${id}/feedback`, {
        interviewSessionId: id,
        interviewerId: userId,
        technicalScore,
        communicationScore,
        problemSolvingScore,
        cultureScore,
        strengths: strengths.split(',').map((s) => s.trim()).filter(Boolean),
        areasForImprovement: areasForImprovement.split(',').map((s) => s.trim()).filter(Boolean),
        comments,
      });
      setSubmitted(true);
      setStrengths('');
      setAreasForImprovement('');
      setComments('');
      await loadConsensus();
    } catch {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const exportMemo = () => {
    if (!consensus) return;
    const lines: string[] = [
      `DECISION MEMO — Interview ${consensus.interviewId}`,
      `Candidate: ${consensus.candidateId}`,
      `Role: ${consensus.jobRoleId}`,
      `Panelists: ${consensus.panelistCount}`,
      '',
      `CONSENSUS RECOMMENDATION: ${recommendationLabel(consensus.consensusRecommendation)}`,
      '',
      'AVERAGE SCORES (0-5)',
      `  Technical:       ${consensus.averageScores.technical ?? '—'}`,
      `  Communication:   ${consensus.averageScores.communication ?? '—'}`,
      `  Problem Solving: ${consensus.averageScores.problemSolving ?? '—'}`,
      `  Culture Fit:     ${consensus.averageScores.culture ?? '—'}`,
      `  Overall:         ${consensus.averageScores.overall ?? '—'}`,
      '',
      'RECOMMENDATION DISTRIBUTION',
      ...consensus.recommendationDistribution.map(
        ({ recommendation, count }) => `  ${recommendationLabel(recommendation)}: ${count}`,
      ),
      '',
      'PANELIST SCORECARDS',
    ];
    consensus.panelists.forEach((p, i) => {
      lines.push('');
      lines.push(
        `  ${i + 1}. ${p.interviewerName ?? p.interviewerEmail ?? 'Unknown panelist'} — ${recommendationLabel(p.recommendation)}`,
      );
      lines.push(
        `     Technical ${p.technicalScore} · Communication ${p.communicationScore} · Problem Solving ${p.problemSolvingScore} · Culture ${p.cultureScore} · Overall ${p.overallScore}`,
      );
      if (p.strengths.length) lines.push(`     Strengths: ${p.strengths.join(', ')}`);
      if (p.areasForImprovement.length) lines.push(`     Areas for improvement: ${p.areasForImprovement.join(', ')}`);
      if (p.comments) lines.push(`     Comments: ${p.comments}`);
    });

    downloadBlob(lines.join('\n'), `decision-memo-${consensus.interviewId}.txt`, 'text/plain');
  };

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Interviews"
        title="Panel Feedback & Consensus"
        subtitle="Submit your scorecard and see how the panel lines up."
        icon={ClipboardCheck}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="frost-card p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold text-ink">Your Scorecard</h2>

          {scoreFields.map(([label, value, setValue]) => (
            <div key={label}>
              <label className="block text-sm text-slate-600 mb-1">
                {label} ({value}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
          ))}

          <div>
            <label htmlFor="strengths" className="block text-sm text-slate-600 mb-1">
              Strengths (comma-separated)
            </label>
            <input
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="areas" className="block text-sm text-slate-600 mb-1">
              Areas for Improvement (comma-separated)
            </label>
            <input
              id="areas"
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="comments" className="block text-sm text-slate-600 mb-1">
              Comments
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={fieldClass}
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
          {submitted && (
            <p className="inline-flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} /> Feedback recorded
            </p>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <div className="frost-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Users size={18} /> Panel Consensus
            </h2>
            <button
              onClick={exportMemo}
              disabled={!consensus || consensus.panelistCount === 0}
              className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileDown size={14} /> Export Memo
            </button>
          </div>

          {loadingConsensus && (
            <div className="flex items-center justify-center py-10">
              <Loader className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          )}

          {!loadingConsensus && (!consensus || consensus.panelistCount === 0) && (
            <p className="text-subtle text-sm">No panel feedback submitted yet.</p>
          )}

          {!loadingConsensus && consensus && consensus.panelistCount > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={`frost-pill ${RECOMMENDATION_COLORS[consensus.consensusRecommendation ?? ''] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {recommendationLabel(consensus.consensusRecommendation)}
                </span>
                <span className="text-sm text-subtle">
                  {consensus.panelistCount} panelist{consensus.panelistCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {(
                  [
                    ['Technical', consensus.averageScores.technical],
                    ['Comm.', consensus.averageScores.communication],
                    ['Prob. Solving', consensus.averageScores.problemSolving],
                    ['Culture', consensus.averageScores.culture],
                    ['Overall', consensus.averageScores.overall],
                  ] as [string, number | null][]
                ).map(([label, value]) => (
                  <div key={label} className="bg-canvas border border-hairline rounded-lg p-2.5">
                    <p className="text-xs text-subtle">{label}</p>
                    <p className="text-lg font-bold text-ink">{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-subtle uppercase tracking-wide">
                      <th className="pb-2">Panelist</th>
                      <th className="pb-2">Tech</th>
                      <th className="pb-2">Comm</th>
                      <th className="pb-2">PS</th>
                      <th className="pb-2">Culture</th>
                      <th className="pb-2">Overall</th>
                      <th className="pb-2">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consensus.panelists.map((p) => (
                      <tr key={p.feedbackId} className="border-t border-hairline">
                        <td className="py-2 text-ink font-medium">
                          {p.interviewerName ?? p.interviewerEmail ?? 'Unknown'}
                        </td>
                        <td className="py-2">{p.technicalScore}</td>
                        <td className="py-2">{p.communicationScore}</td>
                        <td className="py-2">{p.problemSolvingScore}</td>
                        <td className="py-2">{p.cultureScore}</td>
                        <td className="py-2 font-semibold">{p.overallScore}</td>
                        <td className="py-2">
                          <span
                            className={`frost-pill ${RECOMMENDATION_COLORS[p.recommendation] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {recommendationLabel(p.recommendation)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
