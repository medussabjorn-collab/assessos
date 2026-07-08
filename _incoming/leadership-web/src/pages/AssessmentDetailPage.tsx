import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Clock, HelpCircle, Target, Play, ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { defaultConfigs } from '../data/configs';
import { AssessmentEngine } from '../components/assessment/AssessmentEngine';
import { ResultsView } from '../components/assessment/ResultsView';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import type { AssessmentModuleId, AssessmentSession } from '../types';

type PageState = 'instructions' | 'active' | 'results';

export default function AssessmentDetailPage() {
  const { moduleId } = useParams<{ moduleId: AssessmentModuleId }>();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('instructions');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [agreed, setAgreed] = useState(false);

  const config = defaultConfigs.find(c => c.moduleId === moduleId);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-96 text-gray-500">
        Assessment not found.
      </div>
    );
  }

  if (pageState === 'active') {
    return (
      <AssessmentEngine
        config={config}
        onComplete={s => { setSession(s); setPageState('results'); }}
      />
    );
  }

  if (pageState === 'results' && session) {
    return <ResultsView session={session} config={config} onRetake={() => setPageState('instructions')} />;
  }

  // Instructions
  const rules = [
    'Ensure you have a stable internet connection before starting.',
    'AI-powered proctoring will monitor your session via webcam.',
    'Do not switch browser tabs or applications during the assessment.',
    'Each question has a designated point value — answer strategically.',
    config.negativeMarking ? `Negative marking applies: ${config.negativeMarkingValue} points deducted per wrong answer.` : 'No negative marking — attempt all questions.',
    'Your progress is automatically saved for offline resilience.',
    `You have ${config.timeLimit} minutes to complete ${config.totalQuestions} questions.`,
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/assessments')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to Assessments
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{config.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{config.description}</p>
          </div>
          <Badge color="green" size="md" dot>Active</Badge>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: HelpCircle, label: 'Questions', value: config.totalQuestions },
          { icon: Clock, label: 'Time Limit', value: `${config.timeLimit} min` },
          { icon: Target, label: 'Pass Score', value: `${config.passingScore}%` },
          { icon: Shield, label: 'Points Each', value: `${config.pointsPerQuestion} pts` },
        ].map(s => (
          <Card key={s.label} padding="sm" className="text-center">
            <s.icon size={18} className="text-brand-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Instructions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Instructions
          </h2>
          <ul className="space-y-3">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      {/* Features */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2">
        {config.proctoring && <Badge color="purple" size="md">AI Proctoring Active</Badge>}
        {config.offlineMode && <Badge color="blue" size="md">Offline Capable</Badge>}
        {config.shuffleQuestions && <Badge color="gray" size="md">Questions Shuffled</Badge>}
        {config.allowReview && <Badge color="green" size="md">Review Allowed</Badge>}
        {config.availableLanguages.length > 0 && <Badge color="indigo" size="md">Live Code Editor</Badge>}
      </motion.div>

      {/* Consent */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <label className="flex items-start gap-3 cursor-pointer select-none p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            I have read and understand the instructions. I agree that this assessment will be monitored and recorded for integrity purposes. I confirm this is my own work.
          </span>
        </label>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Button size="xl" fullWidth disabled={!agreed} onClick={() => setPageState('active')}
          icon={<Play size={20} />}>
          Begin Assessment
        </Button>
      </motion.div>
    </div>
  );
}
