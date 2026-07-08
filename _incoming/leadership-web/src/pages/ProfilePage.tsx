import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Globe, Shield, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { api } from '../services/apiClient';
import { useOfflineSync } from '../hooks/useOfflineSync';

type Tab = 'profile' | 'security' | 'preferences';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleDark }  = useTheme();
  const sync = useOfflineSync();

  const [tab, setTab]         = useState<Tab>('profile');
  const [name, setName]       = useState(user?.name ?? '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const [oldPw, setOldPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwMsg, setPwMsg]     = useState('');

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', { name });
      updateProfile({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    try {
      await api.put('/auth/change-password', { currentPassword: oldPw, newPassword: newPw });
      setPwMsg('Password updated successfully.');
      setOldPw(''); setNewPw('');
    } catch (e: unknown) {
      setPwMsg((e as Error).message ?? 'Failed to update password.');
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile',     label: 'Profile',     icon: User   },
    { id: 'security',    label: 'Security',    icon: Lock   },
    { id: 'preferences', label: 'Preferences', icon: Globe  },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your profile, security, and preferences</p>
      </motion.div>

      {/* Avatar hero */}
      <Card className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-lg">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge color={user.role === 'admin' ? 'indigo' : user.role === 'viewer' ? 'gray' : 'blue'} size="sm">{user.role}</Badge>
            {user.emailVerified && <Badge color="green" size="sm" dot>Verified</Badge>}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-400 text-xs">Offline queue</p>
          <p className={`font-semibold ${sync.pendingCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {sync.syncing ? 'Syncing…' : sync.pendingCount > 0 ? `${sync.pendingCount} pending` : 'Synced'}
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              <Input label="Email" value={user.email} disabled hint="Email cannot be changed" />
              <Input label="Role" value={user.role} disabled />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={saveProfile} loading={saving} icon={saved ? <CheckCircle2 size={15} /> : <Save size={15} />}>
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
              {saved && <span className="text-sm text-emerald-600">Profile updated.</span>}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Input label="Current Password" type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} />
                <button onClick={() => setShowOld(p => !p)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="relative">
                <Input label="New Password" type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} />
                <button onClick={() => setShowNew(p => !p)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwMsg && <p className={`text-sm ${pwMsg.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{pwMsg}</p>}
            </div>
            <div className="mt-5">
              <Button onClick={changePassword} disabled={!oldPw || newPw.length < 8} icon={<Shield size={15} />}>Update Password</Button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
            <div className="space-y-3">
              {[
                { device: 'Current browser', location: 'Active now', current: true },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.device}</p>
                    <p className="text-xs text-gray-500">{s.location}</p>
                  </div>
                  {s.current ? <Badge color="green" size="sm" dot>Current</Badge> : <Button variant="ghost" size="sm">Revoke</Button>}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Preferences tab */}
      {tab === 'preferences' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-500">Toggle between light and dark themes</p>
              </div>
              <button onClick={toggleDark}
                className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-brand-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <div className="space-y-2">
              {[
                { label: 'Assessment reminders', sub: 'Email notifications for upcoming deadlines', on: true },
                { label: 'Score alerts', sub: 'Get notified when results are ready', on: true },
                { label: 'Proctoring alerts', sub: 'Real-time risk warnings during assessments', on: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  <Bell size={15} className={item.on ? 'text-brand-500' : 'text-gray-400'} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
