import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, ClipboardCheck, UserCheck,
  Calendar, MoreHorizontal, ChevronRight, Plus,
  Clock, CheckCircle2, AlertCircle, XCircle, ArrowRight,
  Code2, Brain, MessageCircle, Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Link } from 'react-router-dom';

/* ─── demo data ──────────────────────────────────── */
const avatarPalette = [
  'bg-accent-blue', 'bg-purple-400', 'bg-emerald-400',
  'bg-amber-400',   'bg-pink-400',   'bg-teal-400', 'bg-violet-400',
];

const pipeline = [
  {
    id: 'applied', label: 'Applied', color: '#9ca3af', count: 3,
    candidates: [
      { initials: 'AL', name: 'Alex Lee',    role: 'Software Eng.',  module: 'Technical',    date: 'Jun 13', color: avatarPalette[0], score: null  },
      { initials: 'MW', name: 'Maria W.',    role: 'Product Mgr.',   module: 'Behavioral',   date: 'Jun 12', color: avatarPalette[4], score: null  },
      { initials: 'JD', name: 'John D.',     role: 'Data Analyst',   module: 'Technical',    date: 'Jun 12', color: avatarPalette[1], score: null  },
    ],
  },
  {
    id: 'screening', label: 'Screening', color: '#5b8def', count: 2,
    candidates: [
      { initials: 'SK', name: 'Sara K.',     role: 'UX Designer',    module: 'Communication', date: 'Jun 11', color: avatarPalette[2], score: null  },
      { initials: 'RC', name: 'Ryan C.',     role: 'Backend Eng.',   module: 'Attitude',      date: 'Jun 10', color: avatarPalette[3], score: null  },
    ],
  },
  {
    id: 'assessment', label: 'In Assessment', color: '#f59e0b', count: 3,
    candidates: [
      { initials: 'PT', name: 'Priya T.',    role: 'DevOps Eng.',    module: 'Psychometric',  date: 'Jun 9',  color: avatarPalette[5], score: 62    },
      { initials: 'BN', name: 'Ben N.',      role: 'Software Eng.',  module: 'Technical',     date: 'Jun 9',  color: avatarPalette[6], score: 78    },
      { initials: 'OA', name: 'Olivia A.',   role: 'HR Manager',     module: 'Behavioral',    date: 'Jun 8',  color: avatarPalette[0], score: 85    },
    ],
  },
  {
    id: 'review', label: 'Under Review', color: '#8b5cf6', count: 2,
    candidates: [
      { initials: 'HB', name: 'Henry B.',    role: 'Tech Lead',      module: 'Technical',     date: 'Jun 7',  color: avatarPalette[1], score: 91    },
      { initials: 'CC', name: 'Clara C.',    role: 'Ops Manager',    module: 'Communication', date: 'Jun 6',  color: avatarPalette[4], score: 74    },
    ],
  },
  {
    id: 'decision', label: 'Decision', color: '#10b981', count: 2,
    candidates: [
      { initials: 'FM', name: 'Felix M.',    role: 'Team Lead',      module: 'Behavioral',    date: 'Jun 5',  color: avatarPalette[2], score: 88    },
      { initials: 'NG', name: 'Nina G.',     role: 'Analyst',        module: 'Psychometric',  date: 'Jun 4',  color: avatarPalette[3], score: 79    },
    ],
  },
];

const upcomingSchedule = [
  { name: 'Alex Lee',  initials: 'AL', color: avatarPalette[0], module: 'Technical',    time: 'Today, 2:00 PM',    duration: '45 min' },
  { name: 'Priya T.',  initials: 'PT', color: avatarPalette[5], module: 'Psychometric', time: 'Today, 4:30 PM',    duration: '30 min' },
  { name: 'Sara K.',   initials: 'SK', color: avatarPalette[2], module: 'Communication',time: 'Tomorrow, 10:00 AM', duration: '30 min' },
];

const moduleIconMap: Record<string, React.ElementType> = {
  Technical: Code2, Psychometric: Brain, Communication: MessageCircle, Behavioral: Users, Attitude: Zap,
};

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

