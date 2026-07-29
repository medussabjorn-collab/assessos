'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

type Phase = 'starting' | 'needs-verification' | 'needs-room-scan' | 'ready' | 'error';

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
      } else if (message === ROOM_SCAN_REQUIRED_MESSAGE) {
        setPhase('needs-room-scan');
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

  // Only a proctored assessment needs device/biometric binding — spinning up
  // the camera and loading face-api for every session (even a plain,
  // non-proctored quiz) was both wasteful and, in headless/no-camera
  // environments (e2e CI), crashed the page entirely.
  const binding = useSessionBinding({
    sessionId: startData?.sessionId ?? '',
    verificationId,
    baselineDescriptor,
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
  });

  // Tab-switch/blur/copy-paste/fullscreen-exit detection — no visual output,
  // reports straight to the same risk engine ProctoringPanel feeds.
  useCheatDetection({
    sessionId: startData?.sessionId ?? '',
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
  });

  // Keystroke-dynamics + mouse-movement drift detection — catches a
  // mid-session handoff to a different typist, complementing identity_drift
  // (face descriptor drift, via useSessionBinding above).
  useBehavioralBiometrics({
    sessionId: startData?.sessionId ?? '',
    enabled: phase === 'ready' && !!startData?.sessionId && !!startData?.aiProctoring,
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

  if (phase === 'needs-room-scan') {
    return (
      <div className="p-8">
        <EnvironmentScanCapture configId={configId!} onComplete={attemptStart} />
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
        <AssessmentView
          sessionId={startData.sessionId}
          questions={startData.questions ?? []}
          timeLimitMin={startData.timeLimitMin}
        />
      )}
      <ProctoringPanel sessionId={startData.sessionId} enabled={!!startData.aiProctoring} />
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}
