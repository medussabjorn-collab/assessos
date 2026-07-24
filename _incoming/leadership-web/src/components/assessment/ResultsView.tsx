import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, RotateCcw, LayoutDashboard, CheckCircle2, XCircle, Clock, Target, AlertTriangle, Download } from 'lucide-react';
import { Button } from '../common/Button';
import { Card, CardHeader, CardTitle } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import type { AssessmentSession, AssessmentConfig } from '../../types';

interface Props {
  session: AssessmentSession;
  config: AssessmentConfig;
  onRetake: () => void;
}

export function ResultsView({ session, config, onRetake }: Props) {
  const pct = session.percentage ?? 0;
  const passed = pct >= config.passingScore;
  const timeMinutes = Math.floor((session.timeSpent ?? 0) / 60);
  const timeSecs = (session.timeSpent ?? 0) % 60;

  const getScoreColor = () => pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500';
  const getGrade = () => pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Result hero */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-8 text-center relative overflow-hidden ${
          passed
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {passed ? <Trophy size={36} className="text-white" /> : <Target size={36} className="text-white" />}
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-1">
          {passed ? 'Congratulations!' : 'Keep Practicing'}
        </h1>
        <p className="text-white/80 mb-6">{config.title}</p>
        <div className="flex items-center justify-center gap-6">
          <div>
            <p className="text-5xl font-bold text-white tabular-nums">{pct}%</p>
            <p className="text-white/70 text-sm mt-1">Score</p>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div>
            <p className="text-4xl font-bold text-white">{getGrade()}</p>
            <p className="text-white/70 text-sm mt-1">Grade</p>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div>
            <Badge color={passed ? 'green' : 'red'} size="md"
              className={passed ? 'bg-white/20 text-white border-0' : 'bg-white/20 text-white border-0'}>
              {passed ? 'PASSED' : 'FAILED'}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, label: 'Answered', value: Object.keys(session.answers).length, color: 'text-emerald-600' },
          { icon: XCircle, label: 'Unanswered', value: config.totalQuestions - Object.keys(session.answers).length, color: 'text-red-500' },
          { icon: Clock, label: 'Time Used', value: `${timeMinutes}m ${timeSecs}s`, color: 'text-blue-600' },
          { icon: AlertTriangle, label: 'Flags', value: session.flaggedQuestions.length, color: 'text-yellow-600' },
        ].map(s => (
          <Card key={s.label} padding="sm" className="text-center">
            <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Score breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <span className={`text-2xl font-bold tabular-nums ${getScoreColor()}`}>{session.score ?? 0} pts</span>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Your Score</span>
                <span className="font-semibold text-gray-900 dark:text-white">{pct}%</span>
              </div>
              <ProgressBar value={pct} size="md" color={passed ? 'green' : pct >= 50 ? 'yellow' : 'red'} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Passing Threshold</span>
                <span className="font-semibold text-gray-900 dark:text-white">{config.passingScore}%</span>
              </div>
              <ProgressBar value={config.passingScore} size="md" color="brand" animated={false} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* AI Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border-brand-200 dark:border-brand-800">
          <CardHeader>
            <CardTitle className="text-brand-700 dark:text-brand-300">AI Performance Insights</CardTitle>
          </CardHeader>
          <ul className="space-y-2 text-sm text-brand-700 dark:text-brand-300">
            {pct >= 80 && <li>✦ Excellent performance — you demonstrate strong proficiency in this domain.</li>}
            {pct >= 60 && pct < 80 && <li>✦ Good foundation identified. Focus on edge-case scenarios and advanced topics.</li>}
            {pct < 60 && <li>✦ Additional study recommended. Review core concepts and practice regularly.</li>}
            {session.flaggedQuestions.length > 5 && <li>✦ High number of flagged questions suggests uncertainty — consider structured review sessions.</li>}
            {timeMinutes < config.timeLimit * 0.4 && <li>✦ Rapid completion detected — ensure adequate review time in future attempts.</li>}
            <li>✦ Complete remaining assessment modules to build a comprehensive leadership profile.</li>
          </ul>
        </Card>
      </motion.div>

      {/* Proctoring events */}
      {session.proctorEvents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Proctoring Report</CardTitle>
              <Badge color={session.proctorEvents.filter(e => e.type === 'violation').length > 0 ? 'red' : 'yellow'} size="sm">
                {session.proctorEvents.length} events
              </Badge>
            </CardHeader>
            <div className="space-y-2">
              {session.proctorEvents.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <AlertTriangle size={14} className={e.severity === 'high' ? 'text-red-500' : 'text-yellow-500'} />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{e.message}</p>
                    <p className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" fullWidth onClick={onRetake} icon={<RotateCcw size={16} />}>
          Retake Assessment
        </Button>
        <Link to="/results" className="flex-1">
          <Button fullWidth icon={<Download size={16} />}>
            View Full Report
          </Button>
        </Link>
        <Link to="/dashboard" className="flex-1">
          <Button variant="secondary" fullWidth icon={<LayoutDashboard size={16} />}>
            Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
