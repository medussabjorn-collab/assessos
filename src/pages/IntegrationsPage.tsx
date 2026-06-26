import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Plus, Zap, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';

interface Integration {
  id:       string;
  name:     string;
  category: string;
  icon:     string;
  desc:     string;
  status:   IntegrationStatus;
  lastSync?: string;
  features: string[];
  docsUrl?: string;
}

const integrations: Integration[] = [
  { id: 'workday',     name: 'Workday',      category: 'HRMS',        icon: '👔', status: 'connected',    lastSync: '2 min ago',   desc: 'Sync employee data, onboarding workflows, and role assignments automatically.', features: ['Auto-provision candidates', 'Sync org hierarchy', 'Push assessment results', 'Deactivate on offboard'] },
  { id: 'greenhouse',  name: 'Greenhouse',   category: 'ATS',         icon: '🌱', status: 'connected',    lastSync: '15 min ago',  desc: 'Integrate with your ATS to trigger assessments in the hiring pipeline.', features: ['Auto-trigger on stage change', 'Push scores to candidate profile', 'Reject/advance based on score', 'Bulk invite candidates'] },
  { id: 'moodle',      name: 'Moodle',       category: 'LMS',         icon: '📚', status: 'connected',    lastSync: '1 hour ago',  desc: 'Connect learning paths to assessment performance for skill gap recommendations.', features: ['Course completion triggers', 'Skill gap remediation', 'Sync learner profiles', 'Progress webhooks'] },
  { id: 'okta',        name: 'Okta',         category: 'Identity',    icon: '🔐', status: 'connected',    lastSync: '5 min ago',   desc: 'Enterprise SSO and identity lifecycle management via SAML 2.0 / OIDC.', features: ['SSO (SAML 2.0)', 'SCIM provisioning', 'MFA enforcement', 'Group sync for RBAC'] },
  { id: 'slack',       name: 'Slack',        category: 'Comms',       icon: '💬', status: 'connected',    lastSync: '30 sec ago',  desc: 'Real-time notifications for assessment events, violations, and completions.', features: ['Completion alerts', 'Violation notifications', 'Admin digest (daily)', 'Slash command /assess'] },
  { id: 'salesforce',  name: 'Salesforce',   category: 'CRM',         icon: '☁️', status: 'pending',      desc: 'Link leadership assessment scores to your CRM pipeline for talent tracking.', features: ['Push scores to Contact', 'Custom field mapping', 'Report embedding', 'Webhook events'] },
  { id: 'bamboohr',    name: 'BambooHR',     category: 'HRMS',        icon: '🎋', status: 'disconnected', desc: 'HR data sync for small-to-medium teams using BambooHR.', features: ['Employee sync', 'Assessment scheduling', 'Performance data export'] },
  { id: 'lever',       name: 'Lever',        category: 'ATS',         icon: '🔧', status: 'disconnected', desc: 'Assessment triggering in Lever hiring workflows.', features: ['Stage-based triggers', 'Score push-back', 'Candidate tagging'] },
  { id: 'teams',       name: 'MS Teams',     category: 'Comms',       icon: '💼', status: 'disconnected', desc: 'Microsoft Teams integration for notifications and bot commands.', features: ['Adaptive cards', 'Bot commands', 'Channel alerts', 'Meeting integration'] },
  { id: 'sap',         name: 'SAP HCM',      category: 'ERP',         icon: '🏭', status: 'error',        desc: 'Enterprise SAP integration for large-scale HR data management.', features: ['IDoc integration', 'Employee master sync', 'Competency mapping'] },
  { id: 'powerbi',     name: 'Power BI',     category: 'Analytics',   icon: '📊', status: 'disconnected', desc: 'Embed assessment analytics in your existing Power BI dashboards.', features: ['REST API datasource', 'Custom visuals', 'Row-level security', 'Scheduled refresh'] },
  { id: 'zapier',      name: 'Zapier',       category: 'Automation',  icon: '⚡', status: 'connected',    lastSync: '10 min ago',  desc: 'Connect to 5000+ apps without code using Zapier webhooks.', features: ['Webhook triggers', '5000+ app ecosystem', 'Custom Zaps', 'Conditional logic'] },
];

