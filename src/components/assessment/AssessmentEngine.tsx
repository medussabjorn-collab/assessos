import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, Send, Eye, EyeOff, Camera, CameraOff, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentApi } from '../../services/assessmentApi';
import { getRandomQuestions } from '../../data/questions';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { ProctoringPanel } from './ProctoringPanel';
import { CodeEditor } from './CodeEditor';
import type { AssessmentConfig, Question, AssessmentSession } from '../../types';

interface Props {
  config: AssessmentConfig;
  onComplete: (session: AssessmentSession) => void;
}

export function AssessmentEngine({ config, onComplete }: Props) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const questions = useMemo(() =>
    getRandomQuestions(config.moduleId, config.totalQuestions),
    [config.moduleId, config.totalQuestions]
  );

  const [session, setSession]   = useState<AssessmentSession | null>(null);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(config.timeLimit * 60);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(config.proctoring);
  const [proctoringWarnings, setProctoringWarnings] = useState(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flagged.size;

  // Start backend session on mount
  useEffect(() => {
    assessmentApi.startSession(config.moduleId).then(res => {
      setBackendSessionId(res.data.sessionId);
    }).catch(() => { /* backend offline — local-only mode */ });
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [config.moduleId]);

  const handleAnswer = useCallback((questionId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
    if (backendSessionId) {
      assessmentApi.submitAnswer(backendSessionId, questionId, optionIdx, flagged.has(questionId)).catch(() => {});
    }
  }, [backendSessionId, flagged]);

  const toggleFlag = useCallback((questionId: string) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Local score calculation for immediate UI feedback
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const localScore = questions.reduce((sum, q) => {
      const chosen = answers[q.id];
      return sum + (chosen === q.correctIndex ? q.points : 0);
    }, 0);
    const percentage = Math.round((localScore / totalPoints) * 100);

    const completed: AssessmentSession = {
      ...(session ?? { id: crypto.randomUUID(), userId: user!.id, configId: config.id, moduleId: config.moduleId, status: 'active', startedAt: new Date().toISOString(), questionOrder: questions.map(q => q.id), currentQuestionIndex: 0, proctorEvents: [], flaggedQuestions: [] }),
      answers,
      flaggedQuestions: [...flagged],
      timeSpent: Math.round((Date.now() - startTime.current) / 1000),
      score: localScore,
      percentage,
      passed: percentage >= config.passingScore,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    // Fire-and-forget backend grading
    if (backendSessionId) {
      assessmentApi.submitSession(backendSessionId).catch(() => {});
    }

    onComplete(completed);
  }, [session, backendSessionId, answers, flagged, questions, config, user, onComplete]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeWarning = timeLeft < 300;
  const timeCritical = timeLeft < 60;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm text-gray-900 dark:text-white hidden sm:block truncate max-w-48">{config.title}</span>
            <Badge color={isOnline ? 'green' : 'yellow'} size="sm" dot>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {config.proctoring && (
              <Badge color={proctoringActive ? 'red' : 'gray'} size="sm" dot>
                {proctoringActive ? 'AI Watch' : 'Proctoring Off'}
              </Badge>
            )}
          </div>

          {/* Timer */}
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-base font-bold tabular-nums',
            timeCritical ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' :
            timeWarning  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
          )}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2">
            <Button size="xs" variant="ghost" onClick={() => setShowNav(v => !v)}>
              <Eye size={14} /> Navigator
            </Button>
            <Button size="xs" variant="danger" onClick={() => setShowSubmit(true)} icon={<Send size={14} />}>
              Submit
            </Button>
          </div>
        </div>
        {/* Progress */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
          <ProgressBar value={answeredCount} max={questions.length} size="xs" animated={false} />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{answeredCount}/{questions.length} answered</span>
            <span>{flaggedCount} flagged</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Main question area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Question header */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Question {currentIdx + 1} / {questions.length}
                  </span>
                  <Badge color={currentQ.difficulty === 'hard' ? 'red' : currentQ.difficulty === 'medium' ? 'yellow' : 'green'} size="sm">
                    {currentQ.difficulty}
                  </Badge>
                  <Badge color="gray" size="sm">{currentQ.points}pt{currentQ.points > 1 ? 's' : ''}</Badge>
                </div>
                <button onClick={() => toggleFlag(currentQ.id)}
                  className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors',
                    flagged.has(currentQ.id)
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-yellow-50'
                  )}>
                  <Flag size={13} fill={flagged.has(currentQ.id) ? 'currentColor' : 'none'} />
                  {flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Question text */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-4 shadow-card">
                <p className="text-gray-900 dark:text-white text-lg leading-relaxed font-medium">{currentQ.text}</p>
                {currentQ.codeSnippet && (
                  <pre className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                    {currentQ.codeSnippet}
                  </pre>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((opt, idx) => {
                  const selected = answers[currentQ.id] === idx;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.998 }}
                      onClick={() => handleAnswer(currentQ.id, idx)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-start gap-3',
                        selected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-600'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                      )}>
                      <span className={cn(
                        'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 transition-all',
                        selected
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-500'
                      )}>
                        {selected ? <CheckCircle2 size={14} fill="white" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span className={cn('text-sm leading-relaxed',
                        selected ? 'text-brand-700 dark:text-brand-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {opt}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Code editor for technical module */}
              {config.moduleId === 'technical' && config.availableLanguages.length > 0 && (
                <CodeEditor availableLanguages={config.availableLanguages} />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0} icon={<ChevronLeft size={16} />}>
                  Previous
                </Button>
                <span className="text-sm text-gray-400">{currentIdx + 1} / {questions.length}</span>
                {currentIdx < questions.length - 1 ? (
                  <Button onClick={() => setCurrentIdx(i => i + 1)} iconRight={<ChevronRight size={16} />}>
                    Next
                  </Button>
                ) : (
                  <Button variant="success" onClick={() => setShowSubmit(true)} icon={<Send size={16} />}>
                    Submit
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar: Question navigator + Proctoring */}
        <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
          {/* Question grid */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Question Navigator</p>
            <div className="grid grid-cols-7 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIdx;
                return (
                  <button key={q.id} onClick={() => setCurrentIdx(idx)}
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      isCurrent  ? 'ring-2 ring-brand-500 bg-brand-500 text-white' :
                      isFlagged  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      isAnswered ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30" />Answered</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/30" />Flagged</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />Unanswered</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-500" />Current</div>
            </div>
          </div>

          {/* Proctoring */}
          {config.proctoring && (
            <ProctoringPanel
              sessionId={backendSessionId ?? session?.id ?? 'local'}
              active={proctoringActive}
              onToggle={() => setProctoringActive(v => !v)}
              onWarning={() => setProctoringWarnings(w => w + 1)}
            />
          )}

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            {[
              { label: 'Answered', value: answeredCount, max: questions.length, color: 'green' as const },
              { label: 'Unanswered', value: questions.length - answeredCount, max: questions.length, color: 'red' as const },
              { label: 'Flagged', value: flaggedCount, max: questions.length, color: 'yellow' as const },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{s.label}</span><span className="font-medium">{s.value}</span>
                </div>
                <ProgressBar value={s.value} max={s.max} size="xs" color={s.color} animated={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Assessment"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSubmit(false)}>Review Answers</Button>
            <Button variant="success" onClick={() => handleSubmit()} icon={<Send size={16} />}>Confirm Submit</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You cannot change answers after submitting.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Answered', value: answeredCount, color: 'text-emerald-600' },
              { label: 'Unanswered', value: questions.length - answeredCount, color: 'text-red-500' },
              { label: 'Flagged', value: flaggedCount, color: 'text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
