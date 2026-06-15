'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BarChart3, Users, BookOpen, Video, Code, Trophy, TrendingUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    assessmentsCompleted: 12,
    averageScore: 78,
    learningStreak: 8,
    practiceProblems: 45,
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>;
  }

  const pillars = [
    {
      title: 'Leadership Assessment',
      desc: 'Track your competencies',
      icon: BarChart3,
      href: '/dashboard/assessment',
      color: 'blue',
    },
    {
      title: 'Hiring',
      desc: 'View candidates',
      icon: Users,
      href: '/dashboard/hiring',
      color: 'purple',
    },
    {
      title: 'Practice',
      desc: 'Learn with spaced repetition',
      icon: BookOpen,
      href: '/dashboard/practice',
      color: 'green',
    },
    {
      title: 'Live Interviews',
      desc: 'Schedule & conduct interviews',
      icon: Video,
      href: '/dashboard/interviews',
      color: 'red',
    },
    {
      title: 'Coding Challenges',
      desc: 'Solve problems & compete',
      icon: Code,
      href: '/dashboard/challenges',
      color: 'yellow',
    },
    {
      title: 'Hackathons',
      desc: 'Team competitions',
      icon: Trophy,
      href: '/dashboard/hackathon',
      color: 'indigo',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60 text-purple-400',
    green: 'bg-green-500/10 border-green-500/30 hover:border-green-500/60 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 hover:border-red-500/60 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/60 text-yellow-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.email?.split('@')[0]}</h1>
        <p className="text-blue-100">Let's continue your learning journey</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Assessments', value: stats.assessmentsCompleted, icon: BarChart3 },
          { label: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp },
          { label: 'Learning Streak', value: `${stats.learningStreak} days`, icon: Clock },
          { label: 'Problems Solved', value: stats.practiceProblems, icon: Code },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{stat.label}</span>
              <stat.icon className="text-blue-400" size={20} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Pillars Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Access All Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => (
            <Link key={pillar.href} href={pillar.href}>
              <div
                className={`border rounded-lg p-6 transition cursor-pointer ${
                  colorClasses[pillar.color as keyof typeof colorClasses]
                }`}
              >
                <pillar.icon size={32} className="mb-4" />
                <h3 className="font-semibold mb-1">{pillar.title}</h3>
                <p className="text-sm opacity-80">{pillar.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            'Completed leadership assessment - Leadership Index: 78',
            'Solved 3 coding challenges',
            'Achieved "Learner" badge in practice',
            'Attended live interview session',
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              {activity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
