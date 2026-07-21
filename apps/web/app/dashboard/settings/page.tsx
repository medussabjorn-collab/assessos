'use client';

import { useState } from 'react';
import OrganizationSettings from '@/components/OrganizationSettings';
import { api } from '@/lib/api';
import { Settings, Palette, CreditCard, ShieldCheck, Download } from 'lucide-react';

type SettingsTab = 'organization' | 'branding' | 'billing' | 'privacy';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'organization', label: 'Organization', icon: Settings },
    { id: 'branding', label: 'White-Label', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  ];

  const downloadMyData = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await api.get('/api/compliance/me/data-export');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Could not export your data. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your organization and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8 border-b border-gray-200">
          <div className="flex gap-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-brand-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {activeTab === 'organization' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Organization Settings
              </h2>
              <p className="text-gray-600 mb-6">
                Coming soon: Manage team members, departments, and organizational settings
              </p>
            </div>
          )}

          {activeTab === 'branding' && <OrganizationSettings />}

          {activeTab === 'billing' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Billing & Subscription
              </h2>
              <p className="text-gray-600 mb-6">
                Coming soon: Manage subscription, invoices, and payment methods
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Privacy & Data</h2>
              <p className="text-gray-600 mb-6">
                Download a copy of everything this platform holds that&apos;s attributable to you —
                assessment sessions, AI reports, psychometric results, feedback received, and any
                review requests you&apos;ve made.
              </p>
              <button
                onClick={downloadMyData}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Preparing export…' : 'Download my data'}
              </button>
              {exportError && <p className="text-sm text-red-500 mt-2">{exportError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
