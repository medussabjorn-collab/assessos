'use client';

import { useEffect, useState } from 'react';
import { UserCheck, Loader, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import {
  listPendingReview,
  overrideVerification,
  IdentityVerificationRecord,
} from '@/lib/identity-verification';
import PageHeader from '@/components/PageHeader';

export default function IdentityReviewPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission(PERMISSIONS.PROCTORING_INCIDENTS_REVIEW);

  const [records, setRecords] = useState<IdentityVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setRecords(await listPendingReview());
      } catch {
        setError('Failed to load pending identity verifications.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  const decide = async (id: string, decision: 'verified' | 'failed') => {
    try {
      await overrideVerification(id, decision, note.trim() || undefined);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDecidingId(null);
      setNote('');
    } catch {
      // leave the record in the list; the note stays for retry
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="Identity Review" icon={UserCheck} />
        <div className="rounded-xl border border-dashed border-hairline p-12 text-center text-subtle">
          Only proctoring reviewers can view this queue.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-2 text-red-400">{error}</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Identity Review"
        subtitle="Verification attempts the automated pipeline couldn't resolve on its own."
        icon={UserCheck}
      />

      <div className="bg-surface border border-hairline rounded-xl p-5">
        <h3 className="font-semibold text-ink mb-3">Pending manual review</h3>
        {records.length === 0 ? (
          <p className="text-sm text-subtle">No pending verifications.</p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="border border-hairline rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    User <code className="text-xs">{r.userId.slice(0, 8)}</code> — submitted{' '}
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-subtle">
                  <span>Document type: {r.documentType ?? '—'}</span>
                  <span>Document score: {r.documentScore != null ? r.documentScore.toFixed(2) : '—'}</span>
                  <span>Face match: {r.faceMatchScore != null ? r.faceMatchScore.toFixed(2) : '—'}</span>
                </div>

                {decidingId === r.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Review note (optional)…"
                      className="flex-1 border border-hairline rounded-lg px-3 py-1.5 text-sm bg-canvas"
                    />
                    <button
                      onClick={() => decide(r.id, 'verified')}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => decide(r.id, 'failed')}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm inline-flex items-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => {
                        setDecidingId(null);
                        setNote('');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-hairline text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDecidingId(r.id)}
                    className="mt-3 text-sm text-brand-500 hover:underline"
                  >
                    Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