/* ─── component ──────────────────────────────────── */
export default function RecruiterDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const totalCandidates = pipeline.reduce((s, col) => s + col.count, 0);
  const inAssessment    = pipeline.find(p => p.id === 'assessment')?.count ?? 0;
  const completed       = pipeline.filter(p => ['review', 'decision'].includes(p.id)).reduce((s, c) => s + c.count, 0);
  const hireRate        = 42;

  const stats = [
    { icon: Users,         label: 'Active Candidates',     value: totalCandidates, accent: 'text-accent-blue',   bg: 'bg-blue-50 dark:bg-blue-900/20',     sub: 'Across all stages'    },
    { icon: ClipboardCheck,label: 'Assessments Sent',      value: 14,              accent: 'text-amber-500',     bg: 'bg-amber-50 dark:bg-amber-900/20',   sub: 'This month'           },
    { icon: CheckCircle2,  label: 'Assessments Completed', value: inAssessment + completed, accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: `${inAssessment} in progress`  },
    { icon: UserCheck,     label: 'Hire Rate',             value: `${hireRate}%`,  accent: 'text-purple-500',    bg: 'bg-purple-50 dark:bg-purple-900/20', sub: 'Last 90 days'         },
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
          <Badge color="indigo" size="md" dot>TA Manager</Badge>
          <Link to="/recruiter/candidates">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus size={14} /> Add Candidate
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ── Stat strip ──────────────────────────────── */}
      <motion.div variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
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

      {/* ── Pipeline Kanban ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="frost-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Candidate Pipeline</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalCandidates} candidates across {pipeline.length} stages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/recruiter/candidates">
                <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </button>
              </Link>
              <button className="rail-btn"><MoreHorizontal size={16} /></button>
            </div>
          </div>

          {/* Columns */}
          <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-none">
            {pipeline.map((col) => (
              <div key={col.id}
                className="flex-shrink-0 w-52 rounded-2xl p-4"
                style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>

                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{col.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col.color }}>
                    {col.count}
                  </span>
                </div>

                {/* Candidate cards */}
                <div className="space-y-2">
                  {col.candidates.map((c, ci) => {
                    const ModIcon = moduleIconMap[c.module] ?? Code2;
                    return (
                      <div key={ci} className="group flex flex-col gap-1.5 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                        {/* Name row */}
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${c.color}`}>
                            {c.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{c.role}</p>
                          </div>
                        </div>

                        {/* Module + score row */}
                        <div className="flex items-center justify-between ml-9">
                          <div className="flex items-center gap-1">
                            <ModIcon size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="text-[10px] text-gray-400 truncate">{c.module}</span>
                          </div>
                          {c.score !== null && (
                            <span className={`text-[10px] font-bold tabular-nums ${c.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {c.score}%
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1 ml-9">
                          <Calendar size={9} className="text-gray-300" />
                          <span className="text-[9px] text-gray-400">{c.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add to column */}
                <button className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                  <Plus size={11} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Bottom row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming schedule */}
        <div className="lg:col-span-2 frost-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Assessments</h2>
            </div>
            <Link to="/recruiter/schedule">
              <button className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                Full schedule <ArrowRight size={12} />
              </button>
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingSchedule.map((s, i) => {
              const ModIcon = moduleIconMap[s.module] ?? Code2;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${s.color}`}>
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ModIcon size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{s.module}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Clock size={11} className="text-brand-500" />
                      {s.time}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.duration}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions + status summary */}
        <div className="space-y-4">
          {/* Status summary */}
          <div className="frost-card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Pipeline Status</h2>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle2, label: 'Completed today',  value: 2,  color: 'text-emerald-500' },
                { icon: Clock,        label: 'In assessment',    value: 3,  color: 'text-amber-500'   },
                { icon: AlertCircle,  label: 'Awaiting invite',  value: 5,  color: 'text-brand-500'   },
                { icon: XCircle,      label: 'Did not complete', value: 1,  color: 'text-red-400'     },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                  <item.icon size={14} className={item.color} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick tip */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-2">Insight</p>
            <p className="text-sm font-semibold mb-1">3 candidates ready for review</p>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Henry B., Clara C. and Olivia A. have completed all required modules.
            </p>
            <Link to="/recruiter/reports">
              <button className="mt-3 flex items-center gap-1 text-xs text-indigo-200 font-medium hover:text-white transition-colors">
                View reports <ArrowRight size={11} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
