'use client';

import { useAuth } from '@/lib/auth-context';
import CHRODashboard from '@/components/CHRODashboard';
import { ForbiddenError } from '@/lib/errors';

export default function AnalyticsPage() {
  const { user } = useAuth();

  // Only org admins can view this page
  // TODO: Verify role from backend

  return <CHRODashboard />;
}
