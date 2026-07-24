'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useRealtimeNotifications } from '../lib/use-realtime-notifications';

const ICON = {
  info: Bell,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const COLOR = {
  info: 'bg-brand-50 text-brand-600 border-brand-200',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  error: 'bg-red-50 text-red-600 border-red-200',
} as const;

// Live toast for notifications pushed over the realtime gateway (Phase 2) —
// e.g. proctoring alerts (ProctoringService.logEvent -> notifyProctoringAlert)
// and assessment-complete notices, delivered the moment they're created
// server-side rather than only appearing on next page load.
export default function NotificationToast() {
  const { latest, clear } = useRealtimeNotifications();
  const [visible, setVisible] = useState<typeof latest>(null);

  useEffect(() => {
    if (!latest) return;
    setVisible(latest);
    const t = setTimeout(() => {
      setVisible(null);
      clear();
    }, 6000);
    return () => clearTimeout(t);
  }, [latest, clear]);

  if (!visible) return null;

  const Icon = ICON[visible.type] ?? Bell;

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-frost-lg ${COLOR[visible.type] ?? COLOR.info}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{visible.title}</div>
          <div className="text-xs mt-0.5 opacity-90">{visible.message}</div>
        </div>
        <button
          onClick={() => {
            setVisible(null);
            clear();
          }}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
