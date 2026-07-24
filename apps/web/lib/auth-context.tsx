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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
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
        } catch (error) {
          console.error('Error fetching tenant:', error);
        }
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
      value={{ user, userId, tenantId, role, permissions, hasPermission, loading, logout }}
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
