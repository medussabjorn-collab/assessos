'use client';

import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase';

/**
 * Centralized API client.
 *
 * Base URL resolution:
 *  - In production set NEXT_PUBLIC_API_URL to the API service URL
 *    (e.g. https://assessos-api-production.up.railway.app).
 *  - When unset, defaults to relative "" so Next.js rewrites (see next.config.js)
 *    proxy /api/* to the API service / local dev server on :3000.
 */
const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

export const api: AxiosInstance = axios.create({ baseURL });

// Attach Firebase ID token + tenant header on every request.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof window !== 'undefined') {
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }

  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
