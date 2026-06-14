'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import CHRODashboard from '@/components/CHRODashboard';
import { ForbiddenError } from '@/lib/errors';

export default function AnalyticsPage() {
  const { user } = useContext(AuthContext);

  // Only org admins can view this page
  // TODO: Verify role from backend

  return <CHRODashboard />;
}
