'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, Loader, ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface PermissionDef {
  id: string;
  key: string;
  description: string;
  category: string;
}

interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionKeys: string[];
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: { id: string; name: string };
}

export default function RolesPage() {
  const { userId, hasPermission, loading: authLoading } = useAuth();
  const allowed = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const [permissions, setPermissions] = useState<PermissionDef[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftKeys, setDraftKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = roles.find((r) => r.id === selectedId) ?? null;

  const load = async () => {
    const [rolesRes, permsRes, usersRes] = await Promise.all([
      api.get('/api/roles'),
      api.get('/api/roles/permissions'),
      api.get('/api/roles/users'),
    ]);
    setRoles(rolesRes.data.data ?? []);
    setPermissions(permsRes.data.data ?? []);
    setUsers(usersRes.data.data ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!allowed) {
      setLoading(false);
      return;
    }
    load()
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoading(false));
  }, [authLoading, allowed]);

  const selectRole = (role: RoleSummary) => {
    setCreating(false);
    setSelectedId(role.id);
    setDraftName(role.name);
    setDraftDescription(role.description ?? '');
    setDraftKeys(new Set(role.permissionKeys));
    setError(null);
  };

  const startCreate = () => {
    setSelectedId(null);
    setCreating(true);
    setDraftName('');
    setDraftDescription('');
    setDraftKeys(new Set());
    setError(null);
  };

  const toggleKey = (key: string) => {
    setDraftKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (creating) {
        await api.post('/api/roles', {
          name: draftName,
          description: draftDescription || undefined,
          permissionKeys: Array.from(draftKeys),
        });
        setCreating(false);
      } else if (selected) {
        await api.patch(`/api/roles/${selected.id}`, {
          name: selected.isSystem ? undefined : draftName,
          description: draftDescription,
          permissionKeys: Array.from(draftKeys),
        });
      }
      await load();
      setSelectedId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (role: RoleSummary) => {
    setError(null);
    try {
      await api.delete(`/api/roles/${role.id}`);
      if (selectedId === role.id) setSelectedId(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to delete role.');
    }
  };

  const assignRole = async (targetUserId: string, roleId: string) => {
    setError(null);
    try {
      await api.patch(`/api/roles/users/${targetUserId}`, { roleId });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to assign role.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="frost-card p-12 text-center max-w-md mx-auto mt-16">
        <ShieldOff className="w-12 h-12 text-hairline mx-auto mb-4" />
        <p className="text-ink font-medium mb-1">Admin access required</p>
        <p className="text-subtle text-sm">
          Role management is visible to org admins only. Ask your administrator for access.
        </p>
      </div>
    );
  }

  const categories = Array.from(new Set(permissions.map((p) => p.category))).sort();
  const showEditor = creating || !!selected;

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Roles"
        subtitle="Create custom roles and control what each one can access."
        icon={KeyRound}
        action={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700 transition"
          >
            <Plus size={15} /> New role
          </button>
        }
      />

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={`w-full text-left rounded-xl border p-4 transition ${
                selectedId === role.id ? 'border-brand-500 bg-brand-50' : 'border-hairline bg-surface hover:border-brand-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink capitalize">{role.name.replace(/_/g, ' ')}</span>
                {role.isSystem && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-subtle">system</span>
                )}
              </div>
              <p className="text-xs text-subtle mt-1 line-clamp-2">{role.description || 'No description.'}</p>
              <p className="text-[11px] text-subtle mt-2">
                {role.permissionKeys.length} permission{role.permissionKeys.length === 1 ? '' : 's'} · {role.userCount} user
                {role.userCount === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>

        <div>
          {!showEditor && (
            <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
              Select a role to view or edit its permissions.
            </div>
          )}

          {showEditor && (
            <div className="bg-surface border border-hairline rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-subtle block mb-1">Name</label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    disabled={!!selected?.isSystem}
                    className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas disabled:opacity-60"
                  />
                </div>
                {selected && !selected.isSystem && (
                  <button
                    onClick={() => removeRole(selected)}
                    disabled={selected.userCount > 0}
                    title={selected.userCount > 0 ? 'Reassign users before deleting this role' : 'Delete role'}
                    className="mt-5 p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <label className="text-xs text-subtle block mb-1">Description</label>
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={2}
                className="w-full border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas mb-4"
              />

              <p className="text-xs text-subtle mb-2">Permissions</p>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {categories.map((category) => (
                  <div key={category}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle/70 mb-1.5 capitalize">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {permissions
                        .filter((p) => p.category === category)
                        .map((p) => (
                          <label key={p.key} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draftKeys.has(p.key)}
                              onChange={() => toggleKey(p.key)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="text-ink">{p.description}</span>{' '}
                              <span className="text-subtle text-xs font-mono">({p.key})</span>
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-subtle hover:bg-canvas transition"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !draftName.trim()}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving…' : creating ? 'Create role' : 'Save changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-surface border border-hairline rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline">
          <h3 className="font-semibold text-ink">Team members</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-subtle border-b border-hairline">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-hairline last:border-0">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-subtle">{u.email}</td>
                <td className="p-3">
                  {roles.some((r) => r.id === u.role.id) ? (
                    <select
                      value={u.role.id}
                      disabled={u.id === userId}
                      onChange={(e) => assignRole(u.id, e.target.value)}
                      className="border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas capitalize disabled:opacity-60"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-subtle capitalize" title="Platform-level role — not managed here">
                      {u.role.name.replace(/_/g, ' ')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-subtle text-sm">No users.</p>}
      </div>
    </div>
  );
}
