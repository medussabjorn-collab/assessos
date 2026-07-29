'use client';

import { useEffect, useRef } from 'react';
import { api } from './api';
import { offlineSyncService } from './offline-sync';
import { computeBaseline, deviationScore, type BehavioralBaseline } from './behavioral-biometrics';

// Keystroke-dynamics + mouse-movement drift detection: ProctoringService
// already has a real risk weight for 'keystroke_anomaly' (proctoring.service.ts,
// score 15, decayHalfLife 120s) and IncidentService already knows how to
// escalate it — same situation phone_detected was in before it got a real
// emitter. This is that emitter for keystroke/mouse behavioral biometrics.
//
// Deliberately never records which keys were pressed or where the cursor
// moved — only numeric timing/velocity deltas ever leave this hook, mirroring
// the minimal-data approach EnvironmentScanCapture documents for what it
// does and doesn't infer.
//
// Baseline is established once per session (first BASELINE_MIN_KEYSTROKES
// keystrokes or BASELINE_MAX_MS of activity, whichever comes first) and
// frozen — this catches a mid-session handoff to a different typist, not
// cross-session impersonation (that's IdentityService's job, via face
// descriptors + identity_drift).

interface Options {
  sessionId: string;
  enabled: boolean;
}

const BASELINE_MIN_KEYSTROKES = 40;
const BASELINE_MAX_MS = 45_000;

const CHECK_INTERVAL_MS = 15_000;
const WINDOW_MAX_SAMPLES = 30;

// Two consecutive over-threshold checks required before reporting — a single
// noisy window (someone pausing to think, then typing a burst) shouldn't
// trigger on its own, mirroring the worker's NO_FACE_THRESHOLD pattern.
const DEVIATION_THRESHOLD = 2.5;
const CONSECUTIVE_REQUIRED = 2;

// Matches keystroke_anomaly's decayHalfLife server-side — no point reporting
// more often than the risk score can meaningfully move.
const COOLDOWN_MS = 120_000;

export function useBehavioralBiometrics({ sessionId, enabled }: Options) {
  const lastReportedRef = useRef(0);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    let baseline: BehavioralBaseline | null = null;
    let baselineStart = 0;
    const baselineDwell: number[] = [];
    const baselineFlight: number[] = [];
    const baselineVelocity: number[] = [];

    const windowDwell: number[] = [];
    const windowFlight: number[] = [];
    const windowVelocity: number[] = [];

    let lastKeyDownTs = 0;
    let lastKeyUpTs = 0;
    let lastMouse: { x: number; y: number; ts: number } | null = null;
    let consecutiveOver = 0;

    const pushWindowed = (arr: number[], value: number) => {
      arr.push(value);
      if (arr.length > WINDOW_MAX_SAMPLES) arr.shift();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const now = Date.now();
      lastKeyDownTs = now;
      if (lastKeyUpTs > 0) {
        const flight = now - lastKeyUpTs;
        if (flight >= 0 && flight < 5000) {
          if (!baseline) baselineFlight.push(flight);
          else pushWindowed(windowFlight, flight);
        }
      }
    };

    const onKeyUp = () => {
      const now = Date.now();
      lastKeyUpTs = now;
      if (lastKeyDownTs > 0) {
        const dwell = now - lastKeyDownTs;
        if (dwell >= 0 && dwell < 3000) {
          if (!baseline) {
            baselineDwell.push(dwell);
            if (baselineStart === 0) baselineStart = now;
          } else {
            pushWindowed(windowDwell, dwell);
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (lastMouse) {
        const dt = now - lastMouse.ts;
        // Throttle: ignore samples closer together than 30ms (redundant
        // high-frequency events) and gaps longer than 2s (cursor was idle,
        // not meaningfully "moving").
        if (dt >= 30 && dt < 2000) {
          const dx = e.clientX - lastMouse.x;
          const dy = e.clientY - lastMouse.y;
          const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
          if (!baseline) baselineVelocity.push(velocity);
          else pushWindowed(windowVelocity, velocity);
        }
      }
      lastMouse = { x: e.clientX, y: e.clientY, ts: now };
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);

    const interval = window.setInterval(() => {
      const now = Date.now();

      if (!baseline) {
        const enoughKeystrokes = baselineDwell.length >= BASELINE_MIN_KEYSTROKES;
        const timedOut = baselineStart > 0 && now - baselineStart >= BASELINE_MAX_MS;
        if (enoughKeystrokes || (timedOut && baselineDwell.length > 0)) {
          baseline = computeBaseline(baselineDwell, baselineFlight, baselineVelocity);
        }
        return;
      }

      if (windowDwell.length < 10 && windowFlight.length < 10) return;

      const score = deviationScore(windowDwell, windowFlight, windowVelocity, baseline);
      if (score >= DEVIATION_THRESHOLD) {
        consecutiveOver++;
      } else {
        consecutiveOver = 0;
      }

      if (consecutiveOver >= CONSECUTIVE_REQUIRED && now - lastReportedRef.current >= COOLDOWN_MS) {
        lastReportedRef.current = now;
        consecutiveOver = 0;
        api.post('/api/proctoring/event', { sessionId, eventType: 'keystroke_anomaly' }).catch(() => {
          offlineSyncService.enqueue('event', sessionId, { eventType: 'keystroke_anomaly' }).catch(() => undefined);
        });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      window.clearInterval(interval);
    };
  }, [enabled, sessionId]);
}
