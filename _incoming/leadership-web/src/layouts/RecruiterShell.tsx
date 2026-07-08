import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { IconRail } from '../components/common/IconRail';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { ToastContainer } from '../components/common/Toast';
import { recruiterNav } from './navConfig';

const HOME    = '/recruiter/dashboard';
const PROFILE = '/recruiter/profile';

export function RecruiterShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
      <Navbar navItems={recruiterNav} homeUrl={HOME} profileUrl={PROFILE} />
      <OfflineBanner />
      <div className="flex">
        <div className="hidden md:block w-16 flex-shrink-0" />
        <IconRail navItems={recruiterNav} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
