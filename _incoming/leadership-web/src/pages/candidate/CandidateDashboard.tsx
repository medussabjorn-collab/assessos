import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Clock, Target, TrendingUp,
  Code2, Users, Brain, MessageCircle, Zap, ChevronRight,
  Play, RotateCcw, Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentApi, type SessionResult } from '../../services/assessmentApi';
import { defaultConfigs } from '../../data/configs';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import type { AssessmentModuleId } from '../../types';

/* ─── constants ─────────────────────────────────── */
const moduleIcons: Record<AssessmentModuleId, typeof Brain> = {
  technical: Code2, attitude: Zap, behavioral: Users,
  psychometric: Brain, communication: MessageCircle,
};

const moduleGradients: Record<AssessmentModuleId, string> = {
  technical:     'from-blue-500 to-cyan-400',
  attitude:      'from-amber-400 to-orange-400',
  behavioral:    'from-emerald-500 to-teal-400',
  psychometric:  'from-purple-500 to-violet-400',
  communication: 'from-pink-500 to-rose-400',
};

const _moduleBg: Record<AssessmentModuleId, string> = {
  technical:     'bg-blue-50   dark:bg-blue-900/20',
  attitude:      'bg-amber-50  dark:bg-amber-900/20',
  behavioral:    'bg-emerald-50 dark:bg-emerald-900/20',
  psychometric:  'bg-purple-50 dark:bg-purple-900/20',
  communication: 'bg-pink-50   dark:bg-pink-900/20',
};

const journeyStages = [
  { id: 'applied',    label: 'Applied',    shortLabel: 'Applied'    },
  { id: 'screening',  label: 'Screening',  shortLabel: 'Screening'  },
  { id: 'assessment', label: 'Assessment', shortLabel: 'Assessment' },
  { id: 'review',     label: 'Review',     shortLabel: 'Review'     },
  { id: 'decision',   label: 'Decision',   shortLabel: 'Decision'   },
];

const CURRENT_STAGE_IDX = 2; // "Assessment" — where the demo candidate is

