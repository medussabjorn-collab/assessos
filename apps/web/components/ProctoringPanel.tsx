'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, ShieldCheck, Video, VideoOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAIProctoring, ProctoringViolation } from '../lib/use-ai-proctoring';

// Maps the client-side worker event kind to the backend's ProctoringEventType
// (modules/proctoring/proctoring.service.ts) so violations feed the real,
// decayed session risk score — not just the local on-screen meter.
const EVENT_TYPE_MAP: Record<string, string> = {
  NO_FACE: 'face_not_detected',
  MULTIPLE_FACES: 'multiple_faces',
  FACE_AWAY: 'looking_away',
};

interface ProctoringPanelProps {
  sessionId: string;
  enabled: boolean;
}

/**
 * Live webcam proctoring panel. Ported from leadership-assessment's
 * EnhancedProctoringPanel + useAIProctoring, wired to the real backend: every
 * violation the worker detects is POSTed to /api/proctoring/event (existing
 * `api` client — Firebase ID token + x-tenant-id already attached by its
 * request interceptor), so the server-side risk engine, incident
 * auto-escalation, and integrity chain all see it, not just this panel.
 */
export default function ProctoringPanel({ sessionId, enabled }: ProctoringPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [lastServerLevel, setLastServerLevel] = useState<'safe' | 'warning' | 'critical' | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera not supported in this browser');
      return;
    }

    // Guards the async gap: if this effect is cleaned up (enabled flips
    // false, or unmount) before getUserMedia resolves, `cancelled` makes the
    // resolved handler stop the just-acquired stream immediately instead of
    // leaking it — a bare `stream?.getTracks()` in cleanup only helps once
    // `stream` has actually been assigned.
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
  }, [enabled]);

  const handleViolation = (v: ProctoringViolation) => {
    const eventType = EVENT_TYPE_MAP[v.kind];
    if (!eventType) return;

    api
      .post('/api/proctoring/event', { sessionId, eventType })
      .then((res) => setLastServerLevel(res.data?.data?.level ?? null))
      .catch((err) => console.warn('[proctoring] event POST failed', err));
  };

  const { ready, faceDetected, riskScore, events } = useAIProctoring({
    videoRef,
    sessionId,
    enabled: enabled && !camError,
    onViolation: handleViolation,
  });

  if (!enabled) return null;

  const levelColor =
    lastServerLevel === 'critical'
      ? 'text-red-600 bg-red-50'
      : lastServerLevel === 'warning'
        ? 'text-amber-600 bg-amber-50'
        : 'text-brand-600 bg-brand-50';

  return (
    <div className="frost-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          {faceDetected ? <ShieldCheck className="w-4 h-4 text-brand-500" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
          Proctoring
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor}`}>
          {lastServerLevel ? lastServerLevel.toUpperCase() : ready ? 'MONITORING' : 'STARTING'}
        </span>
      </div>

      {camError ? (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <VideoOff className="w-3.5 h-3.5" /> {camError}
        </p>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black/80 aspect-video" />
      )}

      <div className="flex items-center justify-between text-xs text-subtle">
        <span className="flex items-center gap-1">
          <Video className="w-3.5 h-3.5" /> Local risk: {riskScore}
        </span>
        <span>{events.length} event{events.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}
