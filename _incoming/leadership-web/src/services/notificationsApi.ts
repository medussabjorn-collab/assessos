import { api } from './apiClient';
import type { Notification } from '../types';

interface NotificationsResponse { data: Notification[] }

export const notificationsApi = {
  list: () =>
    api.get<NotificationsResponse>('/notifications'),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.put('/notifications/read-all', {}),
};
