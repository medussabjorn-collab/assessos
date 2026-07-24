import { api } from './apiClient';
import type { User, AssessmentConfig, AuditLog } from '../types';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AdminStats {
  data: {
    totalUsers: number;
    totalSessions: number;
    totalResults: number;
    activeConfigs: number;
    passRate: number;
    recentActivity: Array<{ date: string; sessions: number }>;
  };
}

export const adminApi = {
  getStats: () =>
    api.get<AdminStats>('/admin/stats'),

  listUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page)   qs.set('page',   String(params.page));
    if (params?.limit)  qs.set('limit',  String(params.limit));
    if (params?.role)   qs.set('role',   params.role);
    if (params?.search) qs.set('search', params.search);
    return api.get<PaginatedResponse<User>>(`/admin/users?${qs}`);
  },

  updateUser: (userId: string, updates: Partial<User>) =>
    api.put(`/admin/users/${userId}`, updates),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  listConfigs: () =>
    api.get<{ data: AssessmentConfig[] }>('/admin/configs'),

  updateConfig: (moduleId: string, updates: Partial<AssessmentConfig>) =>
    api.put(`/admin/configs/${moduleId}`, updates),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page)   qs.set('page',   String(params.page));
    if (params?.limit)  qs.set('limit',  String(params.limit));
    if (params?.action) qs.set('action', params.action);
    return api.get<PaginatedResponse<AuditLog>>(`/admin/audit?${qs}`);
  },
};
