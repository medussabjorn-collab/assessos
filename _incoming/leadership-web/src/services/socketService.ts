import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './apiClient';

const WS_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '');

type EventCallback = (data: unknown) => void;

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  connect(userId?: string): void {
    if (userId) this.userId = userId;
    if (this.socket?.connected) {
      // Re-join room if userId just became known
      if (this.userId) this.socket.emit('join', this.userId);
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      // Join user-specific room so server can target this socket
      if (this.userId) this.socket!.emit('join', this.userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.debug('[socket] disconnected:', reason);
    });

    this.socket.on('notification', (data: unknown) => {
      this.emit('notification', data);
    });

    this.socket.on('proctoring_alert', (data: unknown) => {
      this.emit('proctoring_alert', data);
    });

    this.socket.on('assessment_complete', (data: unknown) => {
      this.emit('assessment_complete', data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, cb: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
