'use client';

import { api } from './api';

const DB_NAME = 'assessos_offline';
const DB_VERSION = 1;

export type OfflineEntryType = 'answer' | 'event' | 'session';

export interface OfflineEntry {
  id: string;
  type: OfflineEntryType;
  sessionId: string;
  payload: unknown;
  timestamp: string;
  // IndexedDB keys/index values can't be a boolean (IDBKeyRange.only(false)
  // throws "The parameter is not a valid key" — the spec only allows
  // number/string/Date/binary/Array). Stored as 0 (pending) / 1 (synced) so
  // the `synced` index actually works.
  synced: 0 | 1;
  encrypted: boolean;
}

// Maps the client's local entry type to the backend's SyncItemType
// (modules/offline-sync/offline-sync.service.ts).
const TYPE_MAP: Record<OfflineEntryType, string> = {
  answer: 'answer',
  event: 'proctor_event',
  session: 'session_submit',
};

/**
 * IndexedDB offline queue, ported from leadership-assessment's
 * src/services/offlineService.ts. Fixes vs the original (which would fail
 * against ITS OWN backend's schema, since the mismatches below apply
 * regardless of which backend it targets):
 *   - `sessionId` was never included in enqueue() or the outgoing sync
 *     payload, despite the item schema requiring it — every sync would fail
 *     validation server-side. Now stored per-entry and included.
 *   - `timestamp` was sent as an ISO string; the backend's item schema
 *     expects epoch milliseconds (used both for ordering client-queued items
 *     and as the actual submittedAt/answeredAt timestamps it writes).
 *     Converted at sync time.
 *   - syncToServer() blindly marked the ENTIRE batch as synced on any 200
 *     response, ignoring the per-item `results[].success` the backend
 *     returns specifically so failures can be retried individually. Now only
 *     items the server actually confirmed are marked synced; the rest stay
 *     queued.
 */
class OfflineSyncService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Lightweight XOR obfuscation for offline data (not real encryption — same
   * disclosed limitation as the ported source; replace with AES-GCM before
   * storing anything sensitive at rest). */
  private encrypt(data: string, key = 'assessos_offline_key'): string {
    return btoa(
      data
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
        .join(''),
    );
  }

  private decrypt(data: string, key = 'assessos_offline_key'): string {
    const decoded = atob(data);
    return decoded
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  }

  async enqueue(type: OfflineEntryType, sessionId: string, payload: unknown): Promise<void> {
    if (!this.db) await this.init();
    const entry: OfflineEntry = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      sessionId,
      payload: this.encrypt(JSON.stringify(payload)),
      timestamp: new Date().toISOString(),
      synced: 0,
      encrypted: true,
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('queue', 'readwrite');
      const req = tx.objectStore('queue').add(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction('queue', 'readonly');
      const index = tx.objectStore('queue').index('synced');
      const req = index.count(IDBKeyRange.only(0));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  async getQueue(): Promise<OfflineEntry[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction('queue', 'readonly');
      const index = tx.objectStore('queue').index('synced');
      const req = index.getAll(IDBKeyRange.only(0));
      req.onsuccess = () => {
        const entries = (req.result as OfflineEntry[]).map((e) => ({
          ...e,
          payload: e.encrypted ? JSON.parse(this.decrypt(e.payload as string)) : e.payload,
        }));
        resolve(entries);
      };
      req.onerror = () => resolve([]);
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const get = store.get(id);
      get.onsuccess = () => {
        const entry = get.result as OfflineEntry;
        if (entry) {
          entry.synced = 1;
          store.put(entry).onsuccess = () => resolve();
        } else resolve();
      };
      get.onerror = () => resolve();
    });
  }

  async syncToServer(): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    const items = queue.map((e) => ({
      type: TYPE_MAP[e.type],
      sessionId: e.sessionId,
      payload: e.payload,
      timestamp: new Date(e.timestamp).getTime(),
    }));

    try {
      const res = await api.post('/api/offline-sync/sync', { items });
      const results: Array<{ success: boolean }> = res.data?.data?.results ?? [];

      let synced = 0;
      let failed = 0;
      for (let i = 0; i < queue.length; i++) {
        if (results[i]?.success) {
          await this.markSynced(queue[i].id);
          synced++;
        } else {
          failed++;
        }
      }
      return { synced, failed };
    } catch {
      // Network-level failure (offline, server unreachable) — nothing
      // synced this round; the whole queue stays for the next attempt.
      return { synced: 0, failed: queue.length };
    }
  }

  /** Conflict resolution: server-wins merge strategy. */
  resolveConflict(local: unknown, server: unknown): unknown {
    if (typeof local !== 'object' || typeof server !== 'object' || local === null || server === null) {
      return server;
    }
    const l = local as Record<string, unknown>;
    const s = server as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...l };
    for (const key of Object.keys(s)) {
      if (key === 'answers' && Array.isArray(l[key]) && Array.isArray(s[key])) {
        merged[key] = [...new Set([...(l[key] as unknown[]), ...(s[key] as unknown[])])];
      } else {
        merged[key] = s[key];
      }
    }
    return merged;
  }

  async clearSynced(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction('queue', 'readwrite');
      const index = tx.objectStore('queue').index('synced');
      const req = index.openCursor(IDBKeyRange.only(1));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else resolve();
      };
      req.onerror = () => resolve();
    });
  }
}

export const offlineSyncService = new OfflineSyncService();