const categoryColors: Record<string, string> = {
  HRMS: 'blue', ATS: 'green', LMS: 'purple', Identity: 'red',
  Comms: 'yellow', CRM: 'blue', ERP: 'gray', Analytics: 'indigo', Automation: 'orange',
};

const statusIcon: Record<IntegrationStatus, React.ReactNode> = {
  connected:    <CheckCircle2 size={16} className="text-emerald-500" />,
  disconnected: <AlertCircle  size={16} className="text-gray-400" />,
  pending:      <Clock        size={16} className="text-yellow-500" />,
  error:        <AlertCircle  size={16} className="text-red-500" />,
};

export default function IntegrationsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Integration | null>(null);

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];
  const filtered   = filter === 'all' ? integrations : integrations.filter(i => i.category === filter);
  const connected  = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integration Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Connect LeaderAssess to your enterprise ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="green" size="md" dot>{connected} connected</Badge>
          <Button size="sm" icon={<Plus size={15} />}>Add Integration</Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Connected',     value: connected, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Available',     value: integrations.length, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Pending Setup', value: integrations.filter(i => i.status === 'pending').length, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Errors',        value: integrations.filter(i => i.status === 'error').length, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <Card key={s.label} padding="sm">
            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === cat
                ? 'bg-gray-900 text-white'
                : 'bg-frost-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-frost-200 dark:hover:bg-gray-700'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((int, i) => (
          <motion.div key={int.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card hover onClick={() => setSelected(int)} className="h-full cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{int.icon}</span>
                <div className="flex items-center gap-1">
                  {statusIcon[int.status]}
                  <Badge color={
                    int.status === 'connected' ? 'green' :
                    int.status === 'pending'   ? 'yellow' :
                    int.status === 'error'     ? 'red' : 'gray'
                  } size="sm">{int.status}</Badge>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{int.name}</h3>
              <Badge color={(categoryColors[int.category] || 'gray') as 'blue' | 'gray' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'orange'} size="sm" className="mb-2">{int.category}</Badge>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">{int.desc}</p>
              {int.lastSync && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <RefreshCw size={9} /> Synced {int.lastSync}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Webhook section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap size={18} className="text-yellow-500" />Webhook Events</CardTitle>
          <Badge color="gray" size="md">REST API</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { event: 'assessment.started',   desc: 'Fired when a candidate begins an assessment', method: 'POST' },
            { event: 'assessment.completed', desc: 'Fired on submission with full score payload', method: 'POST' },
            { event: 'proctor.violation',    desc: 'Fired when a proctoring violation is detected', method: 'POST' },
            { event: 'user.invited',         desc: 'New candidate invited to the platform', method: 'POST' },
            { event: 'config.updated',       desc: 'Assessment configuration changed by admin', method: 'POST' },
            { event: 'report.generated',     desc: 'New performance report available', method: 'POST' },
          ].map(w => (
            <div key={w.event} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded font-mono">{w.method}</span>
                <span className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{w.event}</span>
              </div>
              <p className="text-xs text-gray-500">{w.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Integration detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            {selected?.status === 'connected'
              ? <Button variant="danger">Disconnect</Button>
              : <Button>Connect</Button>
            }
          </>
        }>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selected.icon}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={(categoryColors[selected.category] || 'gray') as 'blue' | 'gray' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'orange'} size="sm">{selected.category}</Badge>
                  <Badge color={selected.status === 'connected' ? 'green' : selected.status === 'error' ? 'red' : 'yellow'} size="sm" dot>
                    {selected.status}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selected.desc}</p>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Features</p>
              <ul className="space-y-2">
                {selected.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            {selected.lastSync && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <RefreshCw size={14} /> Last synchronized: {selected.lastSync}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
