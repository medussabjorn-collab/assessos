'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

interface AuthContextType {
  user: FirebaseUser | null;
  userId: string | null;
  tenantId: string | null;
  role: string | null;
  permissions: Set<string>;
  hasPermission: (key: string) => boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPTY_PERMISSIONS: Set<string> = new Set();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(EMPTY_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  // Fetches the resolved tenant/role/permissions for whichever Firebase user
  // is currently signed in. Pulled out of the onAuthStateChanged effect so
  // it can also be called right after a fresh signup: onAuthStateChanged
  // fires once on sign-up (before the backend User row exists — a 401 there
  // is expected) and does NOT fire again once POST /api/auth/register
  // creates that row, since no further sign-in/sign-out transition happens.
  // Without a manual refetch here, a brand-new user's tenantId/permissions
  // never populate until their next reload or re-login.
  const fetchTenant = async (): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/tenant');
      const {
        userId: fetchedUserId,
        tenantId: fetchedTenantId,
        role: fetchedRole,
        permissions: fetchedPermissions,
      } = response.data.data ?? {};
      setUserId(fetchedUserId ?? null);
      setTenantId(fetchedTenantId ?? null);
      setRole(fetchedRole ?? null);
      setPermissions(new Set(fetchedPermissions ?? []));
      // The api client reads tenantId from localStorage to attach the
      // x-tenant-id header on every subsequent request.
      if (fetchedTenantId) {
        localStorage.setItem('tenantId', fetchedTenantId);
      }
      return true;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchTenant();
      } else {
        setUserId(null);
        setTenantId(null);
        setRole(null);
        setPermissions(EMPTY_PERMISSIONS);
        localStorage.removeItem('tenantId');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Exposed for flows that create the backend User row after the Firebase
  // session already exists (registration) — see fetchTenant's comment.
  const refreshTenant = async (): Promise<void> => {
    await fetchTenant();
  };

  const logout = async () => {
    await signOut(auth);
    setUserId(null);
    setTenantId(null);
    setRole(null);
    setPermissions(EMPTY_PERMISSIONS);
    localStorage.removeItem('tenantId');
  };

  const hasPermission = (key: string) => permissions.has(key);

  return (
    <AuthContext.Provider
      value={{ user, userId, tenantId, role, permissions, hasPermission, loading, logout, refreshTenant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
