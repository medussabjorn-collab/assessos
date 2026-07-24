import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraOff, AlertTriangle, Eye, Activity, Gauge, Brain } from 'lucide-react';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { riskEngine, RISK_WEIGHTS, type RiskState } from '../../services/riskScoringEngine';
import { proctoringApi, type ProctoringEventType } from '../../services/proctoringApi';
import { useAIProctoring } from '../../hooks/useAIProctoring';

interface Props {
  sessionId: string;
  active:    boolean;
  onToggle:  () => void;
  onWarning: (state: RiskState) => void;
}

export function EnhancedProctoringPanel({ sessionId, active, onToggle, onWarning }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [riskState, setRiskState] = useState<RiskState>(riskEngine.getState());
  const [cameraOn, setCameraOn] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // Real AI proctoring via face-api.js Web Worker
  const aiState = useAIProctoring({
    videoRef,
    sessionId,
    enabled: cameraOn && active,
    onViolation: (v) => {
      const eventMap: Record<string, string> = {
        NO_FACE:        'face_not_detected',
        MULTIPLE_FACES: 'multiple_faces',
        FACE_AWAY:      'looking_away',
      };
      const eventType = eventMap[v.kind];
      if (eventType) {
        riskEngine.addEvent(eventType);
        setLastEvent(eventType);
        proctoringApi.logEvent({ sessionId, eventType: eventType as ProctoringEventType }).catch(() => {});
      }
    },
  });

  // Subscribe to risk engine
  useEffect(() => {
    const unsub = riskEngine.subscribe(state => {
      setRiskState(state);
      if (state.category !== 'safe') onWarning(state);
    });
    return unsub;
  }, [onWarning]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
    } catch {
      setCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return stopCamera;
  }, [active]);

  // Browser environment monitoring: tab switches, focus loss,
  // fullscreen exits, and the window moving to a different screen
  useEffect(() => {
    if (!cameraOn) return;

    const report = (eventType: ProctoringEventType, metadata?: Record<string, unknown>) => {
      riskEngine.addEvent(eventType);
      setLastEvent(eventType);
      proctoringApi.logEvent({ sessionId, eventType, metadata }).catch(() => {});
    };

    const handleVisibility = () => {
      if (document.hidden) report('tab_switch');
    };
    const handleBlur = () => {
      riskEngine.addEvent('window_blur');
      setLastEvent('window_blur');
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) report('fullscreen_exit');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // ── Screen-switch detection ──────────────────────────────────────────
    // Detects the window being dragged to another display by watching for
    // changes in the screen the window reports (dimensions / position) and
    // large jumps in window position. Polled — there is no native event.
    // availLeft/availTop exist in browsers but not in the TS lib typings
    type ScreenWithPosition = Screen & { availLeft?: number; availTop?: number };
    const screenFingerprint = () => {
      const s = window.screen as ScreenWithPosition;
      return `${s.width}x${s.height}@${s.availLeft ?? 0},${s.availTop ?? 0}`;
    };
    let lastFingerprint = screenFingerprint();
    let lastScreenX = window.screenX;
    let lastScreenY = window.screenY;
    let lastSwitchReport = 0;

    const screenPoll = window.setInterval(() => {
      const fp = screenFingerprint();
      const dx = Math.abs(window.screenX - lastScreenX);
      const dy = Math.abs(window.screenY - lastScreenY);
      // Display fingerprint changed, or the window jumped further than any
      // single screen dimension (typical when dragged across monitors)
      const movedScreens = fp !== lastFingerprint || dx > window.screen.width || dy > window.screen.height;

      if (movedScreens && Date.now() - lastSwitchReport > 10_000) {
        lastSwitchReport = Date.now();
        report('screen_switch', { from: lastFingerprint, to: fp, dx, dy });
      }
      lastFingerprint = fp;
      lastScreenX = window.screenX;
      lastScreenY = window.screenY;
    }, 1000);

    // Multi-monitor presence check (Window Management API, where available)
    type ScreenDetailed = { isExtended?: boolean };
    const scr = window.screen as Screen & ScreenDetailed;
    if (scr.isExtended) {
      proctoringApi.logEvent({
        sessionId,
        eventType: 'screen_switch',
        metadata: { reason: 'multiple_displays_detected', isExtended: true },
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.clearInterval(screenPoll);
    };
  }, [cameraOn, sessionId]);

  const riskColor = riskState.category === 'critical' ? 'red' : riskState.category === 'warning' ? 'yellow' : 'green';
  const riskBg    = riskState.category === 'critical' ? 'from-red-500 to-rose-600' :
                    riskState.category === 'warning'  ? 'from-yellow-500 to-amber-600' :
                    'from-emerald-500 to-teal-600';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Proctoring</span>
          <Badge color={riskColor as 'green' | 'yellow' | 'red'} size="sm" dot>
            {riskState.category}
          </Badge>
        </div>
        <button onClick={onToggle}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {active ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative bg-gray-900 aspect-video overflow-hidden">
        {cameraOn ? (
          <>
            <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
            {/* Risk overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${riskBg}`} />
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                <Badge color={riskColor as 'green' | 'yellow' | 'red'} size="sm"
                  className={riskState.category !== 'safe' ? 'animate-pulse' : ''}>
                  <Activity size={10} />
                  {riskState.totalScore}/100
                </Badge>
                <span className="text-[9px] text-gray-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <AnimatePresence>
              {lastEvent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  onAnimationComplete={() => setTimeout(() => setLastEvent(null), 2000)}
                  className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-[10px] font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {RISK_WEIGHTS[lastEvent]?.message ?? lastEvent}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <CameraOff size={22} className="text-gray-600" />
            <p className="text-xs text-gray-500">{active ? 'Connecting camera...' : 'Proctoring paused'}</p>
          </div>
        )}
      </div>

      {/* Risk score gauge */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Gauge size={12} /> Risk Score
          </span>
          <span className={`text-sm font-bold tabular-nums ${
            riskState.category === 'critical' ? 'text-red-500' :
            riskState.category === 'warning'  ? 'text-yellow-600' : 'text-emerald-600'
          }`}>{riskState.totalScore} / 100</span>
        </div>
        <ProgressBar
          value={riskState.totalScore}
          color={riskState.category === 'critical' ? 'red' : riskState.category === 'warning' ? 'yellow' : 'green'}
          size="sm" animated={false}
        />
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>Safe (&lt;30)</span><span>Warning (30–70)</span><span>Critical (&gt;70)</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Violations', value: riskState.violations, color: 'text-red-500' },
          { label: 'Warnings',   value: riskState.warnings,   color: 'text-yellow-600' },
          { label: 'Events',     value: riskState.events.length, color: 'text-gray-600 dark:text-gray-400' },
        ].map(s => (
          <div key={s.label} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2 text-center flex items-center justify-center gap-1.5">
        <Brain size={10} className={aiState.ready ? 'text-emerald-400' : 'text-gray-400 animate-pulse'} />
        <p className="text-[9px] text-gray-400">
          {aiState.ready ? 'face-api.js · Gaze Estimation · GDPR Compliant' : 'Loading AI models...'}
        </p>
      </div>
    </div>
  );
}
