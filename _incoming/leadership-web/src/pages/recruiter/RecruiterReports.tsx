import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, CheckCircle2, Clock,
  Code2, Brain, MessageCircle, Zap,
  ChevronRight, Download, BarChart2, PieChart,
} from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';

/* ─── demo data ──────────────────────────────────── */
const moduleStats = [
  { name: 'Technical',     icon: Code2,          passRate: 68, avgScore: 72, total: 24, color: 'from-blue-500 to-cyan-400',      bar: 'brand'   },
  { name: 'Behavioral',    icon: Users,           passRate: 74, avgScore: 76, total: 18, color: 'from-emerald-500 to-teal-400',   bar: 'green'   },
  { name: 'Psychometric',  icon: Brain,           passRate: 71, avgScore: 73, total: 14, color: 'from-purple-500 to-violet-400',  bar: 'brand'   },
  { name: 'Communication', icon: MessageCircle,   passRate: 82, avgScore: 81, total: 16, color: 'from-pink-500 to-rose-400',      bar: 'green'   },
  { name: 'Attitude',      icon: Zap,             passRate: 65, avgScore: 68, total: 12, color: 'from-amber-400 to-orange-400',   bar: 'yellow'  },
];

const timelineData = [
  { month: 'Jan', sent: 6,  completed: 4  },
  { month: 'Feb', sent: 8,  completed: 6  },
  { month: 'Mar', sent: 10, completed: 8  },
  { month: 'Apr', sent: 7,  completed: 5  },
  { month: 'May', sent: 12, completed: 10 },
  { month: 'Jun', sent: 14, completed: 9  },
];

const topCandidates = [
  { initials: 'HB', name: 'Henry B.',  role: 'Tech Lead',      color: 'bg-purple-400', avg: 84, modules: 3 },
  { initials: 'FM', name: 'Felix M.',  role: 'Team Lead',      color: 'bg-emerald-400',avg: 87, modules: 2 },
  { initials: 'NG', name: 'Nina G.',   role: 'Analyst',        color: 'bg-amber-400',  avg: 81, modules: 2 },
  { initials: 'OA', name: 'Olivia A.', role: 'HR Manager',     color: 'bg-accent-blue',avg: 85, modules: 1 },
];

const ranges = ['This Week', 'This Month', 'Last 90 Days', 'All Time'];

const maxSent = Math.max(...timelineData.map(d => d.sent));

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } },
};

/* ─── component ──────────────────────────────────── */
export default function RecruiterReports() {
  const [range, setRange] = useState('This Month');

  const totalSent      = timelineData.reduce((s, d) => s + d.sent, 0);
  const totalCompleted = timelineData.reduce((s, d) => s + d.completed, 0);
  const completionRate = Math.round((totalCompleted / totalSent) * 100);
  const avgPassRate    = Math.round(moduleStats.reduce((s, m) => s + m.passRate, 0) / moduleStats.length);
  const avgScore       = Math.round(moduleStats.reduce((s, m) => s + m.avgScore, 0) / moduleStats.length);

  return (
    <div className="px-6 py-6 space-y-6 max-w-full">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Assessment performance across your pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range picker */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {ranges.map(r => (
              <button key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >{r}</button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </motion.div>

      {/* ── KPI strip ───────────────────────────────── */}
      <motion.div variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,        label: 'Total Assessments Sent',  value: totalSent,          sub: 'Across all modules',        accent: 'text-accent-blue',  bg: 'bg-blue-50 dark:bg-blue-900/20'     },
          { icon: CheckCircle2, label: 'Completion Rate',          value: `${completionRate}%`, sub: `${totalCompleted} completed`, accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: TrendingUp,   label: 'Avg Pass Rate',            value: `${avgPassRate}%`,  sub: 'Across all modules',        accent: 'text-purple-500',   bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: Clock,        label: 'Avg Assessment Score',     value: `${avgScore}%`,     sub: 'All candidates',            accent: 'text-amber-500',    bg: 'bg-amber-50 dark:bg-amber-900/20'   },
        ].map(s => (
          <motion.div key={s.label} variants={stagger.item}>
            <div className="frost-card p-5 h-full">
              <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-3`}>
                <s.icon size={16} className={s.accent} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Bar chart — assessments over time */}
        <motion.div className="lg:col-span-3 frost-card p-6"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Assessments Over Time</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent-blue inline-block" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Completed</span>
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="flex items-end gap-3 h-40">
            {timelineData.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-32">
                  {/* Sent bar */}
                  <div className="flex-1 rounded-t-lg bg-accent-blue/20 dark:bg-accent-blue/30 transition-all duration-500"
                    style={{ height: `${(d.sent / maxSent) * 100}%`, minHeight: 4 }} />
                  {/* Completed bar */}
                  <div className="flex-1 rounded-t-lg bg-emerald-400/80 transition-all duration-500"
                    style={{ height: `${(d.completed / maxSent) * 100}%`, minHeight: 4 }} />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">{d.month}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top candidates */}
        <motion.div className="lg:col-span-2 frost-card p-6"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <PieChart size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Top Performers</h2>
            </div>
            <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {topCandidates.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                <span className="w-5 text-xs font-bold text-gray-400 text-center flex-shrink-0">#{i + 1}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${c.color}`}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.role} · {c.modules} module{c.modules !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-bold text-emerald-500 tabular-nums flex-shrink-0">{c.avg}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Module breakdown ────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="frost-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Module Breakdown</h2>
            <p className="text-xs text-gray-400">Pass threshold: 70%</p>
          </div>
          <div className="space-y-4">
            {moduleStats.map((m, i) => (
              <motion.div key={m.name}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.05 }}>
                <div className="grid grid-cols-[2fr_1fr_1fr_3fr] items-center gap-6">
                  {/* Module */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <m.icon size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                      <p className="text-[11px] text-gray-400">{m.total} candidates</p>
                    </div>
                  </div>
                  {/* Pass rate */}
                  <div className="text-center">
                    <p className={`text-lg font-bold tabular-nums ${m.passRate >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{m.passRate}%</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pass rate</p>
                  </div>
                  {/* Avg score */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 tabular-nums">{m.avgScore}%</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Avg score</p>
                  </div>
                  {/* Bar */}
                  <div>
                    <ProgressBar value={m.avgScore} size="sm" color={m.bar as 'brand' | 'green' | 'yellow'} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
