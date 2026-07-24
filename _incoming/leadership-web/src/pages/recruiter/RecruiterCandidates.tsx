import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, ChevronDown, MoreHorizontal,
  Calendar, Mail, CheckCircle2, Clock,
  Code2, Brain, MessageCircle, Zap, Users,
  ArrowRight, Download,
} from 'lucide-react';

/* ─── data ──────────────────────────────────────── */
const avatarPalette = [
  'bg-accent-blue', 'bg-purple-400', 'bg-emerald-400',
  'bg-amber-400',   'bg-pink-400',   'bg-teal-400', 'bg-violet-400',
];

type Stage = 'Applied' | 'Screening' | 'In Assessment' | 'Under Review' | 'Decision';

interface Candidate {
  id:       string;
  initials: string;
  name:     string;
  role:     string;
  email:    string;
  stage:    Stage;
  color:    string;
  modules:  { name: string; score: number | null; status: 'done' | 'pending' | 'not_started' }[];
  appliedDate: string;
  avgScore: number | null;
}

const allCandidates: Candidate[] = [
  {
    id: '1', initials: 'HB', name: 'Henry B.',    role: 'Tech Lead',       email: 'henry@example.com',   stage: 'Under Review', color: avatarPalette[1],
    modules: [{ name: 'Technical', score: 91, status: 'done' }, { name: 'Behavioral', score: 78, status: 'done' }, { name: 'Communication', score: 82, status: 'done' }],
    appliedDate: 'Jun 1', avgScore: 84,
  },
  {
    id: '2', initials: 'FM', name: 'Felix M.',     role: 'Team Lead',       email: 'felix@example.com',   stage: 'Decision', color: avatarPalette[2],
    modules: [{ name: 'Technical', score: 88, status: 'done' }, { name: 'Behavioral', score: 85, status: 'done' }],
    appliedDate: 'May 28', avgScore: 87,
  },
  {
    id: '3', initials: 'OA', name: 'Olivia A.',    role: 'HR Manager',      email: 'olivia@example.com',  stage: 'In Assessment', color: avatarPalette[0],
    modules: [{ name: 'Behavioral', score: 85, status: 'done' }, { name: 'Psychometric', score: null, status: 'pending' }],
    appliedDate: 'Jun 3', avgScore: null,
  },
  {
    id: '4', initials: 'BN', name: 'Ben N.',        role: 'Software Eng.',   email: 'ben@example.com',     stage: 'In Assessment', color: avatarPalette[6],
    modules: [{ name: 'Technical', score: 78, status: 'done' }, { name: 'Attitude', score: null, status: 'pending' }],
    appliedDate: 'Jun 4', avgScore: null,
  },
  {
    id: '5', initials: 'CC', name: 'Clara C.',      role: 'Ops Manager',     email: 'clara@example.com',   stage: 'Under Review', color: avatarPalette[4],
    modules: [{ name: 'Communication', score: 74, status: 'done' }, { name: 'Behavioral', score: 69, status: 'done' }],
    appliedDate: 'May 30', avgScore: 72,
  },
  {
    id: '6', initials: 'SK', name: 'Sara K.',       role: 'UX Designer',     email: 'sara@example.com',    stage: 'Screening', color: avatarPalette[2],
    modules: [{ name: 'Communication', score: null, status: 'not_started' }],
    appliedDate: 'Jun 6', avgScore: null,
  },
  {
    id: '7', initials: 'PT', name: 'Priya T.',      role: 'DevOps Eng.',     email: 'priya@example.com',   stage: 'In Assessment', color: avatarPalette[5],
    modules: [{ name: 'Psychometric', score: 62, status: 'done' }, { name: 'Technical', score: null, status: 'pending' }],
    appliedDate: 'Jun 5', avgScore: null,
  },
  {
    id: '8', initials: 'AL', name: 'Alex Lee',      role: 'Software Eng.',   email: 'alex@example.com',    stage: 'Applied', color: avatarPalette[0],
    modules: [{ name: 'Technical', score: null, status: 'not_started' }],
    appliedDate: 'Jun 13', avgScore: null,
  },
  {
    id: '9', initials: 'RC', name: 'Ryan C.',        role: 'Backend Eng.',    email: 'ryan@example.com',    stage: 'Screening', color: avatarPalette[3],
    modules: [{ name: 'Attitude', score: null, status: 'not_started' }],
    appliedDate: 'Jun 9', avgScore: null,
  },
  {
    id: '10', initials: 'NG', name: 'Nina G.',       role: 'Analyst',         email: 'nina@example.com',    stage: 'Decision', color: avatarPalette[3],
    modules: [{ name: 'Psychometric', score: 79, status: 'done' }, { name: 'Behavioral', score: 82, status: 'done' }],
    appliedDate: 'Jun 1', avgScore: 81,
  },
];

