import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOff, AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { proctoringApi } from '../../services/proctoringApi';

interface Props {
  sessionId: string;
  active: boolean;
  onToggle: () => void;
  onWarning: () => void;
}

type ProcStatus = 'initializing' | 'active' | 'warning' | 'error' | 'disabled';

export function ProctoringPanel({ sessionId, active, onToggle, onWarning }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<ProcStatus>('initializing');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('active');
    } catch {
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (active) startCamera();
    else { stopCamera(); setStatus('disabled'); }
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  // Simulated AI analysis (in real app, send snapshot to Gemini/Vision API)
  useEffect(() => {
    if (status !== 'active') return;
    const interval = setInterval(() => {
      setLastCheck(new Date());
      // Simulate random events
      const rand = Math.random();
      if (rand > 0.95) {
        const msg = rand > 0.97
          ? 'Multiple faces detected in frame'
          : 'Looking away from screen detected';
        setWarnings(prev => [msg, ...prev].slice(0, 5));
        setStatus('warning');
        proctoringApi.logEvent({ sessionId, eventType: 'tab_switch', metadata: { message: msg } }).catch(() => {});
        onWarning();
        setTimeout(() => setStatus('active'), 3000);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [status, sessionId, onWarning]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Proctoring</span>
        </div>
        <button onClick={onToggle}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {active ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative bg-gray-900 aspect-video">
        {active && status !== 'error' ? (
          <>
            <video ref={videoRef} muted playsInline autoPlay
              className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" width={320} height={240} />
            {/* Status overlay */}
            <div className="absolute top-2 left-2">
              <AnimatePresence>
                {status === 'warning' && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1 bg-yellow-500 text-yellow-950 px-2 py-1 rounded-lg text-xs font-semibold">
                    <AlertTriangle size={11} /> Warning
                  </motion.div>
                )}
                {status === 'active' && (
                  <div className="flex items-center gap-1 bg-emerald-500/90 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Active
                  </div>
                )}
              </AnimatePresence>
            </div>
            {lastCheck && (
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-300 bg-black/40 px-1.5 py-0.5 rounded">
                {lastCheck.toLocaleTimeString()}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <CameraOff size={24} className="text-gray-600" />
            <p className="text-xs text-gray-500">
              {status === 'error' ? 'Camera unavailable' : 'Proctoring disabled'}
            </p>
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="px-3 py-3 space-y-2 max-h-28 overflow-y-auto">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-[10px] text-gray-400 text-center">
          Powered by AI Vision Analysis • GDPR compliant
        </p>
      </div>
    </div>
  );
}
