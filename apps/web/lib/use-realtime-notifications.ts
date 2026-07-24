'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { socketService } from './socket';

export interface LiveNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// Connects the socket once userId+tenantId are known (see auth-context.tsx —
// userId is the internal Prisma id RealtimeGateway rooms key on, not the
// Firebase uid), and surfaces live `notification` events pushed by
// NotificationsService.create over the realtime gateway (Phase 2).
export function useRealtimeNotifications() {
  const { userId, tenantId } = useAuth();
  const [latest, setLatest] = useState<LiveNotification | null>(null);

  useEffect(() => {
    if (!userId || !tenantId) return;

    socketService.connect(userId, tenantId);
    const unsubscribe = socketService.on('notification', (data) => {
      setLatest(data as LiveNotification);
    });

    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, [userId, tenantId]);

  return { latest, clear: () => setLatest(null) };
}
