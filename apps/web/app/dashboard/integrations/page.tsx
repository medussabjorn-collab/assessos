'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, RefreshCw, Zap, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  status: IntegrationStatus;
  lastSyncAt: string | null;
  connectedAt: string | null;
}

// Ported from leadership-assessment's IntegrationsPage, rebuilt against the
// real backend (modules/integrations, Phase 2) — leadership's version was a
// hardcoded array with fake statuses/timestamps and no connect/disconnect
// action that did anything. This fetches the real tenant-annotated catalog
// and actually connects/disconnects via POST /api/integrations/:id/connect|
// disconnect, gated server-side by @RequirePermission(INTEGRATIONS_MANAGE)
// (this page also hides the actions for users without that permission —
// UX only, the server remains the real gate).

const STATUS_ICON: Record<IntegrationStatus, React.ReactNode> = {
  connected: <CheckCircle2 size={16} className="text-emerald-500" />,
  disconnected: <AlertCircle size={16} className="text-subtle" />,
  pending: <Clock size={16} className="text-amber-500" />,
  error: <AlertCircle size={16} className="text-red-500" />,
};

const STATUS_BADGE: Record<IntegrationStatus, string> = {
  connected: 'bg-emerald-50 text-emerald-600',
  disconnected: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
};

// The 3 real event types WebhookSubscriptionService actually dispatches
// (modules/webhooks/webhook-subscription.service.ts WEBHOOK_EVENT_TYPES) —
// fetched live from GET /api/webhooks/event-types so this list can't drift
// from the server. Descriptions are static (the API doesn't provide them),
// matched to what each event actually means in this codebase.
const EVENT_DESCRIPTIONS: Record<string, string> = {
  'assessment.completed': 'Fired when a candidate submits an assessment session.',
  'report.score_threshold_crossed': "Fired when an AI report's average score crosses the high/low threshold.",
  'bias_audit.alert': 'Fired when the bias-audit adverse-impact check flags a protected-class disparity.',
};

export default function IntegrationsPage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission(PERMISSIONS.INTEGRATIONS_MANAGE);

  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Integration | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    const res = await api.get('/api/integrations');
    setIntegrations(res.data.data);
  };

  useEffect(() => {
    load();
    api.get('/api/webhooks/event-types').then((res) => setEventTypes(res.data.data ?? []));
  }, []);

  const toggle = async (integration: Integration) => {
    setBusy(true);
    setActionError('');
    try {
      const action = integration.status === 'connected' ? 'disconnect' : 'connect';
      const res = await api.post(`/api/integrations/${integration.id}/${action}`);
      await load();
      setSelected((s) => (s ? { ...s, status: res.data.data.status } : s));
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (!integrations) {
    return <div className="p-2 text-subtle">Loading…</div>;
  }

  const categories = ['all', ...Array.from(new Set(integrations.map((i) => i.category)))];
  const filtered = filter === 'all' ? integrations : integrations.filter((i) => i.category === filter);
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const errorCount = integrations.filter((i) => i.status === 'error').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Integration Hub</h1>
          <p className="text-subtle mt-1">Connect AssessOS to your enterprise ecosystem</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-brand-50 text-brand-600">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {connectedCount} connected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="frost-card p-4">
          <p className="text-2xl font-bold text-emerald-600">{connectedCount}</p>
          <p className="text-xs text-subtle mt-0.5">Connected</p>
        </div>
        <div className="frost-card p-4">
          <p className="text-2xl font-bold text-brand-600">{integrations.length}</p>
          <p className="text-xs text-subtle mt-0.5">Available</p>
        </div>
        <div className="frost-card p-4">
          <p className="text-2xl font-bold text-red-500">{errorCount}</p>
          <p className="text-xs text-subtle mt-0.5">Errors</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${
              filter === cat ? 'bg-ink text-white' : 'bg-canvas text-subtle hover:bg-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((integration) => (
          <button
            key={integration.id}
            onClick={() => setSelected(integration)}
            className="frost-card p-4 text-left hover:border-brand-300 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="font-semibold text-ink">{integration.name}</span>
              {STATUS_ICON[integration.status]}
            </div>
            <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mb-2 ${STATUS_BADGE[integration.status]}`}>
              {integration.status}
            </span>
            <p className="text-xs text-subtle leading-relaxed line-clamp-2">{integration.description}</p>
            {integration.lastSyncAt && (
              <p className="text-[10px] text-subtle flex items-center gap-1 mt-2">
                <RefreshCw size={9} /> Synced {new Date(integration.lastSyncAt).toLocaleString()}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="frost-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-amber-500" />
          <span className="font-semibold text-ink">Webhook Events</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-canvas text-subtle ml-auto">REST API</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {eventTypes.map((event) => (
            <div key={event} className="p-3 bg-canvas rounded-xl">
              <span className="text-xs font-mono font-semibold text-ink">{event}</span>
              <p className="text-xs text-subtle mt-1">{EVENT_DESCRIPTIONS[event] ?? ''}</p>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface rounded-2xl border border-hairline shadow-frost-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-ink text-lg">{selected.name}</p>
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mt-1 ${STATUS_BADGE[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-subtle hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-subtle mb-4">{selected.description}</p>
            <p className="text-sm font-semibold text-ink mb-2">Features</p>
            <ul className="space-y-1.5 mb-4">
              {selected.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-subtle">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {!isAdmin && (
              <p className="text-xs text-subtle mb-3">Only org admins can connect or disconnect integrations.</p>
            )}
            {actionError && <p className="text-xs text-red-500 mb-3">{actionError}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg text-sm text-subtle hover:bg-canvas transition"
              >
                Close
              </button>
              {isAdmin && (
                <button
                  onClick={() => toggle(selected)}
                  disabled={busy}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 ${
                    selected.status === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-600 hover:bg-brand-700'
                  }`}
                >
                  {selected.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
