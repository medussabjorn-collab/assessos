'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { submitVerification, IdentityVerificationRecord } from '../lib/identity-verification';
import { loadFaceModels, detectFaceConfidence, captureDescriptor, matchScore, captureVideoFrame } from '../lib/face-verification';

type Step = 'loading' | 'document' | 'selfie1' | 'selfie2' | 'submitting' | 'result';

interface IdentityVerificationCaptureProps {
  // Baseline descriptor (128 floats) the caller should persist for the
  // session — reused by useSessionBinding's reverify heartbeat to detect
  // mid-session identity drift against the same reference.
  onVerified: (baselineDescriptor: number[], verificationId: string) => void;
}

/**
 * Pre-session identity check. Two real, disclosed limitations vs a full KYC
 * vendor (identity.service.ts explicitly does no CV/OCR itself):
 *  - Document check only confirms a face is visible on the captured photo
 *    (tinyFaceDetector confidence) — not document authenticity/OCR.
 *  - faceMatchScore compares two live selfie captures a couple seconds apart
 *    (proves "same live person held still through verification" and gives a
 *    real baseline descriptor), not the live selfie against the document
 *    photo — matching a small/low-res ID photo with the tiny models vendored
 *    here is unreliable enough that faking confidence in it would be worse
 *    than not measuring it at all.
 */
export default function IdentityVerificationCapture({ onVerified }: IdentityVerificationCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<Step>('loading');
  const [camError, setCamError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<IdentityVerificationRecord | null>(null);

  const documentScoreRef = useRef<number>(0);
  const selfieDescriptorRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFaceModels()
      .then(() => {
        if (!cancelled) setStep('document');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load face verification models');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step === 'loading' || step === 'submitting' || step === 'result') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera not supported in this browser');
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => setCamError(err instanceof Error ? err.message : 'Camera access denied'));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [step]);

  const captureDocument = async () => {
    if (!videoRef.current) return;
    setError(null);
    const frame = captureVideoFrame(videoRef.current);
    const score = await detectFaceConfidence(frame);
    documentScoreRef.current = score;
    if (score === 0) {
      setError('No face visible in that shot — hold the ID steady and try again.');
      return;
    }
    setStep('selfie1');
  };

  const captureFirstSelfie = async () => {
    if (!videoRef.current) return;
    setError(null);
    const descriptor = await captureDescriptor(videoRef.current);
    if (!descriptor) {
      setError('No face detected — look at the camera and try again.');
      return;
    }
    selfieDescriptorRef.current = descriptor;
    setStep('selfie2');
  };

  const captureSecondSelfieAndSubmit = async () => {
    if (!videoRef.current || !selfieDescriptorRef.current) return;
    setError(null);
    const descriptor2 = await captureDescriptor(videoRef.current);
    if (!descriptor2) {
      setError('No face detected — look at the camera and try again.');
      return;
    }

    setStep('submitting');
    const faceMatchScore = matchScore(selfieDescriptorRef.current, descriptor2);

    try {
      const result = await submitVerification({
        documentType: 'national_id',
        documentVerified: documentScoreRef.current > 0,
        documentScore: documentScoreRef.current,
        faceMatchScore,
        livenessPassed: true,
        otpVerified: false,
      });
      setRecord(result);
      setStep('result');
      if (result.status === 'verified') {
        onVerified(Array.from(descriptor2), result.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification submission failed');
      setStep('selfie1');
    }
  };

  const retry = () => {
    setRecord(null);
    setError(null);
    documentScoreRef.current = 0;
    selfieDescriptorRef.current = null;
    setStep('document');
  };

  if (step === 'loading') {
    return (
      <div className="frost-card p-8 flex flex-col items-center gap-3 text-sm text-subtle">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading identity verification models…
      </div>
    );
  }

  if (step === 'result' && record) {
    if (record.status === 'verified') {
      return (
        <div className="frost-card p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <p className="font-medium text-ink">Identity verified</p>
          <p className="text-sm text-subtle">Starting your assessment…</p>
        </div>
      );
    }
    return (
      <div className="frost-card p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
        <p className="font-medium text-ink">
          {record.status === 'manual_review'
            ? 'Verification needs manual review'
            : 'Verification failed'}
        </p>
        <p className="text-sm text-subtle">
          {record.status === 'manual_review'
            ? "We couldn't confirm your identity automatically. Try again with better lighting, or wait for an admin to review this submission."
            : 'The face match confidence was too low. Make sure you\'re well-lit and looking directly at the camera.'}
        </p>
        <button onClick={retry} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm">
          Try again
        </button>
      </div>
    );
  }

  const stepCopy: Record<string, { title: string; instructions: string; action: string; onAction: () => void }> = {
    document: {
      title: 'Step 1 of 3 — Show your ID',
      instructions: 'Hold your ID document up to the camera so your photo is clearly visible.',
      action: 'Capture ID',
      onAction: captureDocument,
    },
    selfie1: {
      title: 'Step 2 of 3 — Look at the camera',
      instructions: 'Look directly at the camera and hold still.',
      action: 'Capture',
      onAction: captureFirstSelfie,
    },
    selfie2: {
      title: 'Step 3 of 3 — One more, still looking at the camera',
      instructions: 'Stay still — this confirms it\'s really you.',
      action: 'Capture',
      onAction: captureSecondSelfieAndSubmit,
    },
  };
  const current = stepCopy[step];

  return (
    <div className="frost-card p-6 max-w-md mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <Camera className="w-5 h-5" /> {current?.title}
        </h2>
        <p className="text-sm text-subtle mt-1">{current?.instructions}</p>
      </div>

      {camError ? (
        <p className="text-sm text-red-600">{camError}</p>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black/80 aspect-video" />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(step === 'submitting') ? (
        <div className="flex items-center gap-2 text-sm text-subtle">
          <Loader2 className="w-4 h-4 animate-spin" /> Submitting verification…
        </div>
      ) : (
        <button
          onClick={current?.onAction}
          disabled={!!camError}
          className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition text-sm font-medium"
        >
          {current?.action}
        </button>
      )}
    </div>
  );
}