/* ─── helpers ────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } },
};

/* ─── component ──────────────────────────────────── */
export default function CandidateDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<SessionResult[]>([]);

  useEffect(() => {
    if (user) assessmentApi.getResults().then(r => setResults(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const bestByModule = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.moduleId] = Math.max(acc[r.moduleId] ?? 0, r.score);
    return acc;
  }, {});

  const completedModules = Object.keys(bestByModule).filter(k => (bestByModule[k] ?? 0) >= 70).length;
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const totalAttempts = results.length;
  const passRate = totalAttempts
    ? Math.round((results.filter(r => r.passed).length / totalAttempts) * 100)
    : 0;

  return (
    <div className="px-6 py-6 space-y-7 max-w-full">

      {/* ── Header ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="blue" size="md" dot>Active Candidate</Badge>
          <Link to="/candidate/assessments">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity">
              Start Assessment <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ── Stat strip ────────────────────────────── */}
      <motion.div
        variants={stagger.container} initial="initial" animate="animate"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { icon: CheckCircle2, label: 'Modules Passed',  value: `${completedModules}/5`, accent: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: TrendingUp,   label: 'Average Score',   value: `${avgScore}%`,          accent: 'text-accent-blue', bg: 'bg-blue-50 dark:bg-blue-900/20'     },
          { icon: Target,       label: 'Pass Rate',       value: `${passRate}%`,          accent: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: Clock,        label: 'Attempts',        value: totalAttempts,            accent: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
        ].map(s => (
          <motion.div key={s.label} variants={stagger.item}>
            <div className="frost-card p-5 h-full">
              <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-3`}>
                <s.icon size={16} className={s.accent} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Your Journey ──────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="frost-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Your Hiring Journey</h2>
              <p className="text-xs text-gray-400 mt-0.5">Current stage: <span className="font-medium text-gray-700 dark:text-gray-300">{journeyStages[CURRENT_STAGE_IDX].label}</span></p>
            </div>
            <Badge color="blue" size="sm" dot>In Progress</Badge>
          </div>

          {/* Stage steps */}
          <div className="relative flex items-center gap-0">
            {journeyStages.map((stage, idx) => {
              const done    = idx < CURRENT_STAGE_IDX;
              const current = idx === CURRENT_STAGE_IDX;
              const _future  = idx > CURRENT_STAGE_IDX;
              return (
                <React.Fragment key={stage.id}>
                  {/* Step node */}
                  <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 72 }}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      done    ? 'bg-emerald-500 border-emerald-500'
                      : current ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      {done
                        ? <CheckCircle2 size={16} className="text-white" />
                        : current
                          ? <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-900" />
                          : <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      }
                    </div>
                    <p className={`text-[10px] font-semibold mt-1.5 text-center leading-tight ${
                      done ? 'text-emerald-500' : current ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                    }`}>{stage.shortLabel}</p>
                  </div>

                  {/* Connector */}
                  {idx < journeyStages.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 rounded-full" style={{
                      backgroundColor: done ? '#10b981' : '#e5e7eb',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgb(var(--color-border))' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Overall progress</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{Math.round((CURRENT_STAGE_IDX / (journeyStages.length - 1)) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.round((CURRENT_STAGE_IDX / (journeyStages.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Assessment Modules ────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="frost-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Assessment Modules</h2>
            <Link to="/candidate/assessments" className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {defaultConfigs.map((cfg, idx) => {
              const Icon  = moduleIcons[cfg.moduleId];
              const score = bestByModule[cfg.moduleId];
              const done  = score !== undefined && score >= cfg.passingScore;
              const tried = score !== undefined;

              return (
                <motion.div
                  key={cfg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + idx * 0.05 }}
                >
                  <Link to={`/candidate/assessments/${cfg.moduleId}`}>
                    <div className="group rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      style={{ backgroundColor: 'rgb(var(--color-bg))', border: '1px solid rgb(var(--color-border))' }}>
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${moduleGradients[cfg.moduleId]} flex items-center justify-center mb-3 shadow-sm`}>
                        <Icon size={18} className="text-white" />
                      </div>

                      {/* Name */}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize mb-1">{cfg.moduleId}</p>
                      <p className="text-[10px] text-gray-400 mb-3">{cfg.totalQuestions}Q · {cfg.timeLimit}min</p>

                      {/* Score / status */}
                      {tried ? (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-bold tabular-nums ${done ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {score}%
                            </span>
                            <Badge color={done ? 'green' : 'yellow'} size="sm">{done ? 'Pass' : 'Fail'}</Badge>
                          </div>
                          <ProgressBar value={score} size="xs" color={done ? 'green' : 'yellow'} />
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-400 font-medium">Not started</span>
                        </div>
                      )}

                      {/* CTA */}
                      <div className={`mt-3 flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                        done ? 'text-emerald-500' : tried ? 'text-amber-500' : 'text-brand-600'
                      }`}>
                        {done
                          ? <><CheckCircle2 size={11} /> Completed</>
                          : tried
                          ? <><RotateCcw size={11} /> Retake</>
                          : <><Play size={11} /> Start</>
                        }
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Bottom row: recent + tips ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 frost-card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Results</h2>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-frost-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Target size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No assessments taken yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Complete your first module to see results here.</p>
              <Link to="/candidate/assessments">
                <button className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition-opacity">
                  Take your first assessment
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {results.slice(0, 5).map(r => {
                const Icon = moduleIcons[r.moduleId];
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${moduleGradients[r.moduleId]} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={13} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{r.moduleId}</p>
                      <p className="text-[10px] text-gray-400">{new Date(r.completedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${r.passed ? 'text-emerald-500' : 'text-red-500'}`}>{r.score}%</p>
                      <p className={`text-[10px] font-medium ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>{r.passed ? 'Passed' : 'Failed'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips / Quick start */}
        <div className="space-y-4">
          {/* Recommended next */}
          <div className="frost-card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recommended Next</p>
            {defaultConfigs.filter(c => !bestByModule[c.moduleId]).slice(0, 1).map(cfg => {
              const Icon = moduleIcons[cfg.moduleId];
              return (
                <Link key={cfg.id} to={`/candidate/assessments/${cfg.moduleId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-frost-100 dark:hover:bg-gray-800">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${moduleGradients[cfg.moduleId]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{cfg.moduleId}</p>
                      <p className="text-xs text-gray-400">{cfg.totalQuestions} questions · {cfg.timeLimit} min</p>
                    </div>
                    <ArrowRight size={15} className="text-gray-300 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
            {defaultConfigs.every(c => bestByModule[c.moduleId] !== undefined) && (
              <p className="text-sm text-emerald-500 font-medium">All modules attempted!</p>
            )}
          </div>

          {/* Tip card */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-purple-700 text-white">
            <p className="text-xs font-bold text-brand-200 uppercase tracking-wide mb-2">Pro Tip</p>
            <p className="text-sm font-semibold mb-1">Complete all 5 modules</p>
            <p className="text-xs text-brand-100 leading-relaxed">
              Candidates who finish all modules get their results reviewed 2× faster on average.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-brand-200 font-medium">
              <Lock size={11} /> Results reviewed after completion
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
