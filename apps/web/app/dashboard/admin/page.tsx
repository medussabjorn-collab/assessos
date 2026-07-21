'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Users, FileText, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  users: number;
  assessments: number;
  reports: number;
  subscription: { plan: string; seats: number; assessmentCredits: number } | null;
}

interface UsageAlert {
  tenantId: string;
  tenantName: string;
  alertType: string;
  message: string;
}

export default function AdminPage() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [orgsRes, alertsRes] = await Promise.all([
          api.get('/api/admin/organizations'),
          api.post('/api/admin/usage-alerts'),
        ]);
        setOrgs(orgsRes.data.data ?? []);
        setAlerts(alertsRes.data.data ?? []);
      } catch {
        setError('Failed to load organizations.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="Admin" icon={Shield} />
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          Only super admins can view this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-2 text-red-400">{error}</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Admin"
        subtitle="Every organization on the platform."
        icon={Shield}
      />

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-600"
            >
              <AlertTriangle size={15} className="shrink-0" />
              <span>
                <strong>{a.tenantName}</strong>: {a.message}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {orgs.map((org) => (
          <Link
            key={org.id}
            href={`/dashboard/admin/${org.id}`}
            className="group flex items-center justify-between bg-surface border border-hairline rounded-xl p-5 hover:border-blue-600/50 transition"
          >
            <div>
              <p className="font-semibold text-ink">{org.name}</p>
              <p className="text-xs text-subtle">{org.slug}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-subtle">
              <span className="flex items-center gap-1">
                <Users size={14} /> {org.users}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={14} /> {org.reports}
              </span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-blue-500/15 text-brand-500 text-xs">
                {org.subscription?.plan ?? org.plan}
              </span>
            </div>
          </Link>
        ))}
        {orgs.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
            No organizations yet.
          </div>
        )}
      </div>
    </div>
  );
}
