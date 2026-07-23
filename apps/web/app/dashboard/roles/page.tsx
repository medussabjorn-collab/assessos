'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, Loader, ShieldOff, UserPlus, Pencil, Ban, CheckCircle2, X } from 'lucide-react';
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
  isActive: boolean;
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

  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', department: '', roleId: '' });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '' });
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const selected = roles.find((r) => r.id === selectedId) ?? null;

  const load = async () => {
    const [rolesRes, permsRes, usersRes] = await Promise.all([
      api.get('/api/roles'),
      api.get('/api/roles/permissions'),
      api.get('/api/users'),
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

  const startInvite = () => {
    setInviting(true);
    setInviteForm({ email: '', name: '', department: '', roleId: roles[0]?.id ?? '' });
    setInviteMsg(null);
  };

  const submitInvite = async () => {
    setInviteSaving(true);
    setInviteMsg(null);
    try {
      await api.post('/api/users', {
        email: inviteForm.email,
        name: inviteForm.name,
        department: inviteForm.department || undefined,
        roleId: inviteForm.roleId,
      });
      setInviting(false);
      await load();
    } catch (err: any) {
      setInviteMsg(err?.response?.data?.message ?? 'Failed to send invitation.');
    } finally {
      setInviteSaving(false);
    }
  };

  const startEditUser = (u: TenantUser) => {
    setEditingUserId(u.id);
    setEditForm({ name: u.name, email: u.email, department: u.department ?? '' });
    setUserActionError(null);
  };

  const saveEditUser = async () => {
    if (!editingUserId) return;
    setUserActionError(null);
    try {
      await api.patch(`/api/users/${editingUserId}`, {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department || undefined,
      });
      setEditingUserId(null);
      await load();
    } catch (err: any) {
      setUserActionError(err?.response?.data?.message ?? 'Failed to update user.');
    }
  };

  const toggleUserActive = async (u: TenantUser) => {
    setUserActionError(null);
    try {
      await api.post(`/api/users/${u.id}/${u.isActive ? 'deactivate' : 'reactivate'}`);
      await load();
    } catch (err: any) {
      setUserActionError(err?.response?.data?.message ?? 'Failed to update user.');
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
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <h3 className="font-semibold text-ink">Team members</h3>
          <button
            onClick={startInvite}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700 transition"
          >
            <UserPlus size={15} /> Invite user
          </button>
        </div>

        {inviting && (
          <div className="p-5 border-b border-hairline bg-canvas/50 space-y-3">
            {inviteMsg && <p className="text-sm text-red-500">{inviteMsg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
              />
              <input
                placeholder="Name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
              />
              <input
                placeholder="Department (optional)"
                value={inviteForm.department}
                onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))}
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
              />
              <select
                value={inviteForm.roleId}
                onChange={(e) => setInviteForm((f) => ({ ...f, roleId: e.target.value }))}
                className="border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas capitalize"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setInviting(false)}
                className="px-4 py-2 rounded-lg text-sm text-subtle hover:bg-canvas transition"
              >
                Cancel
              </button>
              <button
                onClick={submitInvite}
                disabled={inviteSaving || !inviteForm.email.trim() || !inviteForm.name.trim() || !inviteForm.roleId}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
              >
                {inviteSaving ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </div>
        )}

        {userActionError && <p className="px-5 pt-3 text-sm text-red-500">{userActionError}</p>}

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-subtle border-b border-hairline">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingUserId === u.id ? (
                <tr key={u.id} className="border-b border-hairline last:border-0 bg-canvas/40">
                  <td className="p-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={editForm.department}
                      onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                      className="w-full border border-hairline rounded-lg px-2 py-1 text-sm bg-canvas"
                    />
                  </td>
                  <td className="p-3 text-subtle capitalize">{u.role.name.replace(/_/g, ' ')}</td>
                  <td className="p-3" />
                  <td className="p-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={saveEditUser} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10">
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="p-1.5 rounded-md text-subtle hover:bg-canvas"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className={`border-b border-hairline last:border-0 ${u.isActive ? '' : 'opacity-50'}`}>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-subtle">{u.email}</td>
                  <td className="p-3 text-subtle">{u.department ?? '—'}</td>
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
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        u.isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {u.isActive ? 'active' : 'deactivated'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => startEditUser(u)}
                        className="p-1.5 rounded-md text-subtle hover:bg-canvas"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleUserActive(u)}
                        disabled={u.id === userId}
                        title={u.id === userId ? 'You cannot deactivate your own account' : u.isActive ? 'Deactivate' : 'Reactivate'}
                        className={`p-1.5 rounded-md disabled:opacity-30 ${
                          u.isActive ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-subtle text-sm">No users.</p>}
      </div>
    </div>
  );
}
