'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Briefcase,
  GraduationCap,
  Brain,
  Video,
  ShieldAlert,
  Users,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Profile {
  id: string;
  name: string;
  email: string;
  position: string;
  stage: string;
  appliedDate: string;
  scores: { technicalScore: number; cultureFitScore: number; overallScore: number };
  phone: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  notes: string[];
  rejectionReason: string | null;
}

interface AssessmentResultRow {
  id: string;
  moduleId: string;
  score: number;
  percentile: number | null;
  passed: boolean;
  proctoringRisk: string | null;
  gradedAt: string;
}

interface PsychometricResultRow {
  id: string;
  modelKey: string;
  scores: Record<string, number>;
  interpretation: string | null;
  createdAt: string;
}

interface InterviewFeedbackRow {
  id: string;
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

interface InterviewRow {
  id: string;
  scheduledFor: string;
  status: string;
  durationMin: number;
  feedback: InterviewFeedbackRow[];
}

interface ProctoringIncidentRow {
  id: string;
  category: string;
  severity: string;
  status: string;
  riskScore: number | null;
  resolution: string | null;
  createdAt: string;
}

interface RaterFeedbackRow {
  id: string;
  relationship: string;
  ratings: Record<string, number>;
  comments: string | null;
  isAnonymous: boolean;
  submittedAt: string;
}

interface StageHistoryRow {
  fromStage: string | null;
  toStage: string;
  outcome: string | null;
  technicalScore: number | null;
  cultureFitScore: number | null;
  decidedAt: string;
}

interface Candidate360 {
  profile: Profile;
  requisition: { id: string; title: string; status: string; headcount: number } | null;
  assessmentResults: AssessmentResultRow[];
  psychometricResults: PsychometricResultRow[];
  interviews: InterviewRow[];
  proctoringIncidents: ProctoringIncidentRow[];
  raterFeedback: RaterFeedbackRow[];
  stageHistory: StageHistoryRow[];
}

const STAGE_LABEL: Record<string, string> = {
  screening: 'Screening',
  technical: 'Technical',
  culture_fit: 'Culture Fit',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

const SEVERITY_COLOR: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frost-card p-5">
      <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
        <Icon size={16} className="text-brand-500" /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function Candidate360Page() {
  const params = useParams();
  const candidateId = String(params.id);
  const [data, setData] = useState<Candidate360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/hiring/candidates/${candidateId}/360`);
        setData(res.data.data);
      } catch {
        setError('Failed to load candidate profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-subtle">No data available</div>;

  const { profile, requisition, assessmentResults, psychometricResults, interviews, proctoringIncidents, raterFeedback, stageHistory } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hiring"
        title={profile.name}
        subtitle={`${profile.position} — applied ${new Date(profile.appliedDate).toLocaleDateString()}`}
        icon={Briefcase}
      />

      {/* Profile summary */}
      <div className="frost-card p-5">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-4 text-sm text-subtle">
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {profile.email}
            </span>
            {profile.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {profile.phone}
              </span>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-600 hover:underline"
              >
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-600 hover:underline"
              >
                <FileText size={14} /> Resume
              </a>
            )}
          </div>
          <span className="frost-pill bg-brand-100 text-brand-700 font-medium">
            {STAGE_LABEL[profile.stage] ?? profile.stage}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="bg-canvas border border-hairline rounded-lg p-3 text-center">
            <p className="text-xs text-subtle">Technical</p>
            <p className="text-xl font-bold text-ink">{profile.scores.technicalScore}</p>
          </div>
          <div className="bg-canvas border border-hairline rounded-lg p-3 text-center">
            <p className="text-xs text-subtle">Culture Fit</p>
            <p className="text-xl font-bold text-ink">{profile.scores.cultureFitScore}</p>
          </div>
          <div className="bg-canvas border border-hairline rounded-lg p-3 text-center">
            <p className="text-xs text-subtle">Overall</p>
            <p className="text-xl font-bold text-ink">{profile.scores.overallScore}</p>
          </div>
        </div>

        {profile.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-hairline text-sm text-subtle">
            {profile.notes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
          </div>
        )}
        {profile.rejectionReason && (
          <p className="mt-4 pt-4 border-t border-hairline text-sm text-red-500">
            Rejection reason: {profile.rejectionReason}
          </p>
        )}
      </div>

      {requisition && (
        <SectionCard icon={Briefcase} title="Requisition">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink font-medium">{requisition.title}</span>
            <span className="text-subtle">
              {requisition.status} · headcount {requisition.headcount}
            </span>
          </div>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard icon={GraduationCap} title="Assessment Results">
          {assessmentResults.length === 0 ? (
            <p className="text-subtle text-sm">No module-based assessments taken yet.</p>
          ) : (
            <div className="space-y-2">
              {assessmentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                  <span className="text-ink">{r.moduleId}</span>
                  <span className="flex items-center gap-2">
                    <span className={r.passed ? 'text-green-600' : 'text-red-500'}>{r.score}</span>
                    {r.proctoringRisk && r.proctoringRisk !== 'low' && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <ShieldAlert size={12} /> {r.proctoringRisk}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Brain} title="Psychometric Results">
          {psychometricResults.length === 0 ? (
            <p className="text-subtle text-sm">No psychometric results yet.</p>
          ) : (
            <div className="space-y-3">
              {psychometricResults.map((r) => (
                <div key={r.id} className="text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                  <p className="text-ink font-medium">{r.modelKey}</p>
                  {r.interpretation && <p className="text-subtle text-xs mt-0.5">{r.interpretation}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard icon={Video} title="Interviews">
        {interviews.length === 0 ? (
          <p className="text-subtle text-sm">No interviews scheduled yet.</p>
        ) : (
          <div className="space-y-4">
            {interviews.map((iv) => (
              <div key={iv.id} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink font-medium">{new Date(iv.scheduledFor).toLocaleString()}</span>
                  <span className="text-subtle">
                    {iv.status} · {iv.durationMin} min
                  </span>
                </div>
                {iv.feedback.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {iv.feedback.map((f) => (
                      <div key={f.id} className="bg-canvas border border-hairline rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-ink">Overall {f.overallScore}</span>
                          <span className="frost-pill bg-slate-100 text-slate-600">{f.recommendation}</span>
                        </div>
                        {f.comments && <p className="text-subtle text-xs">{f.comments}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard icon={ShieldAlert} title="Proctoring Incidents">
          {proctoringIncidents.length === 0 ? (
            <p className="text-subtle text-sm">No proctoring incidents.</p>
          ) : (
            <div className="space-y-2">
              {proctoringIncidents.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                  <span className="text-ink">{i.category}</span>
                  <span className={`frost-pill ${SEVERITY_COLOR[i.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                    {i.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Users} title="Rater Feedback">
          {raterFeedback.length === 0 ? (
            <p className="text-subtle text-sm">No rater feedback yet.</p>
          ) : (
            <div className="space-y-2">
              {raterFeedback.map((f) => (
                <div key={f.id} className="text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-ink font-medium">{f.relationship}</span>
                    {f.isAnonymous && <span className="text-xs text-subtle">Anonymous</span>}
                  </div>
                  {f.comments && <p className="text-subtle text-xs mt-0.5">{f.comments}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard icon={History} title="Stage History">
        {stageHistory.length === 0 ? (
          <p className="text-subtle text-sm">No stage transitions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {stageHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
                <span className="text-ink">
                  {h.fromStage ? `${STAGE_LABEL[h.fromStage] ?? h.fromStage} → ` : ''}
                  {STAGE_LABEL[h.toStage] ?? h.toStage}
                </span>
                <span className="text-subtle text-xs">{new Date(h.decidedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
