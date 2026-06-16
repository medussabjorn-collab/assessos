import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, CheckCircle2, Target, ArrowRight, Brain,
  Code2, Users, MessageCircle, Zap, Award, Activity,
  Calendar, MoreHorizontal, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { assessmentApi, type SessionResult } from '../services/assessmentApi';
import { defaultConfigs } from '../data/configs';
import type { AssessmentModuleId } from '../types';

const moduleIcons: Record<AssessmentModuleId, typeof Brain> = {
  technical: Code2, attitude: Zap, behavioral: Users, psychometric: Brain, communication: MessageCircle,
};

const moduleColors: Record<AssessmentModuleId, string> = {
  technical:     'from-accent-blue to-blue-400',
  attitude:      'from-amber-400 to-orange-400',
  behavioral:    'from-emerald-400 to-teal-400',
  psychometric:  'from-purple-400 to-violet-500',
  communication: 'from-pink-400 to-rose-400',
};

const moduleBg: Record<AssessmentModuleId, string> = {
  technical:     'bg-blue-50 dark:bg-blue-900/20',
  attitude:      'bg-amber-50 dark:bg-amber-900/20',
  behavioral:    'bg-emerald-50 dark:bg-emerald-900/20',
  psychometric:  'bg-purple-50 dark:bg-purple-900/20',
  communication: 'bg-pink-50 dark:bg-pink-900/20',
};

const moduleTextColor: Record<AssessmentModuleId, string> = {
  technical:     'text-accent-blue',
  attitude:      'text-amber-500',
  behavioral:    'text-emerald-500',
  psychometric:  'text-purple-500',
  communication: 'text-pink-500',
};

// Candidate avatar colors (deterministic, not random)
const avatarPalette = [
  'bg-accent-blue', 'bg-purple-400', 'bg-emerald-400',
  'bg-amber-400', 'bg-pink-400', 'bg-teal-400', 'bg-violet-400',
];

