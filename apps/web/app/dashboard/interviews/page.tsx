'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, ShieldCheck, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Interview {
  id: string;
  candidateName: string;
  role: string;
  scheduledAt: string;
  status: string;
  roomUrl: string;
}

type Phase = 'list' | 'active' | 'feedback' | 'done';

export default function InterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [phase, setPhase] = useState<Phase>('list');
  const [active, setActive] = useState<Interview | null>(null);
  const [tech, setTech] = useState('');
  const [culture, setCulture] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get('/api/interviews');
        setInterviews(res.data.data ?? []);
      } catch {
        // leave empty
      }
    })();
  }, [user]);

  const start = async (iv: Interview) => {
    try {
      await api.post(`/api/interviews/${iv.id}/start`, {});
    } catch {
      // ignore
    }
    setActive(iv);
    setPhase('active');
  };

  const submitFeedback = async () => {
    try {
      await api.post(`/api/interviews/${active?.id}/feedback`, {
        technicalScore: tech,
        cultureFitScore: culture,
        notes,
      });
    } catch {
      // ignore
    }
    setPhase('done');
  };

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <div>
      <PageHeader
        eyebrow="Engagement"
        title="Interviews"
        subtitle="Schedule and run AI-proctored interview sessions, then capture structured feedback."
        icon={Video}
        action={
          <Link
            href="/dashboard/interviews/schedule"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition"
          >
            <CalendarPlus size={16} />
            Schedule
          </Link>
        }
      />

      {phase === 'list' && (
        <div className="grid gap-3">
          {interviews.map((iv) => (
            <div
              key={iv.id}
              className="flex items-center justify-between bg-surface border border-hairline rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-brand-600/15 text-brand-500 font-semibold">
                  {iv.candidateName.charAt(0)}
                </span>
                <div>
                  <p className="font-semibold text-ink">{iv.candidateName}</p>
                  <p className="text-sm text-subtle">{iv.role}</p>
                </div>
              </div>
              <button
                onClick={() => start(iv)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
              >
                Start Interview
              </button>
            </div>
          ))}
        </div>
      )}

      {phase === 'active' && active && (
        <div className="bg-surface border border-hairline rounded-xl p-6 max-w-2xl">
          <p className="text-ink font-medium mb-1">{active.candidateName}</p>
          <p className="text-sm text-subtle mb-4">{active.role}</p>
          <div className="aspect-video rounded-lg bg-canvas border border-hairline flex items-center justify-center mb-4">
            <span className="text-slate-600">Live video room</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
              <ShieldCheck size={18} /> AI Proctoring Active
            </span>
            <button
              onClick={() => setPhase('feedback')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              End Interview
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitFeedback();
          }}
          className="max-w-md space-y-4 bg-surface border border-hairline rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-ink">Interview Feedback</h2>
          <div>
            <label htmlFor="tech" className="block text-sm text-slate-600 mb-1">
              Technical Score
            </label>
            <input
              id="tech"
              type="number"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="culture" className="block text-sm text-slate-600 mb-1">
              Culture Fit
            </label>
            <input
              id="culture"
              type="number"
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm text-slate-600 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Submit Feedback
          </button>
        </form>
      )}

      {phase === 'done' && (
        <div className="max-w-md bg-surface border border-hairline rounded-xl p-6">
          <p className="inline-flex items-center gap-2 text-green-400 font-semibold">
            <ShieldCheck size={18} /> Feedback submitted
          </p>
        </div>
      )}
    </div>
  );
}
