import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProctoringEvent } from '../workers/proctoring.worker';

export interface ProctoringState {
  ready:        boolean;
  faceDetected: boolean;
  riskScore:    number;
  events:       ProctoringViolation[];
}

export interface ProctoringViolation {
  kind:      string;
  ts:        number;
  riskDelta: number;
  message:   string;
}

interface Options {
  videoRef:   React.RefObject<HTMLVideoElement>;
  sessionId:  string;
  enabled:    boolean;
  onViolation?: (v: ProctoringViolation) => void;
}

const RISK_WEIGHTS: Record<string, number> = {
  NO_FACE:        8,
  MULTIPLE_FACES: 15,
  FACE_AWAY:      5,
};

// Models must be served from public/models (face-api tiny weights)
const MODELS_URL = '/models';

export function useAIProctoring({ videoRef, sessionId, enabled, onViolation }: Options) {
  const workerRef  = useRef<Worker | null>(null);
  const rafRef     = useRef<number>(0);
  const riskRef    = useRef(0);
  const [state, setState] = useState<ProctoringState>({
    ready: false, faceDetected: false, riskScore: 0, events: [],
  });

  const addEvent = useCallback((v: ProctoringViolation) => {
    riskRef.current = Math.min(100, riskRef.current + v.riskDelta);
    setState(s => ({
      ...s,
      riskScore: riskRef.current,
      faceDetected: v.kind === 'FACE_DETECTED',
      events: [...s.events.slice(-49), v],
    }));
    onViolation?.(v);
  }, [onViolation]);

  // Capture frames and post to worker
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const worker = workerRef.current;
    if (!video || !worker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(captureFrame);
      return;
    }

    const w = video.videoWidth  || 320;
    const h = video.videoHeight || 240;

    try {
      createImageBitmap(video).then(bitmap => {
        worker.postMessage({ type: 'FRAME', bitmap, width: w, height: h }, [bitmap]);
      });
    } catch {
      // VideoFrame not ready
    }

    rafRef.current = requestAnimationFrame(captureFrame);
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) return;

    // Spin up worker
    const worker = new Worker(
      new URL('../workers/proctoring.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<ProctoringEvent>) => {
      const ev = e.data;
      switch (ev.kind) {
        case 'READY':
          setState(s => ({ ...s, ready: true }));
          rafRef.current = requestAnimationFrame(captureFrame);
          break;

        case 'FACE_DETECTED':
          setState(s => ({ ...s, faceDetected: true }));
          break;

        case 'NO_FACE':
          addEvent({ kind: 'NO_FACE', ts: ev.ts, riskDelta: RISK_WEIGHTS.NO_FACE, message: 'No face detected' });
          break;

        case 'MULTIPLE_FACES':
          addEvent({ kind: 'MULTIPLE_FACES', ts: ev.ts, riskDelta: RISK_WEIGHTS.MULTIPLE_FACES, message: `${ev.count} faces detected` });
          break;

        case 'FACE_AWAY':
          addEvent({ kind: 'FACE_AWAY', ts: ev.ts, riskDelta: RISK_WEIGHTS.FACE_AWAY, message: 'Looking away from screen' });
          break;

        case 'ERROR':
          console.warn('[Proctoring worker error]', ev.message);
          break;
      }
    };

    worker.postMessage({ type: 'INIT', modelsUrl: MODELS_URL });

    return () => {
      cancelAnimationFrame(rafRef.current);
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled, captureFrame, addEvent]);

  return state;
}
