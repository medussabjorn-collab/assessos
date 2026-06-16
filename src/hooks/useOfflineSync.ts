import { useEffect, useRef, useState } from 'react';
import { offlineService } from '../services/offlineService';

export interface SyncState {
  pendingCount: number;
  syncing: boolean;
  lastSynced: Date | null;
}

export function useOfflineSync(): SyncState {
  const [state, setState] = useState<SyncState>({ pendingCount: 0, syncing: false, lastSynced: null });
  const syncRef = useRef(false);

  const refreshCount = async () => {
    const n = await offlineService.getPendingCount();
    setState(s => ({ ...s, pendingCount: n }));
  };

  const sync = async () => {
    if (syncRef.current) return;
    syncRef.current = true;
    setState(s => ({ ...s, syncing: true }));
    try {
      const { synced } = await offlineService.syncToServer();
      if (synced > 0) await offlineService.clearSynced();
      const pending = await offlineService.getPendingCount();
      setState({ pendingCount: pending, syncing: false, lastSynced: new Date() });
    } catch {
      setState(s => ({ ...s, syncing: false }));
    } finally { syncRef.current = false; }
  };

  useEffect(() => {
    offlineService.init().then(refreshCount);
    const onOnline = () => sync();
    window.addEventListener('online', onOnline);
    if (navigator.onLine) sync();
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return state;
}
