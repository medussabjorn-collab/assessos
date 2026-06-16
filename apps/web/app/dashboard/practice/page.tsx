'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Flame, Award, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Question {
  id: string;
  prompt: string;
  domain: string;
  difficulty: string;
  options: string[];
  correctIndex: number;
}

interface Stats {
  totalAnswered: number;
  accuracy: number;
  streak: number;
  badges: string[];
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAnswered: 0,
    accuracy: 0,
    streak: 0,
    badges: [],
  });
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get('/api/practice/questions'),
          api.get('/api/practice/stats'),
        ]);
        setQuestions(qRes.data.data || FALLBACK_QUESTIONS);
        if (sRes.data.data) setStats(sRes.data.data);
      } catch {
        // Graceful fallback so the page is usable before the API is wired.
        setQuestions(FALLBACK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const question = questions[current];

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
  };

  const handleSubmit = async () => {
    if (selected === null) return;
    setRevealed(true);
    const correct = selected === question.correctIndex;
    setStats((prev) => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      streak: correct ? prev.streak + 1 : 0,
    }));
    try {
      await api.post(`/api/practice/questions/${question.id}/attempt`, {
        selectedIndex: selected,
        correct,
      });
    } catch {
      // Non-blocking — local state already updated.
    }
  };

  const handleNext = () => {
    setSelected(null);
    setRevealed(false);
    setCurrent((c) => (c + 1) % questions.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!question) {
    return <div className="p-8 text-slate-400">No questions available yet.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="text-green-400" /> Practice
        </h1>
        <p className="text-slate-400">Spaced-repetition learning to sharpen your skills</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <CheckCircle className="mx-auto text-blue-400 mb-1" size={20} />
          <div className="text-2xl font-bold">{stats.totalAnswered}</div>
          <div className="text-xs text-slate-400">Answered</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <Flame className="mx-auto text-orange-400 mb-1" size={20} />
          <div className="text-2xl font-bold">{stats.streak}</div>
          <div className="text-xs text-slate-400">Streak</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <Award className="mx-auto text-yellow-400 mb-1" size={20} />
          <div className="text-2xl font-bold">{stats.badges.length}</div>
          <div className="text-xs text-slate-400">Badges</div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <div className="flex gap-2 mb-4">
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
            {question.domain}
          </span>
          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
            {question.difficulty}
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-6">{question.prompt}</h2>

        <div className="space-y-3 mb-6">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const isSelected = i === selected;
            let style = 'bg-slate-700/50 border-slate-600 hover:border-slate-500';
            if (revealed && isCorrect) style = 'bg-green-500/20 border-green-500';
            else if (revealed && isSelected && !isCorrect) style = 'bg-red-500/20 border-red-500';
            else if (isSelected) style = 'bg-blue-500/20 border-blue-500';

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full p-4 text-left border rounded-lg transition flex items-center justify-between ${style}`}
              >
                <span>{option}</span>
                {revealed && isCorrect && <CheckCircle className="text-green-400" size={20} />}
                {revealed && isSelected && !isCorrect && <XCircle className="text-red-400" size={20} />}
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-lg transition"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    prompt: 'Which leadership style best fosters team autonomy?',
    domain: 'Leadership',
    difficulty: 'medium',
    options: ['Autocratic', 'Delegative', 'Micromanaging', 'Directive'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'What is the primary purpose of a retrospective?',
    domain: 'Agile',
    difficulty: 'easy',
    options: [
      'Assign blame for failures',
      'Plan the next sprint backlog',
      'Reflect and improve the process',
      'Report status to executives',
    ],
    correctIndex: 2,
  },
];
