'use client';

import CHRODashboard from '@/components/CHRODashboard';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { ShieldOff } from 'lucide-react';

export default function AnalyticsPage() {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-subtle">Loading…</div>;
  }

  // Backend enforces this too (403 on /api/analytics/dashboard) — this is
  // the friendly UI for non-admins instead of a raw fetch error.
  if (!hasPermission(PERMISSIONS.ANALYTICS_ORG_DASHBOARD_VIEW)) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">
          Organization analytics are visible to org admins only. Ask your
          administrator for access.
        </p>
      </div>
    );
  }

  return <CHRODashboard />;
}