const moduleIconMap: Record<string, React.ElementType> = {
  Technical: Code2, Psychometric: Brain, Communication: MessageCircle, Behavioral: Users, Attitude: Zap,
};

const stageColors: Record<Stage, string> = {
  'Applied':       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'Screening':     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'In Assessment': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Under Review':  'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'Decision':      'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const allStages: Stage[] = ['Applied', 'Screening', 'In Assessment', 'Under Review', 'Decision'];

/* ─── component ──────────────────────────────────── */
export default function RecruiterCandidates() {
  const [search, setSearch]     = useState('');
  const [stageFilter, setStage] = useState<Stage | 'All'>('All');
  const [expandedId, setExpand] = useState<string | null>(null);

  const filtered = allCandidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      || c.role.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="px-6 py-6 space-y-6 max-w-full">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Candidates</h1>
          <p className="text-sm text-gray-400 mt-0.5">{allCandidates.length} candidates in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={13} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={14} /> Add Candidate
          </button>
        </div>
      </motion.div>

      {/* ── Filters ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
          />
        </div>

        {/* Stage filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...allStages] as const).map(s => (
            <button key={s}
              onClick={() => setStage(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                stageFilter === s
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Table ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="frost-card overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_auto] gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            {['Candidate', 'Stage', 'Modules', 'Applied', ''].map(h => (
              <div key={h} className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {h} {h && h !== '' && <ChevronDown size={12} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No candidates found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filtered.map((c) => {
                const isExpanded = expandedId === c.id;
                const completedModules = c.modules.filter(m => m.status === 'done').length;
                return (
                  <React.Fragment key={c.id}>
                    <motion.div
                      className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_auto] gap-4 px-5 py-4 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setExpand(isExpanded ? null : c.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {/* Candidate */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${c.color}`}>
                          {c.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.role}</p>
                        </div>
                      </div>

                      {/* Stage */}
                      <div>
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${stageColors[c.stage]}`}>
                          {c.stage}
                        </span>
                      </div>

                      {/* Modules */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          {c.modules.map((m, mi) => {
                            const ModIcon = moduleIconMap[m.name] ?? Code2;
                            return (
                              <div key={mi} title={`${m.name}${m.score !== null ? `: ${m.score}%` : ''}`}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                  m.status === 'done'
                                    ? (m.score !== null && m.score >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
                                    : m.status === 'pending'
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                <ModIcon size={12} className={
                                  m.status === 'done'
                                    ? (m.score !== null && m.score >= 70 ? 'text-emerald-500' : 'text-amber-500')
                                    : m.status === 'pending'
                                    ? 'text-accent-blue'
                                    : 'text-gray-400'
                                } />
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-xs text-gray-400">{completedModules}/{c.modules.length}</span>
                      </div>

                      {/* Applied */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} className="text-gray-300" />
                        {c.appliedDate}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button title="Schedule" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-500 transition-colors">
                          <Calendar size={14} />
                        </button>
                        <button title="Email" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-500 transition-colors">
                          <Mail size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </motion.div>

                    {/* Expanded row */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30"
                      >
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{c.email}</span>
                          </div>
                          {c.avgScore !== null && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">Avg score: <strong>{c.avgScore}%</strong></span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 ml-auto">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                              <Clock size={12} /> Schedule Assessment
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition-opacity">
                              View Full Report <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Module scores */}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          {c.modules.map((m, mi) => {
                            const ModIcon = moduleIconMap[m.name] ?? Code2;
                            return (
                              <div key={mi} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>
                                <ModIcon size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{m.name}</span>
                                {m.score !== null
                                  ? <span className={`text-xs font-bold tabular-nums ml-1 ${m.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{m.score}%</span>
                                  : <span className="text-xs text-gray-400 ml-1">{m.status === 'pending' ? 'In progress' : 'Not started'}</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
