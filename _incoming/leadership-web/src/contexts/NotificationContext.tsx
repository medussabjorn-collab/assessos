import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Notification } from '../types';
import { v4 as uuid } from 'uuid';
import { notificationsApi } from '../services/notificationsApi';
import { getAccessToken } from '../services/apiClient';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  toast: (type: Notification['type'], title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !getAccessToken()) return;
    notificationsApi.list().then(res => setNotifications(res.data)).catch(() => {});
    socketService.connect(user.id);
    const unsub = socketService.on('notification', (data) => {
      const n = data as Notification;
      setNotifications(prev => [{ ...n, read: false }, ...prev]);
    });
    return () => { unsub(); socketService.disconnect(); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => {
    setNotifications(prev => [{
      ...n, id: uuid(), userId: '', read: false, createdAt: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const toast = useCallback((type: Notification['type'], title: string, message: string) => {
    addNotification({ type, title, message });
  }, [addNotification]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationsApi.markAllRead().catch(() => {});
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, dismiss, toast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
