'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Download, Loader, HelpCircle, FlagTriangleRight, Users } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ReportViewProps {
  reportId: string;
}

interface Report {
  id: string;
  sessionId: string;
  status: string;
  dimensionScores: Record<string, number>;
  narrative: string;
  benchmarkPercentile: number;
  coachingPlan: any;
}

interface RaterFeedbackEntry {
  id: string;
  raterId: string | null;
  relationship: string;
  ratings: Record<string, number>;
  comments: string | null;
  isAnonymous: boolean;
  submittedAt: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'manager', label: 'Manager' },
  { value: 'peer', label: 'Peer' },
  { value: 'direct_report', label: 'Direct report' },
  { value: 'other', label: 'Other' },
];

interface ContributingAnswer {
  questionId: string;
  questionText: string;
  selectedOptionText: string | null;
  timeTakenSec: number | null;
}

interface ReportExplanation {
  reportId: string;
  narrative: string | null;
  recommendation: string | null;
  dimensionBreakdown: Array<{ dimension: string; score: number | null; contributingAnswers: ContributingAnswer[] }>;
  explanationMethod: string;
}

export default function ReportView({ reportId }: ReportViewProps) {
  const { user, tenantId } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ReportExplanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewRequested, setReviewRequested] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [feedbackEntries, setFeedbackEntries] = useState<RaterFeedbackEntry[]>([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [relationship, setRelationship] = useState('peer');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !reportId) return;

    const fetchReport = async () => {
      try {
        // Was a raw axios call to a hardcoded http://localhost:3000 with
        // manually-attached headers, bypassing the shared `api` client
        // (lib/api.ts) that every other real page in this app uses —
        // broken outside local dev (no NEXT_PUBLIC_API_URL / rewrite
        // resolution) and duplicated the token/tenant-header logic the
        // client's interceptor already does.
        const response = await api.get(`/api/reports/${reportId}`);
        setReport(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load report');
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user, tenantId]);

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF download via AI sidecar
    alert('PDF download coming in Phase 3');
  };

  const loadExplanation = async () => {
    setExplanationLoading(true);
    try {
      const res = await api.get(`/api/compliance/reports/${reportId}/explanation`);
      setExplanation(res.data.data);
    } catch {
      // leave explanation null; button stays available to retry
    } finally {
      setExplanationLoading(false);
    }
  };

  const requestReview = async () => {
    setReviewError(null);
    try {
      await api.post(`/api/compliance/reports/${reportId}/review-request`, {
        reason: reviewReason || undefined,
      });
      setReviewRequested(true);
    } catch {
      setReviewError('Could not submit review request. Try again.');
    }
  };

  const loadFeedback = async (sessionId: string) => {
    try {
      const res = await api.get(`/api/rater-feedback/sessions/${sessionId}`);
      setFeedbackEntries(res.data.data ?? []);
    } catch {
      // leave whatever was already loaded; not authorized or not found
    } finally {
      setFeedbackLoaded(true);
    }
  };

  useEffect(() => {
    if (report?.sessionId) loadFeedback(report.sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.sessionId]);

  const setRating = (dimension: string, value: number) => {
    setRatings((prev) => ({ ...prev, [dimension]: value }));
  };

  const submitFeedback = async () => {
    if (!report?.sessionId) return;
    setFeedbackError(null);
    setSubmittingFeedback(true);
    try {
      await api.post(`/api/rater-feedback/sessions/${report.sessionId}`, {
        relationship,
        ratings,
        comments: comments || undefined,
        isAnonymous,
      });
      setFeedbackSubmitted(true);
      loadFeedback(report.sessionId);
    } catch (err: any) {
      setFeedbackError(err?.response?.data?.message ?? 'Could not submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!report) {
    return <div className="p-8">Report not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900">
              Leadership Assessment Report
            </h1>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Status Badge */}
          <div className="inline-block">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                report.status === 'ready'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {report.status === 'ready' ? 'Report Ready' : 'Generating...'}
            </span>
          </div>
        </div>

        {report.status === 'pending' ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-brand-600" />
            <p className="text-gray-600">
              Your report is being generated. This typically takes 1-2 minutes.
              Please refresh the page in a moment.
            </p>
          </div>
        ) : (
          <>
            {/* Scores */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">
                Competency Dimension Scores
              </h2>

              {/* Fix vs the previous version: dimensionScores are 0-100 (see
                  the AI prompt in report-generator.service.ts — explicitly
                  asks for "<0-100>" per dimension), not 0-5. The old code
                  divided by 5 and labeled it "/5.0", so a real score like 78
                  rendered a bar at 1560% width and the label "78.0/5.0". */}
              <div className="h-64 mb-6">
                <Bar
                  data={{
                    labels: Object.keys(report.dimensionScores),
                    datasets: [
                      {
                        label: 'Score',
                        data: Object.values(report.dimensionScores),
                        backgroundColor: '#4f46e599',
                        borderColor: '#4f46e5',
                        borderWidth: 2,
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {Object.entries(report.dimensionScores).map(
                  ([dimension, score]) => (
                    <div
                      key={dimension}
                      className="border-l-4 border-blue-600 pl-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {dimension}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-brand-600">
                          {Math.round(score)}
                        </span>
                        <span className="text-gray-600">/100</span>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Narrative */}
            {report.narrative && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {report.narrative}
                </p>
              </div>
            )}

            {/* Benchmark */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Benchmark Percentile
              </h2>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-brand-600 mb-2">
                  {report.benchmarkPercentile}%
                </div>
                <p className="text-gray-600">
                  You rank in the {report.benchmarkPercentile}th percentile
                  compared to peer organizations.
                </p>
              </div>
            </div>

            {/* Coaching Plan */}
            {report.coachingPlan?.goals && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-900">
                  90-Day Coaching Plan
                </h2>

                <div className="space-y-6">
                  {report.coachingPlan.goals.map(
                    (goal: any, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-green-600 pl-4"
                      >
                        <h3 className="font-semibold text-gray-900 mb-3">
                          {goal.goal}
                        </h3>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Recommended Actions:
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {goal.actions?.map((action: string, i: number) => (
                              <li key={i} className="text-gray-600 text-sm">
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Compliance: GDPR Art. 22 / CPRA — explanation of the automated
                decision + a way to request human review. */}
            <div className="bg-white rounded-lg shadow-md p-8 mt-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">About this report</h2>

              {!explanation ? (
                <button
                  onClick={loadExplanation}
                  disabled={explanationLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <HelpCircle className="w-4 h-4" />
                  {explanationLoading ? 'Loading…' : 'How was this score generated?'}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{explanation.explanationMethod}</p>
                  {explanation.dimensionBreakdown.map((d) => (
                    <div key={d.dimension} className="border-l-4 border-slate-300 pl-4">
                      <p className="font-medium text-gray-900">
                        {d.dimension} — {d.score != null ? Math.round(d.score) : '—'}/100
                      </p>
                      {d.contributingAnswers.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {d.contributingAnswers.map((a) => (
                            <li key={a.questionId} className="text-sm text-gray-600">
                              {a.questionText} — <span className="italic">{a.selectedOptionText ?? '—'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                {reviewRequested ? (
                  <p className="text-sm text-green-700">
                    Review request submitted — an admin will follow up.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      Think this score is wrong? Request a human review.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        placeholder="Why? (optional)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={requestReview}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-900 transition"
                      >
                        <FlagTriangleRight className="w-4 h-4" />
                        Request review
                      </button>
                    </div>
                    {reviewError && <p className="text-sm text-red-500 mt-2">{reviewError}</p>}
                  </>
                )}
              </div>
            </div>

            {/* 360° feedback: peers/managers/direct-reports rate the same
                competency dimensions as the AI report. Subject-only viewers
                get anonymized entries with rater identity stripped;
                managers/admins see who submitted what — handled server-side. */}
            <div className="bg-white rounded-lg shadow-md p-8 mt-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6" /> 360° Feedback
              </h2>

              <div className="space-y-3 mb-6">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(report.dimensionScores).map((dim) => (
                    <div key={dim}>
                      <label className="text-sm text-gray-700 capitalize">{dim}</label>
                      <select
                        value={ratings[dim] ?? ''}
                        onChange={(e) => setRating(dim, Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="" disabled>Rate 1-5…</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Comments (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  Submit anonymously
                </label>

                <button
                  onClick={submitFeedback}
                  disabled={submittingFeedback || Object.keys(ratings).length === 0}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {submittingFeedback ? 'Submitting…' : 'Submit feedback'}
                </button>
                {feedbackSubmitted && (
                  <p className="text-sm text-green-700">Feedback submitted.</p>
                )}
                {feedbackError && <p className="text-sm text-red-500">{feedbackError}</p>}
              </div>

              {feedbackLoaded && (
                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    {feedbackEntries.length} response{feedbackEntries.length === 1 ? '' : 's'}
                  </h3>
                  {feedbackEntries.map((f) => (
                    <div key={f.id} className="border-l-4 border-slate-300 pl-4">
                      <p className="text-sm text-gray-600 capitalize">
                        {f.relationship.replace(/_/g, ' ')}
                        {f.raterId ? '' : ' (anonymous)'}
                        {' — '}
                        {new Date(f.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-800">
                        {Object.entries(f.ratings).map(([d, r]) => `${d}: ${r}/5`).join(' · ')}
                      </p>
                      {f.comments && <p className="text-sm text-gray-600 italic mt-1">&quot;{f.comments}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
