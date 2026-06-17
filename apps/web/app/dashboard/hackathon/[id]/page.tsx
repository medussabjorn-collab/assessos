'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trophy, Users, UserPlus, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

interface Team {
  id: string;
  name: string;
}

type Mode = 'idle' | 'createForm' | 'joinForm' | 'team' | 'projectForm' | 'submitted';

export default function HackathonPage() {
  const params = useParams();
  const id = String(params.id);
  const [title, setTitle] = useState('AssessOS Innovation Sprint');
  const [mode, setMode] = useState<Mode>('idle');
  const [team, setTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [invite, setInvite] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [demo, setDemo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/hackathons/${id}`);
        if (res.data.data?.title) setTitle(res.data.data.title);
      } catch {
        // keep fallback title
      }
    })();
  }, [id]);

  const createTeam = async () => {
    try {
      const res = await api.post('/api/teams', { name: teamName, hackathonId: id });
      setTeam(res.data.data);
    } catch {
      setTeam({ id: 'local', name: teamName });
    }
    setMode('team');
  };

  const joinTeam = async () => {
    try {
      const res = await api.post('/api/teams/join', { inviteCode: invite });
      setTeam(res.data.data);
    } catch {
      // ignore
    }
    setMode('team');
  };

  const submitProject = async () => {
    try {
      await api.post(`/api/teams/${team?.id}/submit`, {
        projectTitle,
        repoUrl: repo,
        demoUrl: demo,
      });
    } catch {
      // ignore
    }
    setMode('submitted');
  };

  const fieldClass =
    'w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600';
  const primaryBtn =
    'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition';

  return (
    <div>
      <PageHeader eyebrow="Hackathon" title={title} icon={Trophy} />

      <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6">
        {mode === 'idle' && (
          <div className="flex gap-3">
            <button
              onClick={() => setMode('createForm')}
              className={`inline-flex items-center gap-2 ${primaryBtn}`}
            >
              <Users size={16} /> Create Team
            </button>
            <button
              onClick={() => setMode('joinForm')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
            >
              <UserPlus size={16} /> Join Team
            </button>
          </div>
        )}

        {mode === 'createForm' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createTeam();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="teamName" className="block text-sm text-slate-300 mb-1">
                Team Name
              </label>
              <input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <button type="submit" className={primaryBtn}>
              Confirm
            </button>
          </form>
        )}

        {mode === 'joinForm' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinTeam();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="invite" className="block text-sm text-slate-300 mb-1">
                Invite Code
              </label>
              <input
                id="invite"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                className={fieldClass}
              />
            </div>
            <button type="submit" className={primaryBtn}>
              Join
            </button>
          </form>
        )}

        {mode === 'team' && team && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/15 text-blue-400">
                <Users size={18} />
              </span>
              <p className="text-white font-semibold">{team.name}</p>
            </div>
            <button onClick={() => setMode('projectForm')} className={primaryBtn}>
              Submit Project
            </button>
            <Link
              href={`/dashboard/hackathon/${id}/leaderboard`}
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <Trophy size={15} /> Leaderboard
            </Link>
          </div>
        )}

        {mode === 'projectForm' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitProject();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="projectTitle" className="block text-sm text-slate-300 mb-1">
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
              <label htmlFor="repo" className="block text-sm text-slate-300 mb-1">
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
              <label htmlFor="demo" className="block text-sm text-slate-300 mb-1">
                Demo URL
              </label>
              <input
                id="demo"
                value={demo}
                onChange={(e) => setDemo(e.target.value)}
                className={fieldClass}
              />
            </div>
            <button type="submit" className={primaryBtn}>
              Submit
            </button>
          </form>
        )}

        {mode === 'submitted' && (
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle2 size={18} /> Project submitted
            </p>
            <Link
              href={`/dashboard/hackathon/${id}/leaderboard`}
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <Trophy size={15} /> Leaderboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
