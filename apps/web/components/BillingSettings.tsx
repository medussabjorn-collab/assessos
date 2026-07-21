'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Loader, CheckCircle2 } from 'lucide-react';

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  seats: number;
  assessmentCredits: number;
  renewsAt: string | null;
}

interface Usage {
  assessmentsUsed: number;
  assessmentsLimit: number;
  seatsUsed: number;
  seatsLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
}

const PLANS: Array<{ id: 'free' | 'pro' | 'enterprise'; name: string; price: string; blurb: string }> = [
  { id: 'free', name: 'Free', price: '$0', blurb: '5 seats · 100 assessment credits' },
  { id: 'pro', name: 'Pro', price: '$299/mo', blurb: '50 seats · 999 assessment credits' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', blurb: '999 seats · unlimited credits' },
];

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BillingSettings() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [subRes, usageRes] = await Promise.all([
          api.get('/api/billing/subscriptions').catch(() => null),
          api.get('/api/billing/usage').catch(() => null),
        ]);
        setSubscription(subRes?.data?.data ?? null);
        setUsage(usageRes?.data?.data ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const selectPlan = async (plan: string) => {
    setChangingPlan(plan);
    setPlanError(null);
    try {
      const res = await api.post('/api/billing/subscriptions/create', { plan });
      setSubscription(res.data.data);
    } catch (err: any) {
      setPlanError(
        err?.response?.data?.message ??
          'Could not update your plan — payment processing isn’t configured in this environment.',
      );
    } finally {
      setChangingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Billing & Subscription</h2>

      {subscription && (
        <div className="mb-8 p-5 rounded-lg bg-slate-50 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Current plan</p>
          <p className="text-2xl font-bold text-slate-900 capitalize mb-2">{subscription.plan}</p>
          <p className="text-sm text-gray-600">
            {subscription.seats} seats · {subscription.assessmentCredits} assessment credits
            {subscription.renewsAt && ` · renews ${new Date(subscription.renewsAt).toLocaleDateString()}`}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {PLANS.map((p) => {
          const isCurrent = subscription?.plan === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-5 ${isCurrent ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
            >
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="text-xl font-bold text-brand-600 my-1">{p.price}</p>
              <p className="text-xs text-gray-500 mb-4">{p.blurb}</p>
              {isCurrent ? (
                <span className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium">
                  <CheckCircle2 size={14} /> Current plan
                </span>
              ) : (
                <button
                  onClick={() => selectPlan(p.id)}
                  disabled={changingPlan === p.id}
                  className="w-full text-sm font-medium py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {changingPlan === p.id ? 'Updating…' : subscription ? 'Switch plan' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {planError && <p className="text-sm text-red-500 mb-6">{planError}</p>}

      {usage && (
        <div className="p-5 rounded-lg bg-slate-50 border border-gray-200 space-y-4">
          <p className="text-sm font-semibold text-slate-900">Usage this period</p>
          <UsageBar label="Assessments" used={usage.assessmentsUsed} limit={usage.assessmentsLimit} />
          <UsageBar label="Seats" used={usage.seatsUsed} limit={usage.seatsLimit} />
          <UsageBar label="Storage (GB)" used={usage.storageUsedGb} limit={usage.storageLimitGb} />
        </div>
      )}
    </div>
  );
}
