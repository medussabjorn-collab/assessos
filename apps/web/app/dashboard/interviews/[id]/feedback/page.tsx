'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function InterviewFeedbackPage() {
  const [tech, setTech] = useState('');
  const [culture, setCulture] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tech || !culture) {
      setError('Both scores are required');
      return;
    }
    setError('');
  };

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <div>
      <PageHeader eyebrow="Interviews" title="Interview Feedback" icon={ClipboardCheck} />

      <form
        onSubmit={submit}
        className="max-w-md space-y-4 bg-surface border border-hairline rounded-xl p-6"
      >
        <div>
          <label htmlFor="tech" className="block text-sm text-slate-600 mb-1">
            Technical Score
          </label>
          <input
            id="tech"
            type="number"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="culture" className="block text-sm text-slate-600 mb-1">
            Culture Fit
          </label>
          <input
            id="culture"
            type="number"
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm text-slate-600 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          Submit Feedback
        </button>
        {error && <p className="text-red-400">{error}</p>}
      </form>
    </div>
  );
}
