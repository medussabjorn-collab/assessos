'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import axios from 'axios';
import { Loader, Save } from 'lucide-react';

interface WhiteLabelSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  customDomain?: string;
  faviconUrl?: string;
}

export default function OrganizationSettings() {
  const { user, tenantId } = useContext(AuthContext);
  const [settings, setSettings] = useState<WhiteLabelSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          'http://localhost:3000/api/settings/white-label/admin',
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          },
        );
        setSettings(response.data.data || {});
        setLoading(false);
      } catch (err) {
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, tenantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post('http://localhost:3000/api/settings/white-label', settings, {
        headers: {
          'x-tenant-id': tenantId,
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        White-Label Settings
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Settings saved successfully
        </div>
      )}

      <div className="space-y-6 bg-white rounded-lg shadow-md p-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={settings.companyName || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            name="logoUrl"
            value={settings.logoUrl || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="https://example.com/logo.png"
          />
          {settings.logoUrl && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <img
                src={settings.logoUrl}
                alt="Logo preview"
                className="max-h-16"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="primaryColor"
                value={settings.primaryColor || '#3B82F6'}
                onChange={handleInputChange}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor || '#3B82F6'}
                onChange={handleInputChange}
                name="primaryColor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="secondaryColor"
                value={settings.secondaryColor || '#8B5CF6'}
                onChange={handleInputChange}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondaryColor || '#8B5CF6'}
                onChange={handleInputChange}
                name="secondaryColor"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Custom Domain
          </label>
          <input
            type="text"
            name="customDomain"
            value={settings.customDomain || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="assessments.yourcompany.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Configure DNS CNAME record to point to assessos.app
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email From Name
            </label>
            <input
              type="text"
              name="emailFromName"
              value={settings.emailFromName || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Your Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email From Address
            </label>
            <input
              type="email"
              name="emailFromAddress"
              value={settings.emailFromAddress || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="noreply@yourcompany.com"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
