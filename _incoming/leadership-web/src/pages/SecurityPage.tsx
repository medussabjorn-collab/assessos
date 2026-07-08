import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';

const securityScore = 94;

const checks = [
  { category: 'Authentication',  items: [
    { name: 'JWT + Refresh Tokens', status: 'pass', detail: 'RS256, 15m TTL, 7d refresh' },
    { name: 'OAuth 2.0 (Google, Microsoft)', status: 'pass', detail: 'PKCE flow enabled' },
    { name: 'SAML 2.0 SSO', status: 'pass', detail: 'Okta, Azure AD supported' },
    { name: 'MFA Enforcement', status: 'pass', detail: 'TOTP + device-based' },
    { name: 'Brute-force Protection', status: 'pass', detail: '5 attempts → 15m lockout' },
  ]},
  { category: 'Encryption', items: [
    { name: 'Data at Rest', status: 'pass', detail: 'AES-256-GCM, KMS-managed keys' },
    { name: 'Data in Transit', status: 'pass', detail: 'TLS 1.3 only, HSTS enabled' },
    { name: 'Answer Encryption', status: 'pass', detail: 'E2E encrypted before IndexedDB' },
    { name: 'Key Rotation', status: 'pass', detail: 'Automated 90-day rotation' },
    { name: 'DB Column Encryption', status: 'warning', detail: 'PII columns — partial coverage' },
  ]},
  { category: 'Access Control', items: [
    { name: 'RBAC Implementation', status: 'pass', detail: 'admin / candidate / viewer' },
    { name: 'ABAC (Attribute-based)', status: 'pass', detail: 'Department + location policies' },
    { name: 'Principle of Least Privilege', status: 'pass', detail: 'Service accounts scoped' },
    { name: 'API Rate Limiting', status: 'pass', detail: '100 req/min per IP, 1000/user' },
    { name: 'Session Invalidation', status: 'pass', detail: 'Server-side revocation on logout' },
  ]},
  { category: 'Network Security', items: [
    { name: 'WAF Rules', status: 'pass', detail: 'OWASP Top 10 coverage' },
    { name: 'DDoS Mitigation', status: 'pass', detail: 'CloudFlare Magic Transit' },
    { name: 'IP Allowlisting', status: 'pass', detail: 'Admin console restricted' },
    { name: 'Geo-fencing', status: 'pass', detail: 'Configurable per assessment' },
    { name: 'VPN Detection', status: 'warning', detail: 'Heuristic-based, not perfect' },
  ]},
  { category: 'Compliance', items: [
    { name: 'GDPR Article 17 (Right to Erasure)', status: 'pass', detail: 'Automated data deletion pipeline' },
    { name: 'GDPR Article 20 (Portability)', status: 'pass', detail: 'JSON/CSV export available' },
    { name: 'SOC 2 Type II', status: 'pass', detail: 'Annual audit, trust service criteria' },
    { name: 'CCPA Compliance', status: 'pass', detail: 'Do-not-sell + opt-out flows' },
    { name: 'ISO 27001 Controls', status: 'warning', detail: 'Certification in progress' },
  ]},
];

const threatMatrix = [
  { threat: 'SQL Injection',        risk: 'Critical', mitigation: 'Parameterized queries, ORM, WAF', status: 'mitigated' },
  { threat: 'XSS',                  risk: 'High',     mitigation: 'CSP headers, input sanitization, DOMPurify', status: 'mitigated' },
  { threat: 'CSRF',                 risk: 'High',     mitigation: 'SameSite cookies, CSRF tokens', status: 'mitigated' },
  { threat: 'Answer Spoofing',      risk: 'Critical', mitigation: 'Server-side scoring, signed submissions', status: 'mitigated' },
  { threat: 'Session Hijacking',    risk: 'High',     mitigation: 'Secure/HttpOnly cookies, fingerprinting', status: 'mitigated' },
  { threat: 'IDOR',                 risk: 'High',     mitigation: 'Resource-level authorization checks', status: 'mitigated' },
  { threat: 'Brute Force',          risk: 'Medium',   mitigation: 'Rate limiting, account lockout, CAPTCHA', status: 'mitigated' },
  { threat: 'Data Exfiltration',    risk: 'High',     mitigation: 'DLP policies, egress filtering', status: 'partial' },
  { threat: 'Insider Threat',       risk: 'Medium',   mitigation: 'Audit logs, MFA, least privilege', status: 'mitigated' },
  { threat: 'Supply Chain Attack',  risk: 'Medium',   mitigation: 'SBOM, dependency scanning, pinned versions', status: 'partial' },
];

export default function SecurityPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allItems = checks.flatMap(c => c.items);
  const passed   = allItems.filter(i => i.status === 'pass').length;
  const warned   = allItems.filter(i => i.status === 'warning').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Architecture</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Zero-trust enterprise security posture</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge color="green" size="md">SOC 2 Type II</Badge>
          <Badge color="blue" size="md">GDPR Compliant</Badge>
          <Badge color="indigo" size="md">Zero Trust</Badge>
        </div>
      </motion.div>

      {/* Security score */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Overall Security Score</p>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-bold text-white tabular-nums">{securityScore}</span>
              <span className="text-gray-400 text-xl mb-2">/100</span>
              <Badge color="green" size="md" className="mb-3">Excellent</Badge>
            </div>
            <ProgressBar value={securityScore} size="md" color="green" className="mt-2 max-w-xs" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Passed', value: passed, color: 'text-emerald-400' },
              { label: 'Warnings', value: warned, color: 'text-yellow-400' },
              { label: 'Categories', value: checks.length, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Security checks */}
      <div className="space-y-4">
        {checks.map((cat, i) => (
          <motion.div key={cat.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card hover onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    cat.items.every(c => c.status === 'pass')
                      ? 'bg-emerald-100 dark:bg-emerald-900/20'
                      : 'bg-yellow-100 dark:bg-yellow-900/20'
                  }`}>
                    <Shield size={16} className={cat.items.every(c => c.status === 'pass') ? 'text-emerald-600' : 'text-yellow-600'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{cat.category}</p>
                    <p className="text-xs text-gray-500">
                      {cat.items.filter(c => c.status === 'pass').length}/{cat.items.length} checks passed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={cat.items.filter(c => c.status === 'pass').length}
                    max={cat.items.length}
                    size="xs" color="green" animated={false}
                    className="w-24 hidden sm:flex"
                  />
                  <span className={`text-lg transition-transform ${activeCategory === cat.category ? 'rotate-90' : ''}`}>›</span>
                </div>
              </div>

              {activeCategory === cat.category && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2 overflow-hidden">
                  {cat.items.map(item => (
                    <div key={item.name}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                      {item.status === 'pass'
                        ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.detail}</p>
                      </div>
                      <Badge color={item.status === 'pass' ? 'green' : 'yellow'} size="sm" className="ml-auto flex-shrink-0">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Threat Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" />Threat Mitigation Matrix</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Threat', 'Risk Level', 'Mitigation', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {threatMatrix.map(t => (
                <tr key={t.threat} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{t.threat}</td>
                  <td className="py-3 px-3">
                    <Badge color={t.risk === 'Critical' ? 'red' : t.risk === 'High' ? 'orange' : 'yellow'} size="sm">
                      {t.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-400 text-xs">{t.mitigation}</td>
                  <td className="py-3 px-3">
                    <Badge color={t.status === 'mitigated' ? 'green' : 'yellow'} size="sm" dot>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
