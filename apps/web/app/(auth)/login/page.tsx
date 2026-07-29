'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, SAMLAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SsoDiscovery {
  tenantId: string;
  providerId: string;
  providerType: string;
  displayName: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSso, setCheckingSso] = useState(false);
  const [sso, setSso] = useState<SsoDiscovery | null>(null);
  const router = useRouter();

  // Public POST /api/auth/sso/discover (auth.controller.ts) — given an email
  // domain, is there a tenant with SSO configured for it? Runs on email blur
  // so a plain email/password tenant never sees anything change; only a
  // domain with real SSO config (set via Settings → Single Sign-On) swaps
  // the password field for a federated sign-in button.
  const checkSso = async () => {
    if (!email.includes('@')) {
      setSso(null);
      return;
    }
    setCheckingSso(true);
    try {
      const res = await api.post('/api/auth/sso/discover', { email });
      setSso(res.data?.data ?? null);
    } catch {
      // Discovery failing shouldn't block login — just fall back to password.
      setSso(null);
    } finally {
      setCheckingSso(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSsoLogin = async () => {
    if (!sso) return;
    setLoading(true);
    setError('');

    try {
      const provider =
        sso.providerType === 'saml' ? new SAMLAuthProvider(sso.providerId) : new OAuthProvider(sso.providerId);
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Login</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={checkSso}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        {sso ? (
          <>
            <p className="text-xs text-slate-500 mb-4">
              {email.split('@')[1]} uses single sign-on.
            </p>
            <button
              type="button"
              onClick={handleSsoLogin}
              disabled={loading}
              className="w-full bg-ink text-white py-2 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : sso.displayName}
            </button>
            <button
              type="button"
              onClick={() => setSso(null)}
              className="w-full text-center text-xs text-slate-500 hover:underline mt-3"
            >
              Use a password instead
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || checkingSso}
              className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </>
        )}

        <p className="text-center text-sm text-slate-600 mt-4">
          Don't have an account?{' '}
          <a href="/register" className="text-brand-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
