'use client';

import { useState, useCallback, useEffect } from 'react';
import { ClipboardCheck, Clock, ShieldCheck, Loader, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AssessmentView from '@/components/AssessmentView';
import AdaptiveAssessmentView from '@/components/AdaptiveAssessmentView';
import IdentityVerificationCapture from '@/components/IdentityVerificationCapture';
import EnvironmentScanCapture from '@/components/EnvironmentScanCapture';
import ProctoringPanel from '@/components/ProctoringPanel';
import { useSessionBinding } from '@/lib/use-session-binding';
import { useCheatDetection } from '@/lib/use-cheat-detection';
import { useBehavioralBiometrics } from '@/lib/use-behavioral-biometrics';

const VERIFICATION_REQUIRED_MESSAGE = 'Identity verification required before starting this assessment';
const ROOM_SCAN_REQUIRED_MESSAGE = 'Room scan required before starting this assessment';

interface CandidateProfile {
  id: string;
  roleTitle: string;
  stage: string;
  assessmentSessionId: string | null;
  configId: string | null;
}

type Phase =
  | 'loading'
  | 'instructions'
  | 'starting'
  | 'needs-verification'
  | 'needs-room-scan'
  | 'ready'
  | 'already-in-progress'
  | 'already-done'
  | 'not-configured'
  | 'error';

export default function MyAssessmentPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('loading');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [startData, setStartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [baselineDescriptor, setBaselineDescriptor] = useState<number[] | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/candidates/me');
      const p: CandidateProfile = res.data.data;
      setProfile(p);
      if (!p.assessmentSessionId) {
        setPhase(p.configId ? 'instructions' : 'not-configured');
        return;
      }
      const sessionRes = await api.get(`/api/assessments/sessions/${p.assessmentSessionId}`);
      const status = sessionRes.data.data?.status;
      setPhase(status === 'done' ? 'already-done' : 'already-in-progress');
    } catch {
      setError('Could not load your assessment. Contact your recruiter if this keeps happening.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user, loadProfile]);

  const attemptStart = useCallback(async () => {
    setPhase('starting');
    setError(null);
    try {
      const response = await api.post('/api/candidates/me/start-assessment');
      setStartData(response.data.data);
      setPhase('ready');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (message === VERIFICATION_REQUIRED_MESSAGE) {
        setPhase('needs-verification');
      } else if (message === ROOM_SCAN_REQUIRED_MESSAGE) {
        setPhase('needs-room-scan');
      } else {
        setError(message ?? 'Failed to start your assessment. Contact your recruiter for help.');
        setPhase('error');
      }
    }
  }, []);

  const handleVerified = (descriptor: number[], id: string) => {
    setBaselineDescriptor(descriptor);
    setVerificationId(id);
    attemptStart();
  };

  const binding = useSessionBinding({
    sessionId: startData?.sessionId ?? '',
    verificationId,
    baselineDescriptor,
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
  });
  useCheatDetection({
    sessionId: startData?.sessionId ?? '',
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
  });
  useBehavioralBiometrics({
    sessionId: startData?.sessionId ?? '',
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
  });

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (phase === 'error') {
    return <div className="frost-card p-8 max-w-lg mx-auto mt-16 text-center text-red-500">{error}</div>;
  }

  if (phase === 'already-done') {
    return (
      <div className="frost-card p-10 max-w-lg mx-auto mt-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-ink mb-1">Assessment complete</p>
        <p className="text-sm text-subtle">
          Thanks for completing your assessment for {profile?.roleTitle}. Your recruiter will follow up with next
          steps.
        </p>
      </div>
    );
  }

  if (phase === 'not-configured') {
    return (
      <div className="frost-card p-10 max-w-lg mx-auto mt-16 text-center">
        <ClipboardCheck className="w-12 h-12 text-subtle mx-auto mb-4" />
        <p className="text-lg font-semibold text-ink mb-1">No assessment ready yet</p>
        <p className="text-sm text-subtle">
          Your recruiter hasn't published an assessment for {profile?.roleTitle} yet. Check back soon, or reach out
          to them directly.
        </p>
      </div>
    );
  }

  if (phase === 'already-in-progress') {
    return (
      <div className="frost-card p-10 max-w-lg mx-auto mt-16 text-center">
        <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-ink mb-1">Assessment already in progress</p>
        <p className="text-sm text-subtle">
          It looks like you've already started your assessment for {profile?.roleTitle}. If you were interrupted or
          this looks wrong, contact your recruiter — they can help you get back in.
        </p>
      </div>
    );
  }

  if (phase === 'instructions') {
    return (
      <div className="frost-card p-8 max-w-lg mx-auto mt-16">
        <ClipboardCheck className="w-10 h-10 text-brand-500 mb-4" />
        <h1 className="text-xl font-bold text-ink mb-1">Your assessment for {profile?.roleTitle}</h1>
        <p className="text-sm text-subtle mb-6">
          Take your time and answer honestly — there's no trick questions. Once you start the timer begins, so make
          sure you're somewhere quiet with a stable connection before continuing.
        </p>
        <ul className="space-y-2 text-sm text-ink mb-6">
          <li className="flex items-start gap-2">
            <Clock size={15} className="text-subtle mt-0.5 shrink-0" /> You'll see the exact time limit on the next
            screen — the clock only starts once you begin.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={15} className="text-subtle mt-0.5 shrink-0" /> Some assessments require a quick
            identity check or room scan first — you'll be guided through it if needed.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-subtle mt-0.5 shrink-0" /> Your recruiter will follow up after
            you submit — there's no pass/fail shown to you directly.
          </li>
        </ul>
        <button
          onClick={attemptStart}
          className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition"
        >
          Start assessment
        </button>
      </div>
    );
  }

  if (phase === 'starting') {
    return <div className="p-8 text-center text-subtle">Starting your assessment…</div>;
  }

  if (phase === 'needs-verification') {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <IdentityVerificationCapture onVerified={handleVerified} />
      </div>
    );
  }

  if (phase === 'needs-room-scan') {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <EnvironmentScanCapture configId={profile?.configId ?? ''} onComplete={attemptStart} />
      </div>
    );
  }

  if (!startData) return <div className="p-8 text-center text-subtle">Loading…</div>;

  if (binding.revoked) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-red-600 font-medium">
          This session was revoked by a proctoring integrity check (device or identity mismatch).
        </p>
        <p className="text-sm text-subtle mt-2">Contact your recruiter to restart your assessment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
      {startData.question ? (
        <AdaptiveAssessmentView
          sessionId={startData.sessionId}
          moduleId={startData.moduleId}
          initialQuestion={startData.question}
          initialProgress={startData.progress}
          initialAbility={startData.ability}
        />
      ) : (
        <AssessmentView sessionId={startData.sessionId} questions={startData.questions ?? []} timeLimitMin={startData.timeLimitMin} />
      )}
      <ProctoringPanel sessionId={startData.sessionId} enabled={!!startData.aiProctoring} />
    </div>
  );
}
