'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function EnterpriseSetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [teamSize, setTeamSize] = useState('1-50');
  const [useCase, setUseCase] = useState('hiring');

  const fieldClass =
    'w-full rounded-lg bg-canvas border border-hairline p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/onboarding/complete');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface border border-hairline rounded-2xl shadow-frost p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-600">
            <Building2 size={22} />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Enterprise setup
            </div>
            <h1 className="text-2xl font-bold text-ink">Tell us about your team</h1>
          </div>
        </div>

        <form onSubmit={finish} className="space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm text-slate-600 mb-1">
              Organization name
            </label>
            <input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="teamSize" className="block text-sm text-slate-600 mb-1">
              Team size
            </label>
            <select
              id="teamSize"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className={fieldClass}
            >
              <option>1-50</option>
              <option>51-200</option>
              <option>201-1000</option>
              <option>1000+</option>
            </select>
          </div>
          <div>
            <label htmlFor="useCase" className="block text-sm text-slate-600 mb-1">
              Primary use case
            </label>
            <select
              id="useCase"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className={fieldClass}
            >
              <option value="hiring">Technical hiring</option>
              <option value="leadership">Leadership assessment</option>
              <option value="practice">Skill development</option>
              <option value="hackathons">Hackathons & challenges</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 text-white py-2.5 font-medium hover:bg-brand-700 transition"
          >
            Finish setup
          </button>
        </form>
      </div>
    </div>
  );
}
