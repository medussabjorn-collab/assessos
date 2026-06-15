'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ChevronRight, Clock } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  competency: string;
}

export default function AssessmentTaker({ params }: { params: { sessionId: string } }) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions: Question[] = [
    {
      id: '1',
      text: 'How do you handle conflict with team members?',
      options: [
        'Address it immediately and directly',
        'Give it time to cool down',
        'Involve management',
        'Avoid confrontation',
      ],
      competency: 'Communication',
    },
    {
      id: '2',
      text: 'What is your approach to setting goals?',
      options: [
        'Set ambitious targets',
        'Set realistic, achievable goals',
        'Wait for management direction',
        'No formal goal setting',
      ],
      competency: 'Strategic Thinking',
    },
    {
      id: '3',
      text: 'How do you make decisions under pressure?',
      options: [
        'Data-driven analysis',
        'Gut feeling',
        'Consult with team',
        'Defer to authority',
      ],
      competency: 'Decision Making',
    },
  ];

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [question.id]: option });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
        <div className="text-6xl font-bold text-blue-400 mb-4">78</div>
        <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
        <p className="text-slate-300 mb-8">Your Leadership Index score reflects your competency across 8 dimensions.</p>
        <div className="space-y-2 text-left bg-slate-700/50 rounded p-4 mb-8">
          <div className="flex justify-between">
            <span>Communication</span>
            <span className="text-blue-400">8/10</span>
          </div>
          <div className="flex justify-between">
            <span>Strategic Thinking</span>
            <span className="text-blue-400">7/10</span>
          </div>
          <div className="flex justify-between">
            <span>Decision Making</span>
            <span className="text-blue-400">8/10</span>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg transition">
          View Full Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span className="flex items-center gap-1">
            <Clock size={16} />
            5:45
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <div className="text-sm text-blue-400 mb-3">
          {question.competency}
        </div>
        <h2 className="text-2xl font-bold mb-8">{question.text}</h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`w-full p-4 text-left border rounded-lg transition ${
                answers[question.id] === option
                  ? 'bg-blue-500/20 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {answers[question.id] === option && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-3 rounded-lg transition"
          >
            Previous
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Submit <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
