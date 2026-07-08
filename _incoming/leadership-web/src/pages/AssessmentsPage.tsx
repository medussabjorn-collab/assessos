import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Brain, Users, Zap, MessageCircle, Clock, HelpCircle, Trophy, ChevronRight, Play, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { defaultConfigs } from '../data/configs';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { AssessmentModuleId } from '../types';

const moduleIcons: Record<AssessmentModuleId, LucideIcon> = {
  technical: Code2, attitude: Zap, behavioral: Users,
  psychometric: Brain, communication: MessageCircle,
};

const moduleGradients: Record<AssessmentModuleId, string> = {
  technical:     'from-blue-500 to-cyan-600',
  attitude:      'from-amber-500 to-orange-600',
  behavioral:    'from-emerald-500 to-teal-600',
  psychometric:  'from-purple-500 to-violet-600',
  communication: 'from-pink-500 to-rose-600',
};

const moduleDescriptions: Record<AssessmentModuleId, string> = {
  technical:     'Programming fundamentals, algorithms, system design & live coding',
  attitude:      'Professional values, work ethics, adaptability & growth mindset',
  behavioral:    'STAR-based situational judgment & leadership behaviors',
  psychometric:  'Cognitive aptitude, logical reasoning & abstract thinking',
  communication: 'Written, verbal & cross-cultural communication effectiveness',
};

export default function AssessmentsPage() {
  const { t } = useTranslation();

  // Per-module status is now derived from results fetched on ResultsPage/DashboardPage;
  // here we just show "Start" / "Retake" based on local nav context.
  const getSessionStatus = (_moduleId: AssessmentModuleId): { best?: { percentage: number }; active?: boolean } | null => null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.assessments')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a module to begin your leadership evaluation</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {defaultConfigs.map((cfg, i) => {
          const Icon = moduleIcons[cfg.moduleId];
          const gradient = moduleGradients[cfg.moduleId];
          const status = getSessionStatus(cfg.moduleId);

          return (
            <motion.div key={cfg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Card hover className="h-full flex flex-col">
                {/* Module header */}
                <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 mb-4 relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="absolute -right-2 bottom-2 w-12 h-12 bg-white/10 rounded-full" />
                  <div className="flex items-start justify-between">
                    <Icon size={28} className="text-white" />
                    {status?.best && (
                      <Badge color="green" size="sm" className="bg-white/20 text-white border-0">
                        <Trophy size={11} /> {status.best.percentage}%
                      </Badge>
                    )}
                    {status?.active && (
                      <Badge color="yellow" size="sm" className="bg-white/20 text-white border-0">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg mt-3 leading-tight">{cfg.title}</h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                  {moduleDescriptions[cfg.moduleId]}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <HelpCircle size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cfg.totalQuestions}</p>
                    <p className="text-[10px] text-gray-400">questions</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Clock size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cfg.timeLimit}</p>
                    <p className="text-[10px] text-gray-400">minutes</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Trophy size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cfg.passingScore}%</p>
                    <p className="text-[10px] text-gray-400">to pass</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cfg.proctoring && <Badge color="purple" size="sm">AI Proctored</Badge>}
                  {cfg.offlineMode && <Badge color="blue" size="sm">Offline Ready</Badge>}
                  {cfg.availableLanguages.length > 0 && <Badge color="indigo" size="sm">Live Editor</Badge>}
                  {cfg.negativeMarking && <Badge color="yellow" size="sm">−{cfg.negativeMarkingValue} Penalty</Badge>}
                </div>

                <Link to={`/assessments/${cfg.moduleId}`}>
                  <Button fullWidth variant={status?.active ? 'secondary' : 'primary'}
                    icon={status?.active ? <Play size={16} /> : undefined}
                    iconRight={<ChevronRight size={16} />}>
                    {status?.active ? 'Resume Assessment' : status?.best ? 'Retake Assessment' : 'Start Assessment'}
                  </Button>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
