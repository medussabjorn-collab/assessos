'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Loader, Save } from 'lucide-react';

interface SsoConfig {
  enabled: boolean;
  providerId: string;
  providerType: 'saml' | 'oidc';
  displayName: string;
  domain?: string;
}

const EMPTY_CONFIG: SsoConfig = {
  enabled: false,
  providerId: '',
  providerType: 'saml',
  displayName: '',
  domain: '',
};

// Mirrors apps/api/src/modules/tenant/sso-config.service.ts / settings.controller.ts.
// This page only maps a tenant + email domain to a Firebase Identity
// Platform provider ID — Firebase handles the actual SAML/OIDC handshake
// once that provider is configured in the Firebase Console. Saving a
// providerId here does nothing on its own until that console-side setup
// exists; this is the tenant-side half of a two-part configuration.
export default function SsoSettings() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.TENANT_SSO_MANAGE);

  const [config, setConfig] = useState<SsoConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    api
      .get('/api/settings/sso')
      .then((res) => setConfig(res.data.data ?? EMPTY_CONFIG))
      .catch(() => setError('Failed to load SSO settings'))
      .finally(() => setLoading(false));
  }, [canManage]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api.post('/api/settings/sso', config);
      setConfig(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save SSO settings');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return <p className="text-sm text-subtle">Only org admins can manage SSO settings.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Single Sign-On</h2>
      <p className="text-sm text-gray-600 mb-6">
        Maps your organization to a SAML/OIDC provider configured in Firebase Identity Platform.
        Firebase handles the actual sign-in handshake once that provider exists in the Firebase
        Console — this only tells AssessOS which provider ID belongs to your domain.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          SSO settings saved
        </div>
      )}

      <div className="space-y-6 bg-white rounded-lg shadow-md p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-900">Enable SSO for this organization</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Provider Type</label>
          <select
            value={config.providerType}
            onChange={(e) => setConfig((c) => ({ ...c, providerType: e.target.value as 'saml' | 'oidc' }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="saml">SAML</option>
            <option value="oidc">OIDC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Firebase Provider ID
          </label>
          <input
            type="text"
            value={config.providerId}
            onChange={(e) => setConfig((c) => ({ ...c, providerId: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            placeholder="saml.your-idp-name"
          />
          <p className="text-xs text-gray-500 mt-1">
            The provider ID exactly as configured in Firebase Console → Authentication → Sign-in method.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Sign-in Button Text</label>
          <input
            type="text"
            value={config.displayName}
            onChange={(e) => setConfig((c) => ({ ...c, displayName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Sign in with Okta"
          />
          <p className="text-xs text-gray-500 mt-1">
            The complete label shown on the sign-in button — write the full phrase, e.g. &quot;Sign in with Okta&quot;.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Email Domain</label>
          <input
            type="text"
            value={config.domain ?? ''}
            onChange={(e) => setConfig((c) => ({ ...c, domain: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="yourcompany.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Users signing in with this email domain are routed to your SSO provider automatically.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !config.providerId || !config.displayName}
          className="w-full flex items-center justify-center gap-2 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
