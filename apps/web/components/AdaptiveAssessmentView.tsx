'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface QuestionOption {
  index: number;
  text: string;
}

interface AdaptiveQuestion {
  _id: string;
  text: string;
  options: QuestionOption[];
  subTopic?: string;
}

interface Ability {
  theta: number;
  se: number;
  tier: string;
}

interface Progress {
  answered: number;
  total: number;
}

interface AdaptiveAssessmentViewProps {
  sessionId: string;
  moduleId: string;
  initialQuestion: AdaptiveQuestion;
  initialProgress: Progress;
  initialAbility: Ability;
}

interface FinalResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  ability: Ability;
}

export default function AdaptiveAssessmentView({
  sessionId,
  moduleId,
  initialQuestion,
  initialProgress,
  initialAbility,
}: AdaptiveAssessmentViewProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState(initialQuestion);
  const [progress, setProgress] = useState(initialProgress);
  const [ability, setAbility] = useState(initialAbility);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeStarted, setTimeStarted] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinalResult | null>(null);

  const submitAnswer = async () => {
    if (selectedIndex == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const timeTakenSec = Math.round((Date.now() - timeStarted) / 1000);
      const res = await api.post(`/api/assessments/sessions/${sessionId}/answer`, {
        questionId: question._id,
        selectedIndex,
        timeTakenSec,
      });
      const data = res.data.data;

      if (data.done) {
        setResult(data.result);
      } else {
        setQuestion(data.question);
        setProgress(data.progress);
        setAbility(data.ability);
        setSelectedIndex(null);
        setTimeStarted(Date.now());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold mb-2 text-slate-900">
            {result.passed ? 'Assessment Passed' : 'Assessment Complete'}
          </h2>
          <p className="text-5xl font-bold my-4 text-brand-600">{result.score}%</p>
          <p className="text-slate-600 mb-6">
            {result.correctAnswers} correct · {result.wrongAnswers} incorrect · {result.totalQuestions} questions
          </p>
          <div className="inline-flex items-center gap-4 bg-slate-50 rounded-lg px-5 py-3">
            <div>
              <p className="text-xs text-slate-500">Ability (θ)</p>
              <p className="font-semibold text-slate-900">{result.ability.theta.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Precision (SE)</p>
              <p className="font-semibold text-slate-900">{result.ability.se.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tier</p>
              <p className="font-semibold text-slate-900">{result.ability.tier}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900 capitalize">{moduleId} Assessment</h1>
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2 text-sm">
              <span className="text-slate-500">
                θ <span className="font-semibold text-slate-900">{ability.theta.toFixed(2)}</span>
              </span>
              <span className="text-slate-500">
                SE <span className="font-semibold text-slate-900">{ability.se.toFixed(2)}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                {ability.tier}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {progress.answered + 1} of ~{progress.total}
              </span>
              <span>Answered: {progress.answered}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (progress.answered / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow-sm p-6">
          {question.subTopic && (
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">{question.subTopic}</p>
          )}
          <p className="text-lg font-medium text-slate-900 mb-6">{question.text}</p>
          <div className="space-y-3">
            {question.options.map((opt) => (
              <button
                key={opt.index}
                onClick={() => setSelectedIndex(opt.index)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  selectedIndex === opt.index
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:border-brand-300'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={submitAnswer}
            disabled={selectedIndex == null || submitting}
            className="px-8 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting…' : 'Submit answer'}
          </button>
        </div>
      </div>
    </div>
  );
}
