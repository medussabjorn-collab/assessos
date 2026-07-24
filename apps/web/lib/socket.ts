'use client';

import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';

// Ported from leadership-assessment's src/services/socketService.ts, adapted
// to this backend's RealtimeGateway (modules/realtime/realtime.gateway.ts).
//
// Fixes vs the original:
//   - The original joined with `socket.emit('join', this.userId)` — a bare
//     string. This gateway's `join` handler expects an object,
//     `{ userId, tenantId }` (it puts the socket in BOTH a user:<id> and a
//     tenant:<id> room) — a bare string join would have produced
//     `body.userId === undefined`, joining nothing.
//   - The original listened for `notification`, `proctoring_alert`, and
//     `assessment_complete`. Only `notification` is ever actually emitted by
//     this backend (NotificationsService.create -> emitToUser) — the other
//     two don't correspond to any server-side emit here, so they're left out
//     rather than wired up to listen for events that can never fire.
//   - `getAccessToken()` doesn't exist in this stack (Firebase, not
//     leadership's JWT auth) — passes the current Firebase ID token instead.
//     The gateway doesn't verify it yet (TODO noted in the backend commit,
//     tracked for Phase 4); sent now so nothing needs to change there later.
// Unlike lib/api.ts's HTTP calls (which can stay on a relative /api/* path
// and let Next's rewrites() proxy them), a WebSocket handshake needs an
// absolute origin — Next's rewrite config only proxies regular HTTP
// requests, and socket.io serves on /socket.io/, a path the existing
// /api/:path* rewrite doesn't match anyway. Defaults to :3000 (the documented
// local API port, same default next.config.js itself falls back to) rather
// than window.location.origin, which would silently point at the Next server
// instead of the API. A same-origin-proxy production deployment (one that
// intentionally leaves NEXT_PUBLIC_API_URL unset) would need its own
// websocket-upgrade proxy rule for this to work — setting the env var is the
// simpler path.
const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type EventCallback = (data: unknown) => void;

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private tenantId: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  async connect(userId: string, tenantId: string): Promise<void> {
    this.userId = userId;
    this.tenantId = tenantId;

    if (this.socket?.connected) {
      this.socket.emit('join', { userId, tenantId });
      return;
    }

    const token = await auth.currentUser?.getIdToken().catch(() => undefined);

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      if (this.userId && this.tenantId) {
        this.socket!.emit('join', { userId: this.userId, tenantId: this.tenantId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.debug('[socket] disconnected:', reason);
    });

    this.socket.on('notification', (data: unknown) => {
      this.dispatch('notification', data);
    });

    // Emitted by AssessmentConfigService (RealtimeGateway.emitToTenant) any
    // time an admin publishes a new/updated assessment version — lets every
    // open admin session refresh instantly instead of on next page load.
    this.socket.on('assessment_config.published', (data: unknown) => {
      this.dispatch('assessment_config.published', data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
    this.tenantId = null;
  }

  on(event: string, cb: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private dispatch(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
