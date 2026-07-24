import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Plus, ChevronLeft, ChevronRight,
  Code2, Brain, MessageCircle, Zap, Users,
  CheckCircle2, AlertCircle, XCircle, MoreHorizontal,
  Mail, Video,
} from 'lucide-react';

/* ─── data ──────────────────────────────────────── */
const avatarPalette = [
  'bg-accent-blue', 'bg-purple-400', 'bg-emerald-400',
  'bg-amber-400',   'bg-pink-400',   'bg-teal-400', 'bg-violet-400',
];

interface ScheduledItem {
  id:       string;
  initials: string;
  name:     string;
  role:     string;
  color:    string;
  module:   string;
  date:     string;
  time:     string;
  duration: string;
  mode:     'async' | 'live';
  status:   'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

const scheduleData: ScheduledItem[] = [
  { id: '1', initials: 'AL', name: 'Alex Lee',    role: 'Software Eng.',  color: avatarPalette[0], module: 'Technical',    date: 'Jun 14', time: '2:00 PM',  duration: '45 min', mode: 'async', status: 'scheduled'  },
  { id: '2', initials: 'PT', name: 'Priya T.',    role: 'DevOps Eng.',    color: avatarPalette[5], module: 'Psychometric', date: 'Jun 14', time: '4:30 PM',  duration: '30 min', mode: 'async', status: 'scheduled'  },
  { id: '3', initials: 'SK', name: 'Sara K.',     role: 'UX Designer',    color: avatarPalette[2], module: 'Communication',date: 'Jun 15', time: '10:00 AM', duration: '30 min', mode: 'live',  status: 'scheduled'  },
  { id: '4', initials: 'RC', name: 'Ryan C.',     role: 'Backend Eng.',   color: avatarPalette[3], module: 'Attitude',     date: 'Jun 15', time: '2:30 PM',  duration: '25 min', mode: 'async', status: 'scheduled'  },
  { id: '5', initials: 'MW', name: 'Maria W.',    role: 'Product Mgr.',   color: avatarPalette[4], module: 'Behavioral',   date: 'Jun 16', time: '11:00 AM', duration: '35 min', mode: 'async', status: 'scheduled'  },
  { id: '6', initials: 'HB', name: 'Henry B.',    role: 'Tech Lead',      color: avatarPalette[1], module: 'Technical',    date: 'Jun 12', time: '3:00 PM',  duration: '45 min', mode: 'live',  status: 'completed'  },
  { id: '7', initials: 'CC', name: 'Clara C.',    role: 'Ops Manager',    color: avatarPalette[4], module: 'Communication',date: 'Jun 12', time: '5:00 PM',  duration: '30 min', mode: 'async', status: 'completed'  },
  { id: '8', initials: 'JD', name: 'John D.',     role: 'Data Analyst',   color: avatarPalette[1], module: 'Technical',    date: 'Jun 11', time: '9:00 AM',  duration: '45 min', mode: 'async', status: 'no_show'    },
];

const moduleIconMap: Record<string, React.ElementType> = {
  Technical: Code2, Psychometric: Brain, Communication: MessageCircle, Behavioral: Users, Attitude: Zap,
};

const statusConfig = {
  scheduled:  { icon: Clock,        label: 'Scheduled',  color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20'     },
  completed:  { icon: CheckCircle2, label: 'Completed',  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  cancelled:  { icon: XCircle,      label: 'Cancelled',  color: 'text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20'       },
  no_show:    { icon: AlertCircle,  label: 'No Show',    color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
};

const tabs = ['Upcoming', 'Past', 'All'] as const;
type Tab = typeof tabs[number];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentDate = new Date('2026-06-14');

function buildWeekDates(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
};

/* ─── component ──────────────────────────────────── */
export default function RecruiterSchedule() {
  const [tab, setTab]     = useState<Tab>('Upcoming');
  const [weekOffset, setWeekOffset] = useState(0);

  const anchorDate = new Date(currentDate);
  anchorDate.setDate(currentDate.getDate() + weekOffset * 7);
  const weekDates = buildWeekDates(anchorDate);

  const filtered = scheduleData.filter(s => {
    if (tab === 'Upcoming') return s.status === 'scheduled';
    if (tab === 'Past')     return ['completed', 'cancelled', 'no_show'].includes(s.status);
    return true;
  });

  /* count per weekday label */
  const countByDate: Record<string, number> = {};
  scheduleData
    .filter(s => s.status === 'scheduled')
    .forEach(s => { countByDate[s.date] = (countByDate[s.date] ?? 0) + 1; });

  return (
    <div className="px-6 py-6 space-y-6 max-w-full">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and track assessment sessions</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={14} /> Schedule Assessment
        </button>
      </motion.div>

      {/* ── Week strip ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="frost-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-brand-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(o => o - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setWeekOffset(0)}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Today
              </button>
              <button onClick={() => setWeekOffset(o => o + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((d, i) => {
              const label = `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`;
              const isToday = d.toDateString() === currentDate.toDateString();
              const count = countByDate[label] ?? 0;
              return (
                <div key={i} className={`flex flex-col items-center p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isToday
                    ? 'bg-gray-900 dark:bg-white'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                  <p className={`text-[10px] font-semibold ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>{weekDays[i]}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-white dark:text-gray-900' : 'text-gray-800 dark:text-gray-200'}`}>
                    {d.getDate()}
                  </p>
                  {count > 0 && (
                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isToday ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    }`}>
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs + list ─────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >{t}</button>
        ))}
      </div>

      <motion.div variants={stagger.container} initial="initial" animate="animate">
        {filtered.length === 0 ? (
          <div className="frost-card p-12 text-center">
            <Calendar size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const ModIcon = moduleIconMap[item.module] ?? Code2;
              const sc = statusConfig[item.status];
              const StatusIcon = sc.icon;
              return (
                <motion.div key={item.id} variants={stagger.item}>
                  <div className="frost-card p-4 flex items-center gap-4 flex-wrap">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${item.color}`}>
                      {item.initials}
                    </div>

                    {/* Candidate info */}
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.role}</p>
                    </div>

                    {/* Module */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <ModIcon size={13} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.module}</span>
                    </div>

                    {/* Date & time */}
                    <div className="flex flex-col items-start gap-0.5 min-w-[130px]">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Calendar size={12} className="text-gray-400" /> {item.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={12} /> {item.time} · {item.duration}
                      </div>
                    </div>

                    {/* Mode */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-[80px]">
                      {item.mode === 'live' ? <Video size={13} /> : <Mail size={13} />}
                      {item.mode === 'live' ? 'Live session' : 'Async / Self-paced'}
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 ${sc.bg} ${sc.color}`}>
                      <StatusIcon size={12} /> {sc.label}
                    </div>

                    {/* Actions */}
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors flex-shrink-0">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
