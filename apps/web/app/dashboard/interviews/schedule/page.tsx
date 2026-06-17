'use client';

import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function ScheduleInterviewPage() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const when = new Date(`${date}T${time || '00:00'}`);
    if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      setError('Scheduled time must be in the future');
      return;
    }
    setError('');
  };

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-blue-600';

  return (
    <div>
      <PageHeader
        eyebrow="Interviews"
        title="Schedule Interview"
        subtitle="Book an AI-proctored session for an upcoming time slot."
        icon={CalendarPlus}
      />

      <form
        onSubmit={submit}
        className="max-w-md space-y-4 bg-surface border border-hairline rounded-xl p-6"
      >
        <div>
          <label htmlFor="date" className="block text-sm text-slate-600 mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm text-slate-600 mb-1">
            Time
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Schedule
        </button>
        {error && <p className="text-red-400">{error}</p>}
      </form>
    </div>
  );
}
