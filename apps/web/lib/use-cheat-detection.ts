'use client';

import { useEffect, useRef } from 'react';
import { api } from './api';
import { offlineSyncService } from './offline-sync';

// Detects browser-level cheat signals the webcam pipeline can't see: leaving
// the tab/window, exiting fullscreen, and clipboard use. Backend already has
// full risk weights + decay for all five event types (proctoring.service.ts)
// and receives them via the same /api/proctoring/event endpoint ProctoringPanel
// uses — this was simply never emitting anything client-side.
type CheatEventType = 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'copy_paste' | 'paste_detected';

interface Options {
  sessionId: string;
  enabled: boolean;
  requestFullscreen?: boolean;
}

// Per-kind cooldown so a candidate alt-tabbing rapidly (which fires both
// visibilitychange and blur) or double-clicking copy doesn't spam the API —
// the backend's own decay handles risk-over-time, this just caps event
// volume at the source.
const COOLDOWN_MS = 5000;

export function useCheatDetection({ sessionId, enabled, requestFullscreen = true }: Options) {
  const lastFiredRef = useRef<Partial<Record<CheatEventType, number>>>({});

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const report = (eventType: CheatEventType) => {
      const now = Date.now();
      const last = lastFiredRef.current[eventType] ?? 0;
      if (now - last < COOLDOWN_MS) return;
      lastFiredRef.current[eventType] = now;

      api.post('/api/proctoring/event', { sessionId, eventType }).catch(() => {
        offlineSyncService.enqueue('event', sessionId, { eventType }).catch(() => undefined);
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) report('tab_switch');
    };
    const onWindowBlur = () => report('window_blur');
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) report('fullscreen_exit');
    };
    const onCopy = () => report('copy_paste');
    const onPaste = () => report('paste_detected');

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);

    if (requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Browser/user denied fullscreen — non-fatal, exit detection above
        // simply won't have a baseline to detect exits from.
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [enabled, sessionId, requestFullscreen]);
}
