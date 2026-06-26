import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncing, lastSynced: _lastSynced } = useOfflineSync();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline || pendingCount > 0 || syncing) setShow(true);
    else {
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pendingCount, syncing]);

  if (!show) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      !isOnline           ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
      syncing             ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
      pendingCount > 0    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    }`}>
      {!isOnline        ? <><CloudOff size={11} /> Offline</> :
       syncing          ? <><RefreshCw size={11} className="animate-spin" /> Syncing…</> :
       pendingCount > 0 ? <><CloudOff size={11} /> {pendingCount} queued</> :
                          <><CheckCircle2 size={11} /> Synced</>}
    </div>
  );
}
