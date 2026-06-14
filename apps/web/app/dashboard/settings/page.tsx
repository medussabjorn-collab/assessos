'use client';

import { useState } from 'react';
import OrganizationSettings from '@/components/OrganizationSettings';
import { Settings, Palette, CreditCard } from 'lucide-react';

type SettingsTab = 'organization' | 'branding' | 'billing';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'organization', label: 'Organization', icon: Settings },
    { id: 'branding', label: 'White-Label', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

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
                      ? 'border-blue-600 text-blue-600'
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
        </div>
      </div>
    </div>
  );
}
