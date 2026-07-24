'use client';

import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOfflineSync } from '../lib/use-offline-sync';
import { useOnlineStatus } from '../lib/use-online-status';

// Ported from leadership-assessment's src/components/common/SyncIndicator.tsx
// (unchanged logic). Shows offline/syncing/queued state; auto-hides 4s after
// settling into a fully-synced, online state.
export default function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncing } = useOfflineSync();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline || pendingCount > 0 || syncing) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pendingCount, syncing]);

  if (!show) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        !isOnline
          ? 'bg-red-50 text-red-600'
          : syncing
            ? 'bg-blue-50 text-blue-600'
            : pendingCount > 0
              ? 'bg-amber-50 text-amber-600'
              : 'bg-brand-50 text-brand-600'
      }`}
    >
      {!isOnline ? (
        <>
          <CloudOff size={11} /> Offline
        </>
      ) : syncing ? (
        <>
          <RefreshCw size={11} className="animate-spin" /> Syncing…
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff size={11} /> {pendingCount} queued
        </>
      ) : (
        <>
          <CheckCircle2 size={11} /> Synced
        </>
      )}
    </div>
  );
}
