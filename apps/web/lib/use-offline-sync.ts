'use client';

import { useEffect, useRef, useState } from 'react';
import { offlineSyncService } from './offline-sync';

export interface SyncState {
  pendingCount: number;
  syncing: boolean;
  lastSynced: Date | null;
}

// Ported from leadership-assessment's src/hooks/useOfflineSync.ts (unchanged
// logic — no bugs found here). Flushes the offline queue on mount (if already
// online) and whenever the browser regains connectivity.
export function useOfflineSync(): SyncState {
  const [state, setState] = useState<SyncState>({ pendingCount: 0, syncing: false, lastSynced: null });
  const syncRef = useRef(false);

  const refreshCount = async () => {
    const n = await offlineSyncService.getPendingCount();
    setState((s) => ({ ...s, pendingCount: n }));
  };

  const sync = async () => {
    if (syncRef.current) return;
    syncRef.current = true;
    setState((s) => ({ ...s, syncing: true }));
    try {
      const { synced } = await offlineSyncService.syncToServer();
      if (synced > 0) await offlineSyncService.clearSynced();
      const pending = await offlineSyncService.getPendingCount();
      setState({ pendingCount: pending, syncing: false, lastSynced: new Date() });
    } catch {
      setState((s) => ({ ...s, syncing: false }));
    } finally {
      syncRef.current = false;
    }
  };

  useEffect(() => {
    offlineSyncService.init().then(refreshCount);
    const onOnline = () => sync();
    window.addEventListener('online', onOnline);
    if (navigator.onLine) sync();
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return state;
}
