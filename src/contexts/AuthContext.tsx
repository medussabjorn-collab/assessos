import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types';
import { api, setAccessToken, getAccessToken } from '../services/apiClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse { data: { accessToken: string; refreshToken: string; user: User } }
interface MeResponse   { data: User }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!getAccessToken()) { setLoading(false); return; }
    try {
      const res = await api.get<MeResponse>('/auth/me');
      setUser(res.data);
    } catch {
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    const handler = () => { setUser(null); setAccessToken(null); };
    window.addEventListener('la:session-expired', handler);
    return () => window.removeEventListener('la:session-expired', handler);
  }, [loadCurrentUser]);

  const signIn = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    if (res.data.refreshToken) localStorage.setItem('la_refresh_token', res.data.refreshToken);
    setUser(res.data.user);
  };

  const signUp = async (name: string, email: string, password: string, role?: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password, ...(role ? { role } : {}) });
    setAccessToken(res.data.accessToken);
    if (res.data.refreshToken) localStorage.setItem('la_refresh_token', res.data.refreshToken);
    setUser(res.data.user);
  };

  const signOut = async () => {
    try { await api.post('/auth/logout', {}); } catch { /* best-effort */ }
    setAccessToken(null);
    localStorage.removeItem('la_refresh_token');
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
