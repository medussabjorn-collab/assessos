'use client';

import { useEffect, useRef, useState } from 'react';
import { ScanEye, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { submitEnvironmentScan, EnvironmentScan } from '../lib/environment-scan';
import { loadFaceModels, detectFaceCount, captureVideoFrame } from '../lib/face-verification';
import { loadObjectDetectionModel, detectPhone } from '../lib/object-detection';

type Step = 'loading' | 'ready' | 'scanning' | 'result';

interface EnvironmentScanCaptureProps {
  configId: string;
  onComplete: () => void;
}

/**
 * Pre-session room scan. Honest scope, matching the disclosure pattern in
 * IdentityVerificationCapture: this only actually detects what a real,
 * locally-vendored model genuinely can —
 *  - personsDetected: real face count in one frame (detectFaceCount).
 *  - faceVisible: personsDetected >= 1.
 *  - monitorsDetected: window.screen.isExtended when the browser supports it
 *    (Chrome/Edge), otherwise left at the default of 1 rather than guessing.
 *  - phoneDetected: real coco-ssd object detection ('cell phone' class,
 *    score >= 0.6) via detectPhone — see lib/object-detection.ts.
 * notesDetected / whiteboardDetected / vmDetected / remoteAccessDetected /
 * screenShareDetected / vpn-or-proxy-or-tor are still left undetected
 * (omitted from the submission) — no object-detection class distinguishes a
 * notebook from a whiteboard, and there is no network-probe or VM/remote-
 * desktop fingerprint vendored in this codebase; reporting false negatives
 * with unearned confidence would be worse than reporting nothing.
 * EnvironmentService.evaluate() on the backend still runs its full policy
 * check against whatever real fields this does send.
 */
export default function EnvironmentScanCapture({ configId, onComplete }: EnvironmentScanCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<Step>('loading');
  const [camError, setCamError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<EnvironmentScan | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFaceModels(), loadObjectDetectionModel()])
      .then(() => {
        if (!cancelled) setStep('ready');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scan models');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step === 'loading' || step === 'result') return;
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

  const runScan = async () => {
    if (!videoRef.current) return;
    setError(null);
    setStep('scanning');

    try {
      const frame = captureVideoFrame(videoRef.current);
      const [personsDetected, phoneDetected] = await Promise.all([
        detectFaceCount(frame),
        detectPhone(frame),
      ]);
      // Real API (Chrome/Edge) for whether the OS reports more than one
      // logical screen — not guessed when unsupported.
      const isExtended = (window.screen as unknown as { isExtended?: boolean }).isExtended;

      const result = await submitEnvironmentScan({
        configId,
        scanType: 'pre_session',
        personsDetected,
        monitorsDetected: isExtended ? 2 : 1,
        faceVisible: personsDetected >= 1,
        phoneDetected,
      });
      setScan(result);
      setStep('result');
      if (result.status !== 'blocked') {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Room scan submission failed');
      setStep('ready');
    }
  };

  const retry = () => {
    setScan(null);
    setError(null);
    setStep('ready');
  };

  if (step === 'loading') {
    return (
      <div className="frost-card p-8 flex flex-col items-center gap-3 text-sm text-subtle">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading room scan…
      </div>
    );
  }

  if (step === 'result' && scan) {
    if (scan.status !== 'blocked') {
      return (
        <div className="frost-card p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <p className="font-medium text-ink">Room scan complete</p>
          {scan.findings.length > 0 && (
            <p className="text-sm text-amber-600">{scan.findings.join(', ')}</p>
          )}
          <p className="text-sm text-subtle">Starting your assessment…</p>
        </div>
      );
    }
    return (
      <div className="frost-card p-8 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <p className="font-medium text-ink">Room scan didn&apos;t pass</p>
        <p className="text-sm text-subtle">{scan.findings.join(', ') || 'Please clear the flagged issue and try again.'}</p>
        <button onClick={retry} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="frost-card p-6 max-w-md mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <ScanEye className="w-5 h-5" /> Room check
        </h2>
        <p className="text-sm text-subtle mt-1">
          Make sure you&apos;re alone and your face is clearly visible, then scan your space.
        </p>
      </div>

      {camError ? (
        <p className="text-sm text-red-600">{camError}</p>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black/80 aspect-video" />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {step === 'scanning' ? (
        <div className="flex items-center gap-2 text-sm text-subtle">
          <Loader2 className="w-4 h-4 animate-spin" /> Scanning…
        </div>
      ) : (
        <button
          onClick={runScan}
          disabled={!!camError}
          className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition text-sm font-medium"
        >
          Scan room
        </button>
      )}
    </div>
  );
}