const demoStages = [
  {
    id: 'applied',
    label: 'Applied',
    connectorColor: '#5b8def',
    candidates: [
      { initials: 'AL', name: 'Alex Lee', module: 'Technical', date: 'Jun 10', color: avatarPalette[0] },
      { initials: 'MW', name: 'Maria W.', module: 'Behavioral', date: 'Jun 11', color: avatarPalette[4] },
      { initials: 'JD', name: 'John D.', module: 'Technical', date: 'Jun 12', color: avatarPalette[1] },
    ],
  },
  {
    id: 'screening',
    label: 'Screening',
    connectorColor: '#5b8def',
    candidates: [
      { initials: 'SK', name: 'Sara K.', module: 'Communication', date: 'Jun 9', color: avatarPalette[2] },
      { initials: 'RC', name: 'Ryan C.', module: 'Attitude', date: 'Jun 8', color: avatarPalette[3] },
    ],
  },
  {
    id: 'assessment',
    label: 'Assessment',
    connectorColor: '#5b8def',
    candidates: [
      { initials: 'PT', name: 'Priya T.', module: 'Psychometric', date: 'Jun 7', color: avatarPalette[5] },
      { initials: 'BN', name: 'Ben N.', module: 'Technical', date: 'Jun 6', color: avatarPalette[6] },
      { initials: 'OA', name: 'Olivia A.', module: 'Behavioral', date: 'Jun 5', color: avatarPalette[0] },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    connectorColor: '#ef6b6b',
    candidates: [
      { initials: 'HB', name: 'Henry B.', module: 'Technical', date: 'Jun 4', color: avatarPalette[1] },
      { initials: 'CC', name: 'Clara C.', module: 'Communication', date: 'Jun 3', color: avatarPalette[4] },
    ],
  },
  {
    id: 'decision',
    label: 'Decision',
    connectorColor: '#ef6b6b',
    candidates: [
      { initials: 'FM', name: 'Felix M.', module: 'Behavioral', date: 'Jun 2', color: avatarPalette[2] },
      { initials: 'NG', name: 'Nina G.', module: 'Psychometric', date: 'Jun 1', color: avatarPalette[3] },
    ],
  },
];

const lifecycleStages = [
  { id: 'not_started', label: 'Not Started', color: '#9ca3af', count: 8 },
  { id: 'in_progress', label: 'In Progress', color: '#5b8def', count: 5 },
  { id: 'review',      label: 'Under Review', color: '#f59e0b', count: 3 },
  { id: 'completed',   label: 'Completed',   color: '#10b981', count: 12 },
  { id: 'archived',    label: 'Archived',     color: '#ef6b6b', count: 2 },
];

interface AvatarStackProps { candidates: { initials: string; color: string }[]; max?: number }

function AvatarStack({ candidates, max = 4 }: AvatarStackProps) {
  const visible = candidates.slice(0, max);
  const extra = candidates.length - max;
  return (
    <div className="flex -space-x-2 items-center">
      {visible.map((c, i) => (
        <div key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${c.color}`}>
          {c.initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
          +{extra}
        </div>
      )}
    </div>
  );
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [results, setResults] = useState<SessionResult[]>([]);

  useEffect(() => {
    if (user) assessmentApi.getResults().then(r => setResults(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const totalSessions = results.length;
  const avgScore  = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.score)) : 0;
  const passRate  = results.length ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;
  const recent    = [...results].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5);
  const bestByModule = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.moduleId] = Math.max(acc[r.moduleId] ?? 0, r.score);
    return acc;
  }, {});

  const statCards = [
    { label: 'Assessments Taken', value: totalSessions, icon: CheckCircle2, accent: 'text-accent-blue', bg: 'bg-blue-50 dark:bg-blue-900/20', sub: 'All time' },
    { label: 'Average Score', value: `${avgScore}%`, icon: TrendingUp, accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: avgScore >= 70 ? 'Above passing' : 'Needs improvement' },
    { label: 'Best Score', value: `${bestScore}%`, icon: Award, accent: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', sub: 'Personal best' },
    { label: 'Pass Rate', value: `${passRate}%`, icon: Target, accent: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', sub: 'Cumulative' },
  ];

  return (
    <div className="px-6 py-6 space-y-6 max-w-full">
      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Assessment Journeys
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={user.role === 'admin' ? 'indigo' : user.role === 'viewer' ? 'gray' : 'green'} size="md" dot>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
          {user.department && <Badge color="blue" size="md">{user.department}</Badge>}
          <Link to="/assessments">
            <Button size="sm" variant="primary" iconRight={<ArrowRight size={14} />}>New Assessment</Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <motion.div key={s.label} variants={stagger.item}>
            <div className="frost-card p-5">
              <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                <s.icon size={18} className={s.accent} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Candidate Journey Pipeline ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="frost-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Candidate Journey</h2>
              <p className="text-xs text-gray-500 mt-0.5">{demoStages.reduce((s, st) => s + st.candidates.length, 0)} candidates across {demoStages.length} stages</p>
            </div>
            <button className="rail-btn"><MoreHorizontal size={16} /></button>
          </div>

          {/* Horizontal pipeline */}
          <div className="flex items-start gap-0 overflow-x-auto pb-2 scrollbar-none">
            {demoStages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                {/* Stage card */}
                <div className="flex-shrink-0 w-52 rounded-2xl p-4" style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{stage.label}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: stage.connectorColor }}>
                      {stage.candidates.length}
                    </span>
                  </div>

                  {/* Avatar stack */}
                  <div className="mb-3">
                    <AvatarStack candidates={stage.candidates} />
                  </div>

                  {/* Candidate list */}
                  <div className="space-y-2">
                    {stage.candidates.slice(0, 3).map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 ${c.color}`}>
                          {c.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{c.module}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Calendar size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-400">{c.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connector */}
                {idx < demoStages.length - 1 && (
                  <div className="flex-shrink-0 flex items-center self-stretch px-1" style={{ minWidth: 32 }}>
                    <div className="w-full" style={{ height: 2, borderTop: `2px dashed ${demoStages[idx + 1].connectorColor}`, opacity: 0.6 }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Assessment lifecycle strip ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="frost-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Assessment Lifecycle</h2>
            <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {lifecycleStages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <div className="flex-shrink-0 text-center px-4 py-3 rounded-xl min-w-[120px]" style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>
                  <p className="text-xl font-bold" style={{ color: stage.color }}>{stage.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{stage.label}</p>
                </div>
                {idx < lifecycleStages.length - 1 && (
                  <div className="flex-shrink-0 w-6 flex items-center">
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Bottom: modules + recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment modules */}
        <div className="lg:col-span-2">
          <div className="frost-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Assessment Modules</h2>
              <Link to="/assessments" className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {defaultConfigs.map(cfg => {
                const Icon = moduleIcons[cfg.moduleId];
                const score = bestByModule[cfg.moduleId];
                return (
                  <Link key={cfg.id} to={`/assessments/${cfg.moduleId}`}>
                    <motion.div whileHover={{ x: 3 }}
                      className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer group"
                      style={{ backgroundColor: 'rgb(var(--color-bg))' }}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${moduleColors[cfg.moduleId]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{cfg.title}</p>
                          <span className={`text-sm font-bold ml-2 tabular-nums ${score !== undefined ? (score >= 70 ? 'text-emerald-500' : 'text-amber-500') : 'text-gray-400'}`}>
                            {score !== undefined ? `${score}%` : '—'}
                          </span>
                        </div>
                        <ProgressBar value={score ?? 0} size="xs" color={score !== undefined && score >= 70 ? 'green' : score !== undefined ? 'yellow' : 'brand'} />
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-gray-400">{cfg.totalQuestions} questions</span>
                          <span className="text-[11px] text-gray-400">·</span>
                          <span className="text-[11px] text-gray-400">{cfg.timeLimit} min</span>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="frost-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-2xl bg-frost-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Activity size={18} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No assessments yet</p>
                <Link to="/assessments">
                  <Button size="sm" variant="outline" className="mt-3">Start your first</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${moduleColors[s.moduleId]} flex items-center justify-center flex-shrink-0`}>
                      {React.createElement(moduleIcons[s.moduleId], { size: 13, className: 'text-white' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate capitalize">{s.moduleId}</p>
                      <p className="text-[10px] text-gray-400">{new Date(s.completedAt).toLocaleDateString()}</p>
                    </div>
                    <Badge color={s.passed ? 'green' : 'red'} size="sm">{s.score}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick start CTA */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-purple-700 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-brand-200" />
              <p className="font-semibold text-sm">Quick Start</p>
            </div>
            <p className="text-brand-100 text-xs mb-4 leading-relaxed">
              Begin with the Technical Assessment to establish your baseline score.
            </p>
            <Link to="/assessments/technical">
              <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30" iconRight={<ArrowRight size={13} />}>
                Start Technical
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
