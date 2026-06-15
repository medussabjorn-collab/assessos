'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap, Users, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="text-2xl font-bold">AssessOS</div>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-slate-300 hover:text-white transition">
              Login
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          The Complete Assessment Platform
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Leadership development, hiring, practice, interviews, coding challenges, and hackathons — all in one place.
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
          >
            Get Started <ArrowRight size={20} />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-400 px-6 py-3 rounded-lg transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">6 Powerful Pillars</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Leadership Assessment',
              desc: 'Evaluate 8 core competencies with AI-powered insights',
              icon: BarChart3,
            },
            {
              title: 'Hiring',
              desc: 'Candidate pipeline with technical + culture fit scoring',
              icon: Users,
            },
            {
              title: 'Practice',
              desc: 'Spaced repetition learning with gamification',
              icon: Zap,
            },
            {
              title: 'Live Interviews',
              desc: 'Video rooms with AI proctoring and feedback',
              icon: Users,
            },
            {
              title: 'Coding Challenges',
              desc: 'Auto-graded problems with leaderboards',
              icon: Zap,
            },
            {
              title: 'Hackathons',
              desc: 'Team competitions with judging and prizes',
              icon: CheckCircle,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
            >
              <feature.icon className="text-blue-400 mb-4" size={32} />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-slate-800/30 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">Why AssessOS?</h2>
        <div className="space-y-6">
          {[
            'Multi-tenant SaaS for enterprises',
            'AI-powered insights and reports',
            'Real-time analytics and dashboards',
            'Flexible role-based access control',
            'Scalable infrastructure',
            'Enterprise-grade security',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-4">
              <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
              <span className="text-lg">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg transition"
        >
          Sign Up Now <ArrowRight size={24} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 text-center text-slate-400">
        <p>&copy; 2024 AssessOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
