'use client';

import { useEffect, useRef } from 'react';
import { api } from './api';

// Client-side detection for the coding-challenge lockdown mode. Backend
// endpoint (POST /api/coding/lockdown-violations) has existed since the
// coding module was built but had zero callers — this is that caller.
// Deliberately separate from use-cheat-detection.ts: coding challenges have
// no AssessmentSession/proctoring-session concept (LockdownViolationService
// keys on userId + free-text context, not a sessionId), so this can't
// route through the main ProctoringService risk engine.
const LOCKDOWN_VIOLATION_TYPES = [
  'tab_switch',
  'window_blur',
  'fullscreen_exit',
  'copy_paste',
  'paste_detected',
  'right_click',
  'devtools_opened',
] as const;
type LockdownViolationType = (typeof LOCKDOWN_VIOLATION_TYPES)[number];

interface Options {
  context: string;
  enabled: boolean;
}

const COOLDOWN_MS = 5000;

// devtools-open heuristic: a genuine open panel reliably grows one of these
// dimensions past the threshold (the debugger-docked-to-a-side case a
// simple window-size check misses). Checked on an interval rather than an
// event since there's no browser event for "devtools opened".
const DEVTOOLS_THRESHOLD_PX = 160;
const DEVTOOLS_POLL_MS = 1000;

export function useLockdownDetection({ context, enabled }: Options) {
  const lastFiredRef = useRef<Partial<Record<LockdownViolationType, number>>>({});

  useEffect(() => {
    if (!enabled) return;

    const report = (violationType: LockdownViolationType) => {
      const now = Date.now();
      const last = lastFiredRef.current[violationType] ?? 0;
      if (now - last < COOLDOWN_MS) return;
      lastFiredRef.current[violationType] = now;

      api.post('/api/coding/lockdown-violations', { context, violationType }).catch(() => undefined);
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
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      report('right_click');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);

    const devtoolsInterval = window.setInterval(() => {
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;
      if (widthDelta > DEVTOOLS_THRESHOLD_PX || heightDelta > DEVTOOLS_THRESHOLD_PX) {
        report('devtools_opened');
      }
    }, DEVTOOLS_POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      window.clearInterval(devtoolsInterval);
    };
  }, [enabled, context]);
}
