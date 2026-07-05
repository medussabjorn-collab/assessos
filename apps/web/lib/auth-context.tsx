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
  tenantId: string | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const response = await api.post('/api/auth/tenant');
          const { tenantId: fetchedTenantId, role: fetchedRole } =
            response.data.data ?? {};
          setTenantId(fetchedTenantId ?? null);
          setRole(fetchedRole ?? null);
          // The api client reads tenantId from localStorage to attach the
          // x-tenant-id header on every subsequent request.
          if (fetchedTenantId) {
            localStorage.setItem('tenantId', fetchedTenantId);
          }
        } catch (error) {
          console.error('Error fetching tenant:', error);
        }
      } else {
        setTenantId(null);
        setRole(null);
        localStorage.removeItem('tenantId');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setTenantId(null);
    setRole(null);
    localStorage.removeItem('tenantId');
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, role, loading, logout }}>
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
