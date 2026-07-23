'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Ban, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface OrgUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  createdAt: string;
  _count: { assessmentSessions: number; aiReports: number };
}

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: { disabled?: boolean } | null;
  subscriptions: Array<{ plan: string; seats: number; assessmentCredits: number; renewsAt: string | null }>;
  _count: { assessmentSessions: number; aiReports: number };
}

export default function OrgDetailPage() {
  const params = useParams();
  const tenantId = String(params.tenantId);
  const { hasPermission } = useAuth();
  const isSuperAdmin = hasPermission(PERMISSIONS.PLATFORM_ORGS_MANAGE);

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [orgRes, usersRes] = await Promise.all([
          api.get(`/api/admin/organizations/${tenantId}`),
          api.get(`/api/admin/users/${tenantId}`),
        ]);
        setOrg(orgRes.data.data);
        setUsers(usersRes.data.data ?? []);
      } catch {
        // leave null; page shows "not found" state
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, isSuperAdmin]);

  const disableOrg = async () => {
    setDisabling(true);
    try {
      await api.post(`/api/admin/organizations/${tenantId}/disable`);
      setActionMsg('Organization disabled.');
      setOrg((prev) => (prev ? { ...prev, settings: { ...prev.settings, disabled: true } } : prev));
    } catch {
      setActionMsg('Failed to disable organization.');
    } finally {
      setDisabling(false);
    }
  };

  const enableOrg = async () => {
    setDisabling(true);
    try {
      await api.post(`/api/admin/organizations/${tenantId}/enable`);
      setActionMsg('Organization enabled.');
      setOrg((prev) => (prev ? { ...prev, settings: { ...prev.settings, disabled: false } } : prev));
    } catch {
      setActionMsg('Failed to enable organization.');
    } finally {
      setDisabling(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="Organization" icon={Shield} />
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

  if (!org) {
    return <div className="p-2 text-subtle">Organization not found.</div>;
  }

  const sub = org.subscriptions?.[0];
  const disabled = !!org.settings?.disabled;

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title={org.name}
        subtitle={org.slug}
        icon={Shield}
        action={
          disabled ? (
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400">Disabled</span>
              <button
                onClick={enableOrg}
                disabled={disabling}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 text-emerald-500 px-3 py-1.5 text-sm hover:bg-emerald-500/10 disabled:opacity-50 transition"
              >
                <CheckCircle2 size={15} /> {disabling ? 'Enabling…' : 'Enable organization'}
              </button>
            </div>
          ) : (
            <button
              onClick={disableOrg}
              disabled={disabling}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 text-red-400 px-3 py-1.5 text-sm hover:bg-red-500/10 disabled:opacity-50 transition"
            >
              <Ban size={15} /> {disabling ? 'Disabling…' : 'Disable organization'}
            </button>
          )
        }
      />

      {actionMsg && <p className="text-sm text-subtle mb-4">{actionMsg}</p>}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-surface border border-hairline rounded-xl p-5">
          <p className="text-xs text-subtle mb-1">Plan</p>
          <p className="text-xl font-bold text-ink capitalize">{sub?.plan ?? org.plan}</p>
        </div>
        <div className="bg-surface border border-hairline rounded-xl p-5">
          <p className="text-xs text-subtle mb-1">Seats</p>
          <p className="text-xl font-bold text-ink">{sub?.seats ?? '—'}</p>
        </div>
        <div className="bg-surface border border-hairline rounded-xl p-5">
          <p className="text-xs text-subtle mb-1">Assessment credits</p>
          <p className="text-xl font-bold text-ink">{sub?.assessmentCredits ?? '—'}</p>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-subtle border-b border-hairline">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Sessions</th>
              <th className="p-3 font-medium">Reports</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-hairline last:border-0">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-subtle">{u.email}</td>
                <td className="p-3 capitalize">{u.role.replace(/_/g, ' ')}</td>
                <td className="p-3">{u._count.assessmentSessions}</td>
                <td className="p-3">{u._count.aiReports}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-subtle text-sm">No users.</p>}
      </div>
    </div>
  );
}
