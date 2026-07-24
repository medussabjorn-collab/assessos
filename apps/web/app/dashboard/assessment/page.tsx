'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AssessmentView from '@/components/AssessmentView';
import AdaptiveAssessmentView from '@/components/AdaptiveAssessmentView';
import IdentityVerificationCapture from '@/components/IdentityVerificationCapture';
import { useSessionBinding } from '@/lib/use-session-binding';

const VERIFICATION_REQUIRED_MESSAGE = 'Identity verification required before starting this assessment';

type Phase = 'starting' | 'needs-verification' | 'ready' | 'error';

function AssessmentPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const configId = searchParams.get('configId');

  const [phase, setPhase] = useState<Phase>('starting');
  const [startData, setStartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [baselineDescriptor, setBaselineDescriptor] = useState<number[] | null>(null);

  const attemptStart = useCallback(async () => {
    if (!configId) return;
    setPhase('starting');
    setError(null);
    try {
      const response = await api.post('/api/assessments/sessions/start', { configId });
      setStartData(response.data.data);
      setPhase('ready');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (message === VERIFICATION_REQUIRED_MESSAGE) {
        setPhase('needs-verification');
      } else {
        setError('Failed to start assessment');
        setPhase('error');
      }
    }
  }, [configId]);

  useEffect(() => {
    if (!user || !configId) return;
    attemptStart();
  }, [user, configId, attemptStart]);

  const handleVerified = (descriptor: number[], id: string) => {
    setBaselineDescriptor(descriptor);
    setVerificationId(id);
    // Backend re-checks isVerifiedForUser on this retry — the just-submitted
    // record is now readable, so this should clear the gate.
    attemptStart();
  };

  const binding = useSessionBinding({
    sessionId: startData?.sessionId ?? '',
    verificationId,
    baselineDescriptor,
    enabled: phase === 'ready' && !!startData?.sessionId,
  });

  if (phase === 'starting') return <div className="p-8">Starting assessment...</div>;
  if (phase === 'error') return <div className="p-8 text-red-500">{error}</div>;

  if (phase === 'needs-verification') {
    return (
      <div className="p-8">
        <IdentityVerificationCapture onVerified={handleVerified} />
      </div>
    );
  }

  if (!startData) return <div className="p-8">Loading...</div>;

  if (binding.revoked) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-red-600 font-medium">
          This session was revoked by a proctoring integrity check (device or identity mismatch).
        </p>
        <p className="text-sm text-subtle mt-2">Contact your administrator to restart the assessment.</p>
      </div>
    );
  }

  // Module-based configs run the real-time adaptive flow (question served
  // directly in the start response); pillar configs keep the existing
  // fixed-batch flow.
  if (startData.question) {
    return (
      <AdaptiveAssessmentView
        sessionId={startData.sessionId}
        moduleId={startData.moduleId}
        initialQuestion={startData.question}
        initialProgress={startData.progress}
        initialAbility={startData.ability}
      />
    );
  }

  return (
    <AssessmentView
      sessionId={startData.sessionId}
      questions={startData.questions ?? []}
      timeLimitMin={startData.timeLimitMin}
    />
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}
