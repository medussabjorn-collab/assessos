import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Brain, Code, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Input';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import type { UserRole } from '../types';

const features = [
  { icon: Brain, title: 'AI-Powered Proctoring', desc: 'Real-time integrity monitoring' },
  { icon: Code, title: '5 Assessment Modules', desc: 'Technical, Behavioral & more' },
  { icon: Sparkles, title: 'Live Code Editor', desc: 'Python, Java, C++, JS & .NET' },
  { icon: MessageSquare, title: 'Multilingual', desc: '7 languages supported' },
];

const roleOptions = [
  { value: 'candidate', label: 'Candidate — Take Assessments' },
  { value: 'recruiter', label: 'TA Manager / Recruiter' },
  { value: 'admin', label: 'Administrator — Manage Platform' },
  { value: 'viewer', label: 'Viewer — Read-only Access' },
];

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else await signUp(name, email, password, role);
      // Role-based redirect is handled by RootRedirect at '/'
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r: 'admin' | 'candidate' | 'recruiter') => {
    const emails = { admin: 'admin@leaderassess.com', candidate: 'candidate@leaderassess.com', recruiter: 'recruiter@leaderassess.com' };
    setEmail(emails[r]);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'rgb(var(--color-bg))' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-none">LeaderAssess Pro</p>
              <p className="text-brand-200 text-xs">Enterprise Assessment Platform</p>
            </div>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Elevate Leadership<br />
              <span className="text-brand-200">Through Intelligence</span>
            </h1>
            <p className="text-brand-100 text-lg leading-relaxed max-w-md">
              AI-powered multi-assessment platform designed for enterprise-grade leadership evaluation and development.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              >
                <f.icon size={20} className="text-brand-200 mb-2" />
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-brand-200 text-xs mt-0.5">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-8">
            {['500+ Questions', 'AI Proctoring', 'RBAC Security', 'Offline Mode'].map(s => (
              <div key={s} className="text-center">
                <div className="w-1.5 h-1.5 bg-brand-300 rounded-full mx-auto mb-1.5" />
                <p className="text-brand-200 text-xs whitespace-nowrap">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        {/* Theme toggle */}
        <button onClick={toggleDark}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">LeaderAssess <span className="text-brand-600">Pro</span></span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  {mode === 'login'
                    ? 'Sign in to your assessment dashboard'
                    : 'Join the leadership assessment platform'}
                </p>
              </div>

              {/* Demo quick-fill */}
              {mode === 'login' && (
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button onClick={() => fillDemo('candidate')}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium whitespace-nowrap">
                    Try as Candidate
                  </button>
                  <button onClick={() => fillDemo('recruiter')}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium whitespace-nowrap">
                    Try as Recruiter
                  </button>
                  <button onClick={() => fillDemo('admin')}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-medium whitespace-nowrap">
                    Try as Admin
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Alex Johnson" required icon={<User size={16} />} fullWidth />
                )}
                <Input label="Email Address" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required icon={<Mail size={16} />} fullWidth />
                <Input label="Password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required icon={<Lock size={16} />}
                  iconRight={
                    <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  fullWidth />
                {mode === 'register' && (
                  <Select label="Role" value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    options={roleOptions} fullWidth />
                )}

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                    {error}
                  </motion.div>
                )}

                <Button type="submit" size="lg" fullWidth loading={loading}
                  iconRight={!loading ? <ArrowRight size={18} /> : undefined}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
                    className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                    {mode === 'login' ? 'Create one' : 'Sign in'}
                  </button>
                </span>
              </div>

              {/* Security notice */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 justify-center">
                <Shield size={13} className="text-gray-400" />
                <p className="text-xs text-gray-400">
                  AES-256 encrypted · GDPR compliant · SOC 2 ready
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
