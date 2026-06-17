'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Option {
  id: string;
  text: string;
}

interface Feedback {
  correct: boolean;
  explanation: string;
  nextReviewAt: string | null;
  streakCount: number;
}

// Fallback so the page is interactive even when the question fetch is not
// available (e.g. deep-linked review sessions).
const FALLBACK = {
  body: 'A team member is struggling. What leadership style do you adopt?',
  options: [
    { id: 'a', text: 'Directive' },
    { id: 'b', text: 'Transformational' },
    { id: 'c', text: 'Laissez-faire' },
  ] as Option[],
};

export default function PracticeQuestionPage() {
  const params = useParams();
  const id = String(params.id);
  const [body, setBody] = useState(FALLBACK.body);
  const [options, setOptions] = useState<Option[]>(FALLBACK.options);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/practice/questions/${id}`);
        const data = res.data.data;
        if (data?.options) {
          setBody(data.body ?? FALLBACK.body);
          setOptions(data.options);
        }
      } catch {
        // keep fallback
      }
    })();
  }, [id]);

  const submit = async () => {
    try {
      const res = await api.post('/api/practice/submit', {
        questionId: id,
        optionId: selected,
      });
      setFeedback(res.data.data);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Practice" title="Practice Question" icon={BookOpen} />

      <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6">
        <p className="text-xl text-white mb-6">{body}</p>

        <div className="space-y-2 mb-6">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o.text)}
              className={`block w-full text-left p-3 rounded-lg border-2 transition ${
                selected === o.text
                  ? 'border-blue-600 bg-blue-950'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {o.text}
            </button>
          ))}
        </div>

        <button
          onClick={submit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Submit Answer
        </button>
      </div>

      {feedback && (
        <div className="mt-4 max-w-2xl p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p
            className={`inline-flex items-center gap-2 font-semibold ${
              feedback.correct ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {feedback.correct ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            {feedback.correct ? 'Correct' : 'Incorrect'}
          </p>
          <p className="text-slate-300 mt-2">{feedback.explanation}</p>
          {feedback.correct && feedback.nextReviewAt && (
            <p className="text-slate-400 text-sm mt-2">Next review scheduled</p>
          )}
          <p className="inline-flex items-center gap-1.5 text-slate-400 text-sm mt-2">
            <Flame size={14} className="text-orange-400" />
            Current streak: {feedback.streakCount}
          </p>
        </div>
      )}
    </div>
  );
}
