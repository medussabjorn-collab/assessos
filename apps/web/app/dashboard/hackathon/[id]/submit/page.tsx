'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function HackathonSubmitPage() {
  const [projectTitle, setProjectTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [demo, setDemo] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!projectTitle.trim()) errs.push('Project title is required');
    if (!repo.trim()) errs.push('Repo URL is required');
    setErrors(errs);
  };

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <div>
      <PageHeader
        eyebrow="Hackathon"
        title="Submit Project"
        subtitle="Share your build for judging. Project title and repository are required."
        icon={Trophy}
      />

      <form
        onSubmit={submit}
        className="max-w-xl space-y-4 bg-surface border border-hairline rounded-xl p-6"
      >
        <div>
          <label htmlFor="projectTitle" className="block text-sm text-slate-600 mb-1">
            Project Title
          </label>
          <input
            id="projectTitle"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="repo" className="block text-sm text-slate-600 mb-1">
            Repo URL
          </label>
          <input
            id="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="demo" className="block text-sm text-slate-600 mb-1">
            Demo URL
          </label>
          <input
            id="demo"
            value={demo}
            onChange={(e) => setDemo(e.target.value)}
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          Submit
        </button>
        {errors.map((er) => (
          <p key={er} className="text-red-400">
            {er}
          </p>
        ))}
      </form>
    </div>
  );
}
