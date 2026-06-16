import { apiFetch } from './apiClient';

const DB_NAME    = 'leaderassess_offline';
const DB_VERSION = 1;

export interface OfflineEntry {
  id:        string;
  type:      'answer' | 'session' | 'event';
  payload:   unknown;
  timestamp: string;
  synced:    boolean;
  encrypted: boolean;
}

class OfflineService {
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
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Lightweight XOR "encryption" for offline data (replace with AES-GCM in production) */
  private encrypt(data: string, key = 'la_offline_key'): string {
    return btoa(data.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join(''));
  }

  private decrypt(data: string, key = 'la_offline_key'): string {
    const decoded = atob(data);
    return decoded.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
  }

  async enqueue(type: OfflineEntry['type'], payload: unknown): Promise<void> {
    if (!this.db) await this.init();
    const entry: OfflineEntry = {
      id:        `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      payload:   this.encrypt(JSON.stringify(payload)),
      timestamp: new Date().toISOString(),
      synced:    false,
      encrypted: true,
    };
    return new Promise((resolve, reject) => {
      const tx    = this.db!.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const req   = store.add(entry);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx    = this.db!.transaction('queue', 'readonly');
      const index = tx.objectStore('queue').index('synced');
      const req   = index.count(IDBKeyRange.only(false));
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => resolve(0);
    });
  }

  async getQueue(): Promise<OfflineEntry[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx    = this.db!.transaction('queue', 'readonly');
      const index = tx.objectStore('queue').index('synced');
      const req   = index.getAll(IDBKeyRange.only(false));
      req.onsuccess = () => {
        const entries = (req.result as OfflineEntry[]).map(e => ({
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
      const tx    = this.db!.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const get   = store.get(id);
      get.onsuccess = () => {
        const entry = get.result as OfflineEntry;
        if (entry) {
          entry.synced = true;
          store.put(entry).onsuccess = () => resolve();
        } else resolve();
      };
      get.onerror = () => resolve();
    });
  }

  async syncToServer(): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0, failed = 0;

    // Batch all pending items in a single POST to /api/v1/sync
    try {
      const items = queue.map(e => ({ id: e.id, type: e.type, payload: e.payload, timestamp: e.timestamp }));
      await apiFetch('/sync', { method: 'POST', body: JSON.stringify({ items }) });
      for (const entry of queue) { await this.markSynced(entry.id); synced++; }
    } catch {
      // Backend unreachable — try individually so partial success is captured
      for (const entry of queue) {
        try {
          await apiFetch('/sync', { method: 'POST', body: JSON.stringify({ items: [{ id: entry.id, type: entry.type, payload: entry.payload, timestamp: entry.timestamp }] }) });
          await this.markSynced(entry.id);
          synced++;
        } catch { failed++; }
      }
    }

    return { synced, failed };
  }

  /** Conflict resolution: server-wins merge strategy */
  resolveConflict(local: unknown, server: unknown): unknown {
    // Server wins on conflicting keys, merge arrays
    if (typeof local !== 'object' || typeof server !== 'object') return server;
    const l = local as Record<string, unknown>;
    const s = server as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...l };
    for (const key of Object.keys(s)) {
      if (key === 'answers' && Array.isArray(l[key]) && Array.isArray(s[key])) {
        // Merge answer arrays — server wins on conflicts
        merged[key] = [...new Set([...(l[key] as unknown[]), ...(s[key] as unknown[])])];
      } else {
        merged[key] = s[key]; // server wins
      }
    }
    return merged;
  }

  async clearSynced(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const tx    = this.db!.transaction('queue', 'readwrite');
      const index = tx.objectStore('queue').index('synced');
      const req   = index.openCursor(IDBKeyRange.only(true));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) { cursor.delete(); cursor.continue(); }
        else resolve();
      };
      req.onerror = () => resolve();
    });
  }
}

export const offlineService = new OfflineService();
