'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Loader, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface CaseStudySummary {
  id: string;
  title: string;
  industry: string;
  roleLevel: string;
}

const ROLE_LEVEL_LABEL: Record<string, string> = {
  manager: 'Manager',
  director: 'Director',
  vp: 'VP',
  c_suite: 'C-Suite',
};

export default function CaseStudiesPage() {
  const { hasPermission } = useAuth();
  const canReview = hasPermission(PERMISSIONS.ASSESSMENT_SCENARIOS_MANAGE);
  const [caseStudies, setCaseStudies] = useState<CaseStudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/case-studies');
        setCaseStudies(res.data.data ?? []);
      } catch {
        setError('Failed to load case studies');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Assessments"
        title="Case Studies"
        subtitle="Executive scenarios graded against a weighted rubric. Read the scenario, write your response, get scored feedback."
        icon={Briefcase}
        action={
          canReview ? (
            <Link
              href="/dashboard/case-studies/review"
              className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-sm text-slate-700 hover:bg-canvas transition"
            >
              <Sparkles size={15} /> Review pending
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : caseStudies.length === 0 ? (
        <div className="frost-card p-8 text-center text-subtle">
          No case studies available yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <Link
              key={cs.id}
              href={`/dashboard/case-studies/${cs.id}`}
              className="frost-card p-5 flex flex-col gap-3 hover:border-brand-500 transition"
            >
              <h2 className="font-semibold text-ink">{cs.title}</h2>
              <div className="flex items-center gap-3 text-xs text-subtle">
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {cs.industry}
                </span>
                <span className="frost-pill bg-slate-100 text-slate-600">
                  {ROLE_LEVEL_LABEL[cs.roleLevel] ?? cs.roleLevel}
                </span>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Start <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
