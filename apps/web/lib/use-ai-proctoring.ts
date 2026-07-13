'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Ported from leadership-assessment's src/hooks/useAIProctoring.ts. Loads the
// classic worker at public/workers/proctoring-worker.js (see that file for
// why it's a static asset rather than a bundled ES module worker).

export type ProctoringWorkerEvent =
  | { kind: 'NO_FACE'; ts: number }
  | { kind: 'MULTIPLE_FACES'; ts: number; count: number }
  | { kind: 'FACE_AWAY'; ts: number; yaw: number; pitch: number }
  | { kind: 'FACE_DETECTED'; ts: number }
  | { kind: 'READY' }
  | { kind: 'ERROR'; message: string };

export interface ProctoringViolation {
  kind: string;
  ts: number;
  riskDelta: number;
  message: string;
}

export interface ProctoringState {
  ready: boolean;
  faceDetected: boolean;
  riskScore: number;
  events: ProctoringViolation[];
}

interface Options {
  videoRef: React.RefObject<HTMLVideoElement>;
  sessionId: string;
  enabled: boolean;
  onViolation?: (v: ProctoringViolation) => void;
}

// Client-side risk display only — the authoritative, decayed risk score lives
// server-side (ProctoringService). This just drives the live on-screen meter.
const RISK_WEIGHTS: Record<string, number> = {
  NO_FACE: 8,
  MULTIPLE_FACES: 15,
  FACE_AWAY: 5,
};

export function useAIProctoring({ videoRef, sessionId: _sessionId, enabled, onViolation }: Options) {
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number>(0);
  const riskRef = useRef(0);
  const [state, setState] = useState<ProctoringState>({
    ready: false,
    faceDetected: false,
    riskScore: 0,
    events: [],
  });

  const addEvent = useCallback(
    (v: ProctoringViolation) => {
      riskRef.current = Math.min(100, riskRef.current + v.riskDelta);
      setState((s) => ({
        ...s,
        riskScore: riskRef.current,
        faceDetected: v.kind === 'FACE_DETECTED',
        events: [...s.events.slice(-49), v],
      }));
      onViolation?.(v);
    },
    [onViolation],
  );

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const worker = workerRef.current;
    if (!video || !worker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(captureFrame);
      return;
    }

    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;

    try {
      createImageBitmap(video).then((bitmap) => {
        worker.postMessage({ type: 'FRAME', bitmap, width: w, height: h }, [bitmap]);
      });
    } catch {
      // VideoFrame not ready
    }

    rafRef.current = requestAnimationFrame(captureFrame);
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker('/workers/proctoring-worker.js');
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<ProctoringWorkerEvent>) => {
      const ev = e.data;
      switch (ev.kind) {
        case 'READY':
          setState((s) => ({ ...s, ready: true }));
          rafRef.current = requestAnimationFrame(captureFrame);
          break;

        case 'FACE_DETECTED':
          setState((s) => ({ ...s, faceDetected: true }));
          break;

        case 'NO_FACE':
          addEvent({ kind: 'NO_FACE', ts: ev.ts, riskDelta: RISK_WEIGHTS.NO_FACE, message: 'No face detected' });
          break;

        case 'MULTIPLE_FACES':
          addEvent({
            kind: 'MULTIPLE_FACES',
            ts: ev.ts,
            riskDelta: RISK_WEIGHTS.MULTIPLE_FACES,
            message: `${ev.count} faces detected`,
          });
          break;

        case 'FACE_AWAY':
          addEvent({ kind: 'FACE_AWAY', ts: ev.ts, riskDelta: RISK_WEIGHTS.FACE_AWAY, message: 'Looking away from screen' });
          break;

        case 'ERROR':
          console.warn('[Proctoring worker error]', ev.message);
          break;
      }
    };

    worker.postMessage({ type: 'INIT', modelsUrl: '/models' });

    return () => {
      cancelAnimationFrame(rafRef.current);
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled, captureFrame, addEvent]);

  return state;
}
