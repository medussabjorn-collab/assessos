'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Briefcase, Loader, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface RubricDimension {
  dimension: string;
  description: string;
  weight: number;
}

interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  roleLevel: string;
  scenario: string;
  rubric: RubricDimension[];
}

interface DimensionScore {
  dimension: string;
  score: number;
}

interface Submission {
  id: string;
  scores: DimensionScore[];
  overallScore: number;
  summary: string;
}

const ROLE_LEVEL_LABEL: Record<string, string> = {
  manager: 'Manager',
  director: 'Director',
  vp: 'VP',
  c_suite: 'C-Suite',
};

export default function CaseStudyDetailPage() {
  const params = useParams();
  const caseStudyId = String(params.id);

  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [caseStudyRes, submissionRes] = await Promise.all([
          api.get(`/api/case-studies/${caseStudyId}`),
          api.get(`/api/case-studies/${caseStudyId}/my-submission`),
        ]);
        setCaseStudy(caseStudyRes.data.data);
        if (submissionRes.data.data) {
          setSubmission(submissionRes.data.data);
        }
      } catch {
        setError('Failed to load case study');
      } finally {
        setLoading(false);
      }
    })();
  }, [caseStudyId]);

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post(`/api/case-studies/${caseStudyId}/submit`, {
        responseText,
      });
      setSubmission(res.data.data);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.detail ?? 'Failed to grade response. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    'w-full border border-hairline rounded-lg px-3 py-2 text-sm bg-surface text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }
  if (error || !caseStudy) {
    return <div className="p-8 text-red-500">{error ?? 'Case study not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Case Study"
        title={caseStudy.title}
        subtitle={caseStudy.scenario}
        icon={Briefcase}
      />

      <div className="flex items-center gap-3 text-xs text-subtle -mt-4">
        <span className="flex items-center gap-1">
          <Building2 size={12} /> {caseStudy.industry}
        </span>
        <span className="frost-pill bg-slate-100 text-slate-600">
          {ROLE_LEVEL_LABEL[caseStudy.roleLevel] ?? caseStudy.roleLevel}
        </span>
      </div>

      <div className="frost-card p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Grading rubric</h2>
        <div className="space-y-3">
          {caseStudy.rubric.map((r) => (
            <div key={r.dimension} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-medium text-ink">{r.dimension}</p>
                <p className="text-subtle text-xs mt-0.5">{r.description}</p>
              </div>
              <span className="shrink-0 text-xs text-subtle">
                {Math.round(r.weight * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {submission ? (
        <div className="frost-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Your results</h2>
            <span className="text-2xl font-bold text-brand-600">
              {submission.overallScore.toFixed(1)}
              <span className="text-sm text-subtle font-normal"> / 5</span>
            </span>
          </div>

          <div className="space-y-3">
            {submission.scores.map((s) => (
              <div key={s.dimension}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink">{s.dimension}</span>
                  <span className="text-subtle">{s.score} / 5</span>
                </div>
                <div className="w-full bg-hairline rounded-full h-2.5">
                  <div
                    className="bg-brand-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${(s.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-hairline">
            <h3 className="text-sm font-semibold text-ink mb-1">Feedback</h3>
            <p className="text-sm text-subtle">{submission.summary}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submitResponse} className="frost-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ink">Your response</h2>
          <textarea
            required
            rows={10}
            placeholder="Write your response to the scenario above…"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className={field}
          />
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting || responseText.trim().length === 0}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {submitting && <Loader className="w-4 h-4 animate-spin" />}
            {submitting ? 'Grading…' : 'Submit for grading'}
          </button>
        </form>
      )}
    </div>
  );
}
