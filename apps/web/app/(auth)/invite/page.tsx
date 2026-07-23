'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface InvitationDetails {
  email: string;
  name: string;
  roleName: string;
  organizationName: string;
  status: string;
}

function InviteAcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) {
      setLookupError('This invitation link is missing its token.');
      setLoading(false);
      return;
    }
    fetch(`/api/invitations/lookup?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message ?? 'Invitation not found.');
        }
        setInvitation(json.data);
      })
      .catch((err) => setLookupError(err.message ?? 'This invitation link is invalid.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setSubmitError('');

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? 'Failed to accept invitation.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to accept invitation.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500">Loading invitation…</p>
      </div>
    );
  }

  if (lookupError || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation not found</h1>
          <p className="text-slate-600 text-sm">{lookupError || 'This invitation link is invalid.'}</p>
        </div>
      </div>
    );
  }

  if (invitation.status !== 'pending') {
    const statusCopy: Record<string, string> = {
      accepted: 'This invitation has already been accepted. Try logging in instead.',
      revoked: 'This invitation has been revoked by an administrator.',
      expired: 'This invitation has expired. Ask an admin to resend it.',
    };
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation {invitation.status}</h1>
          <p className="text-slate-600 text-sm">{statusCopy[invitation.status] ?? ''}</p>
          {invitation.status === 'accepted' && (
            <a href="/login" className="text-brand-500 hover:underline text-sm mt-4 inline-block">
              Go to login
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form
        onSubmit={handleAccept}
        className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-96"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re invited</h1>
        <p className="text-slate-600 text-sm mb-6">
          Join <strong>{invitation.organizationName}</strong> as a{' '}
          <strong className="capitalize">{invitation.roleName}</strong>. Set a password to activate your account.
        </p>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {submitError}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={invitation.email}
            disabled
            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'Setting up your account…' : 'Accept invitation'}
        </button>
      </form>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteAcceptForm />
    </Suspense>
  );
}
