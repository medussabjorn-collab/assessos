import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Activity, TrendingUp, Settings,
  Shield, Plug, Layers, ChevronRight,
  CheckCircle2, Clock, AlertCircle, ArrowRight,
  BarChart3, Eye,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Badge } from '../../components/common/Badge';

/* ─── types ──────────────────────────────────────── */
interface Stats {
  totalUsers: number;
  totalSessions: number;
  passRate: number;
  activeConfigs: number;
  recentActivity: Array<{ date: string; sessions: number }>;
}

/* ─── helpers ────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } },
};

/* ─── quick-access sections ─────────────────────── */
const quickAccess = [
  {
    to: '/admin/users',
    icon: Users,
    label: 'User Management',
    desc: 'Manage accounts, roles & permissions',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    accent: 'text-accent-blue',
  },
  {
    to: '/admin/integrations',
    icon: Plug,
    label: 'Integrations',
    desc: 'API keys, webhooks & third-party tools',
    color: 'from-purple-500 to-violet-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    accent: 'text-purple-500',
  },
  {
    to: '/admin/security',
    icon: Shield,
    label: 'Security',
    desc: 'Auth policies, 2FA & access control',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    accent: 'text-emerald-500',
  },
  {
    to: '/admin/observability',
    icon: Activity,
    label: 'Observability',
    desc: 'Logs, metrics, alerts & traces',
    color: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    accent: 'text-amber-500',
  },
  {
    to: '/admin/architecture',
    icon: Layers,
    label: 'Architecture',
    desc: 'System design & infrastructure map',
    color: 'from-pink-500 to-rose-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    accent: 'text-pink-500',
  },
];

const systemStatus = [
  { label: 'API Server',    status: 'operational', latency: '18ms'  },
  { label: 'PostgreSQL',    status: 'operational', latency: '4ms'   },
  { label: 'MongoDB',       status: 'operational', latency: '6ms'   },
  { label: 'Redis Cache',   status: 'operational', latency: '1ms'   },
  { label: 'AI Proctoring', status: 'operational', latency: '210ms' },
];

/* ─── component ──────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalSessions: 0, passRate: 0, activeConfigs: 5,
    recentActivity: [],
  });

  useEffect(() => {
    adminApi.getStats()
      .then(r => setStats(prev => ({ ...prev, ...r.data, recentActivity: r.data.recentActivity ?? [] })))
      .catch(() => {});
  }, []);

  if (!user) return null;

  const recentActivity = stats.recentActivity ?? [];
  const maxActivity = Math.max(...recentActivity.map(d => d.sessions), 1);

  const kpis = [
    { icon: Users,       label: 'Total Users',    value: stats.totalUsers || '—',  sub: 'All registered',   accent: 'text-accent-blue',  bg: 'bg-blue-50 dark:bg-blue-900/20'     },
    { icon: BarChart3,   label: 'Total Sessions', value: stats.totalSessions || '—', sub: 'All time',       accent: 'text-purple-500',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: TrendingUp,  label: 'Platform Pass Rate', value: stats.passRate ? `${Math.round(stats.passRate)}%` : '—', sub: 'Across all modules', accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Settings,    label: 'Active Configs', value: stats.activeConfigs,       sub: 'Assessment modules', accent: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20'   },
  ];

  return (
    <div className="px-6 py-6 space-y-7 max-w-full">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="red" size="md" dot>Admin</Badge>
          <Link to="/admin/users">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
              Manage Users <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ── KPI strip ───────────────────────────────── */}
      <motion.div variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <motion.div key={k.label} variants={stagger.item}>
            <div className="frost-card p-5 h-full">
              <div className={`inline-flex p-2 rounded-xl ${k.bg} mb-3`}>
                <k.icon size={16} className={k.accent} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{k.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{k.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick access + System status ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick access grid */}
        <motion.div className="lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="frost-card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Admin Sections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickAccess.map((item) => (
                <Link key={item.to} to={item.to}>
                  <motion.div whileHover={{ x: 3 }}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group transition-colors"
                    style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* System status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="frost-card p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <Eye size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">System Status</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All operational
              </span>
            </div>
            <div className="space-y-2.5">
              {systemStatus.map(s => {
                const StatusIcon = s.status === 'operational' ? CheckCircle2 : s.status === 'degraded' ? AlertCircle : Clock;
                const statusColor = s.status === 'operational' ? 'text-emerald-500' : s.status === 'degraded' ? 'text-amber-500' : 'text-red-400';
                return (
                  <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                    <StatusIcon size={14} className={statusColor} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{s.label}</span>
                    <span className="text-xs text-gray-400 font-mono tabular-nums">{s.latency}</span>
                  </div>
                );
              })}
            </div>

            <Link to="/admin/observability">
              <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border border-brand-100 dark:border-brand-900/30">
                Full observability <ChevronRight size={12} />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Activity chart ──────────────────────────── */}
      {recentActivity.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="frost-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-brand-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Assessment Activity</h2>
              </div>
              <Link to="/admin/observability">
                <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                  Full report <ChevronRight size={12} />
                </button>
              </Link>
            </div>

            <div className="flex items-end gap-2 h-28">
              {recentActivity.slice(-14).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max((d.sessions / maxActivity) * 100, 4)}%`,
                      backgroundColor: 'rgb(91 141 239 / 0.7)',
                    }}
                    title={`${d.date}: ${d.sessions} sessions`}
                  />
                  {i % 2 === 0 && (
                    <p className="text-[9px] text-gray-400 font-medium">
                      {new Date(d.date).getDate()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Persona quick-switch ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Platform Personas</p>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Candidate View', sub: 'Take assessments', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
              { label: 'Recruiter View', sub: 'Manage pipeline',  color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
              { label: 'Admin (current)',sub: 'Platform control', color: 'bg-white/20 text-white border-white/30',  active: true },
            ].map(p => (
              <div key={p.label} className={`px-4 py-2.5 rounded-xl border text-left ${p.color} ${p.active ? '' : 'opacity-60'}`}>
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
