'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import Timer from './Timer';
import QuestionCard from './QuestionCard';

interface AssessmentViewProps {
  sessionId: string;
  configId: string;
}

interface Question {
  id: string;
  text: string;
  options: Array<{ id: string; text: string; value: number }>;
  dimensionId: string;
}

interface Answer {
  questionId: string;
  selectedOptionId: string;
  timeTakenSec: number;
}

export default function AssessmentView({
  sessionId,
  configId,
}: AssessmentViewProps) {
  const { user, tenantId } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLimitMin, setTimeLimitMin] = useState(60);
  const [timeStarted, setTimeStarted] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/assessments/sessions/${sessionId}`,
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user?.getIdToken()}`,
            },
          },
        );
        setTimeLimitMin(response.data.data.config.timeLimitMin);

        // Mock questions for now (in Phase 3, fetch from backend)
        const mockQuestions: Question[] = [
          {
            id: 'q1',
            text: 'How effectively do you articulate a compelling vision?',
            dimensionId: 'vision',
            options: [
              { id: 'opt1', text: 'Not at all', value: 1 },
              { id: 'opt2', text: 'Somewhat', value: 2 },
              { id: 'opt3', text: 'Moderately', value: 3 },
              { id: 'opt4', text: 'Very effectively', value: 4 },
              { id: 'opt5', text: 'Exceptionally well', value: 5 },
            ],
          },
          {
            id: 'q2',
            text: 'How well do you develop strategic plans?',
            dimensionId: 'vision',
            options: [
              { id: 'opt1', text: 'Not at all', value: 1 },
              { id: 'opt2', text: 'Somewhat', value: 2 },
              { id: 'opt3', text: 'Moderately', value: 3 },
              { id: 'opt4', text: 'Very well', value: 4 },
              { id: 'opt5', text: 'Exceptionally well', value: 5 },
            ],
          },
        ];

        setQuestions(mockQuestions);
        setLoading(false);
      } catch (err) {
        setError('Failed to load session');
        setLoading(false);
      }
    };

    if (user) fetchSession();
  }, [sessionId, user, tenantId]);

  const handleAnswerSelect = (optionId: string) => {
    const timeTakenSec = Math.round((Date.now() - timeStarted) / 1000);
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(
      (a) => a.questionId === questions[currentQuestionIndex].id,
    );

    if (existingIndex >= 0) {
      newAnswers[existingIndex] = {
        questionId: questions[currentQuestionIndex].id,
        selectedOptionId: optionId,
        timeTakenSec,
      };
    } else {
      newAnswers.push({
        questionId: questions[currentQuestionIndex].id,
        selectedOptionId: optionId,
        timeTakenSec,
      });
    }

    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeStarted(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTimeStarted(Date.now());
    }
  };

  const handleSubmit = async () => {
    try {
      const totalTimeTakenSec = Math.round((Date.now() - timeStarted) / 1000);
      await axios.post(
        `http://localhost:3000/api/assessments/sessions/${sessionId}/submit`,
        {
          answers,
          metadata: {
            totalTimeTakenSec,
            answeredCount: answers.length,
            skippedCount: questions.length - answers.length,
          },
        },
        {
          headers: {
            'x-tenant-id': tenantId,
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
        },
      );
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit assessment');
    }
  };

  const handleTimeExpired = () => {
    handleSubmit();
  };

  if (loading) return <div className="p-8">Loading assessment...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (submitted) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Assessment Submitted!</h2>
          <p className="text-gray-600">
            Your assessment has been submitted successfully. A report will be
            generated shortly.
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-8">No questions available</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900">
              Leadership Assessment
            </h1>
            <Timer
              timeLimitMin={timeLimitMin}
              onTimeExpired={handleTimeExpired}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>
                Answered: {answers.length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <QuestionCard
          question={currentQuestion}
          selectedOptionId={currentAnswer?.selectedOptionId}
          onSelectOption={handleAnswerSelect}
        />

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
