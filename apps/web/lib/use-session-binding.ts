'use client';

import { useEffect, useRef, useState } from 'react';
import { bindSession, checkBinding, reverify } from './identity-verification';
import { loadFaceModels, captureDescriptor, matchScore, captureVideoFrame } from './face-verification';

const DEVICE_ID_KEY = 'assessos_device_id';
const HEARTBEAT_MS = 30_000;
const DRIFT_THRESHOLD = 0.8; // matches IdentityService's FACE_MATCH_MIN server-side

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

interface UseSessionBindingOptions {
  sessionId: string;
  verificationId: string | null;
  baselineDescriptor: number[] | null;
  enabled: boolean;
}

export interface SessionBindingState {
  bound: boolean;
  revoked: boolean;
  driftWarning: boolean;
}

/**
 * Binds the session to this device on mount, then periodically re-checks:
 *  - checkBinding (deviceId only) — device consistency. biometricHash is
 *    deliberately not sent here: checkBinding compares it by strict string
 *    equality, which a live face descriptor can never reliably satisfy frame
 *    to frame even for the same person.
 *  - reverify (real faceMatchScore vs the verification-time baseline
 *    descriptor) — the mechanism IdentityService actually built for
 *    biometric drift, since it does a threshold comparison, not exact match.
 * Server-side enforcement (AssessmentService.assertNotRevoked) is
 * authoritative regardless — this just lets the UI react immediately
 * instead of waiting for the next submit to bounce.
 */
export function useSessionBinding({
  sessionId,
  verificationId,
  baselineDescriptor,
  enabled,
}: UseSessionBindingOptions): SessionBindingState {
  const [state, setState] = useState<SessionBindingState>({
    bound: false,
    revoked: false,
    driftWarning: false,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let biometricsReady = false;

    const deviceId = getOrCreateDeviceId();
    const baseline = baselineDescriptor ? new Float32Array(baselineDescriptor) : null;

    // Camera/model access is only needed for the biometric half of the
    // heartbeat (reverify). Device binding must not depend on it — a user
    // with no camera, or who denies access after the pre-session capture,
    // should still get device-swap detection via checkBinding.
    const setupCamera = async () => {
      await loadFaceModels();
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      videoRef.current = video;
      biometricsReady = true;
    };

    const heartbeat = async () => {
      try {
        const check = await checkBinding(sessionId, { deviceId });
        if (check.revoked) {
          setState((s) => ({ ...s, revoked: true }));
          if (interval) clearInterval(interval);
          return;
        }
      } catch {
        // Transient network failure — try again next tick, don't flip state.
        return;
      }

      if (!biometricsReady || !verificationId || !baseline || !videoRef.current) return;
      try {
        const frame = captureVideoFrame(videoRef.current);
        const descriptor = await captureDescriptor(frame);
        if (!descriptor) return;

        const score = await matchScore(baseline, descriptor);
        const driftDetected = score < DRIFT_THRESHOLD;
        const result = await reverify(verificationId, { faceMatchScore: score, driftDetected });
        setState((s) => ({
          ...s,
          driftWarning: result.driftDetected,
          revoked: s.revoked || result.driftDetected,
        }));
      } catch {
        // Non-fatal — next heartbeat retries.
      }
    };

    (async () => {
      try {
        await bindSession(sessionId, { deviceId });
        if (!cancelled) setState((s) => ({ ...s, bound: true }));
      } catch {
        // Bind failure isn't fatal to taking the assessment — the periodic
        // checkBinding calls below just won't have anything to compare
        // against until a bind succeeds.
      }

      // Best-effort — no camera, denied permission, or model load failure
      // just means the heartbeat degrades to device-only checks below.
      await setupCamera().catch(() => undefined);
      if (cancelled) return;

      interval = setInterval(heartbeat, HEARTBEAT_MS);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, sessionId, verificationId]);

  return state;
}
