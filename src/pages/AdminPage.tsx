import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Settings, FileText, Shield, Activity, Plus, Edit2, Trash2,
  Download, Search, Filter, ChevronRight, ToggleLeft, ToggleRight,
  Clock, CheckCircle2, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/adminApi';
import { defaultConfigs } from '../data/configs';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { useNavigate } from 'react-router-dom';
import type { User, AuditLog } from '../types';

type Tab = 'overview' | 'users' | 'configs' | 'reports' | 'audit';

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'configs', label: 'Configurations', icon: Settings },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState<Tab>('overview');
  const [search, setSearch]           = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedConfig, setSelectedConfig]   = useState<typeof defaultConfigs[0] | null>(null);
  const [users, setUsers]       = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats]       = useState({ totalUsers: 0, activeConfigs: 5, passRate: 78, totalSessions: 0 });

  const load = useCallback(async () => {
    try {
      const [s, u, a] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers({ limit: 50 }),
        adminApi.getAuditLogs({ limit: 50 }),
      ]);
      setStats({ totalUsers: s.data.totalUsers, activeConfigs: s.data.activeConfigs, passRate: Math.round(s.data.passRate), totalSessions: s.data.totalSessions });
      setUsers(u.data);
      setAuditLogs(a.data);
    } catch { /* backend offline → silently fall through */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!user || user.role !== 'admin') { navigate('/'); return null; }

  const platformStats = [
    { label: 'Total Users',    value: stats.totalUsers || users.length || '—', icon: Users,       color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20',    change: 'All registered' },
    { label: 'Active Configs', value: stats.activeConfigs,                      icon: Settings,    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', change: 'All active' },
    { label: 'Total Sessions', value: stats.totalSessions || '—',               icon: Shield,      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',  change: 'All time' },
    { label: 'Pass Rate',      value: `${stats.passRate}%`,                     icon: CheckCircle2, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',  change: 'Platform avg' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Platform management & analytics</p>
        </div>
        <Badge color="red" size="md" dot>Administrator</Badge>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {platformStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Card>
                  <div className={`p-2 rounded-xl w-fit mb-3 ${s.color}`}><s.icon size={18} /></div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.change}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module performance */}
            <Card>
              <CardHeader><CardTitle>Module Performance (Platform Avg)</CardTitle></CardHeader>
              <div className="space-y-4">
                {defaultConfigs.map(cfg => (
                  <div key={cfg.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{cfg.moduleId}</span>
                      <span className="font-medium text-gray-900 dark:text-white">72%</span>
                    </div>
                    <ProgressBar value={72} size="sm" color="green" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader><CardTitle>System Activity</CardTitle></CardHeader>
              <div className="space-y-3">
                {auditLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-xl bg-gray-50 dark:bg-white/5">
                    <Activity size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{log.action}</p>
                      <p className="text-xs text-gray-400 truncate">{log.userId.slice(0, 8)} · {new Date((log as any).createdAt ?? log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No activity logged yet</p>
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              icon={<Search size={15} />} className="flex-1 min-w-48" />
            <Button variant="outline" icon={<Filter size={15} />}>Filter</Button>
            <Button icon={<Plus size={15} />}>Invite User</Button>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    {['Name', 'Role', 'Department', 'Last Login', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found</td></tr>
                  )}
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge color={u.role === 'admin' ? 'indigo' : u.role === 'viewer' ? 'gray' : 'blue'} size="sm">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">—</td>
                      <td className="py-3.5 px-4 text-gray-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-4">
                        <Badge color={u.isActive !== false ? 'green' : 'gray'} size="sm" dot>{u.isActive !== false ? 'active' : 'inactive'}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Configurations */}
      {activeTab === 'configs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{defaultConfigs.length} configurations</p>
            <Button icon={<Plus size={15} />} onClick={() => setShowConfigModal(true)}>New Configuration</Button>
          </div>
          <div className="space-y-4">
            {defaultConfigs.map((cfg, i) => (
              <motion.div key={cfg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="cursor-pointer" onClick={() => { setSelectedConfig(cfg); setShowConfigModal(true); }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cfg.title}</h3>
                        <Badge color={cfg.isActive ? 'green' : 'gray'} size="sm" dot>{cfg.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{cfg.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} />{cfg.timeLimit} min</span>
                        <span>•</span>
                        <span>{cfg.totalQuestions} questions</span>
                        <span>•</span>
                        <span>Pass: {cfg.passingScore}%</span>
                        {cfg.negativeMarking && <><span>•</span><span className="text-red-500">−{cfg.negativeMarkingValue} penalty</span></>}
                        {cfg.proctoring && <><span>•</span><span className="text-purple-500">AI Proctored</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-700" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" icon={<Download size={15} />}>Export All (CSV)</Button>
            <Button variant="outline" icon={<Download size={15} />}>Export PDF Report</Button>
            <Button variant="outline" icon={<Filter size={15} />}>Filter by Date</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Completion by Module</CardTitle></CardHeader>
              <div className="space-y-4">
                {defaultConfigs.map(cfg => (
                  <div key={cfg.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize w-28 flex-shrink-0">{cfg.moduleId}</span>
                    <ProgressBar value={65 + Math.floor(Math.random() * 25)} size="sm" color="brand" showLabel />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
              <div className="space-y-3">
                {[
                  { range: '90–100%', count: 3, color: 'bg-emerald-500' },
                  { range: '80–89%',  count: 8, color: 'bg-teal-500' },
                  { range: '70–79%',  count: 12, color: 'bg-blue-500' },
                  { range: '60–69%',  count: 7, color: 'bg-yellow-500' },
                  { range: 'Below 60%', count: 4, color: 'bg-red-500' },
                ].map(r => (
                  <div key={r.range} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{r.range}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(r.count / 34) * 100}%` }}
                        className={`h-full rounded-full ${r.color}`} transition={{ duration: 1 }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Search audit logs..." icon={<Search size={15} />} className="flex-1 min-w-48" />
            <Button variant="outline" icon={<Download size={15} />}>Export</Button>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    {['Timestamp', 'User ID', 'Action', 'Resource', 'Details'].map(h => (
                      <th key={h} className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No audit events yet</td></tr>
                  ) : auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">{new Date((log as any).createdAt ?? log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{log.userId.slice(0, 12)}…</td>
                      <td className="py-3 px-4">
                        <Badge color={
                          log.action.includes('login') ? 'blue' :
                          log.action.includes('submit') ? 'green' :
                          log.action.includes('logout') ? 'gray' : 'indigo'
                        } size="sm">{log.action}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{log.resource}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs font-mono">{log.resourceId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Config modal */}
      <Modal open={showConfigModal} onClose={() => { setShowConfigModal(false); setSelectedConfig(null); }}
        title={selectedConfig ? 'Edit Configuration' : 'New Configuration'} size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>Cancel</Button>
            <Button onClick={() => setShowConfigModal(false)}>Save Configuration</Button>
          </>
        }>
        {selectedConfig && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Editing: <strong className="text-gray-900 dark:text-white">{selectedConfig.title}</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Time Limit</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedConfig.timeLimit} minutes</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Questions</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedConfig.totalQuestions}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Passing Score</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedConfig.passingScore}%</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Points/Question</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedConfig.pointsPerQuestion}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'AI Proctoring', value: selectedConfig.proctoring },
                { label: 'Offline Mode', value: selectedConfig.offlineMode },
                { label: 'Shuffle Questions', value: selectedConfig.shuffleQuestions },
                { label: 'Negative Marking', value: selectedConfig.negativeMarking },
                { label: 'Allow Review', value: selectedConfig.allowReview },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.label}</span>
                  {s.value ? <ToggleRight size={20} className="text-brand-500" /> : <ToggleLeft size={20} className="text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
        {!selectedConfig && (
          <p className="text-sm text-gray-500">Configuration creation form — connect to your backend API to persist changes.</p>
        )}
      </Modal>
    </div>
  );
}
