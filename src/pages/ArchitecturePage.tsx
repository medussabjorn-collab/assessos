import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Database, Shield, Cpu, Globe, Zap, MessageSquare,
  FileText, Activity, Cloud, Lock, GitBranch, ChevronRight,
  Layers, Radio, BarChart3, Search, HardDrive, Wifi, Box
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

type Layer = 'client' | 'edge' | 'gateway' | 'services' | 'events' | 'data' | 'ai' | null;

const services = [
  { id: 'auth',         name: 'Auth Service',         icon: Shield,       color: 'from-blue-500 to-cyan-500',    desc: 'OAuth, MFA, JWT, SAML SSO, RBAC enforcement' },
  { id: 'assessment',   name: 'Assessment Service',   icon: FileText,     color: 'from-brand-500 to-purple-500', desc: 'Session lifecycle, adaptive difficulty, answer submission' },
  { id: 'question',     name: 'Question Bank',        icon: Database,     color: 'from-emerald-500 to-teal-500', desc: '1000 MCQs/module, tagging, versioning, ElasticSearch indexed' },
  { id: 'proctoring',   name: 'Proctoring Service',   icon: Cpu,          color: 'from-red-500 to-rose-500',     desc: 'WebRTC frames → ML inference → anomaly scoring' },
  { id: 'reporting',    name: 'Reporting Service',    icon: BarChart3,    color: 'from-yellow-500 to-orange-500', desc: 'Aggregated results, AI insights, PDF generation' },
  { id: 'notification', name: 'Notification Service', icon: MessageSquare, color: 'from-pink-500 to-fuchsia-500', desc: 'WebSockets, push alerts, event-driven triggers' },
  { id: 'audit',        name: 'Audit Service',        icon: Activity,     color: 'from-gray-500 to-slate-500',   desc: 'Immutable log of every action, GDPR compliant' },
  { id: 'config',       name: 'Config Service',       icon: Layers,       color: 'from-indigo-500 to-violet-500', desc: 'Assessment configs, feature flags, scoring patterns' },
];

const databases = [
  { name: 'PostgreSQL', icon: Database, use: 'Users, RBAC, assessments, audit logs', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'MongoDB',    icon: Database, use: 'Question bank — flexible schema per module', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { name: 'Redis',      icon: Zap,      use: 'Sessions, timers, cached questions, offline queue', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  { name: 'ElasticSearch', icon: Search, use: 'Full-text search, tag/difficulty filtering', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { name: 'S3 / Blob', icon: Cloud,    use: 'Webcam snapshots, video clips, PDFs', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const mlModels = [
  { fn: 'Face Detection',     model: 'MediaPipe / OpenCV',   icon: '👁' },
  { fn: 'Eye Tracking',       model: 'Gaze Estimation CNN',  icon: '👀' },
  { fn: 'Object Detection',   model: 'YOLOv8',               icon: '🔍' },
  { fn: 'Audio Analysis',     model: 'Whisper STT',          icon: '🎙' },
  { fn: 'Multi-face',         model: 'FaceNet / DeepFace',   icon: '👥' },
  { fn: 'AI Insights',        model: 'GPT-4 / Gemini',       icon: '🧠' },
];

const devopsStack = [
  { label: 'Orchestration', value: 'Kubernetes (AKS/EKS/GKE)', icon: Box },
  { label: 'CI/CD', value: 'GitHub Actions + ArgoCD', icon: GitBranch },
  { label: 'Logging', value: 'ELK Stack (Elasticsearch, Logstash, Kibana)', icon: FileText },
  { label: 'Metrics', value: 'Prometheus + Grafana', icon: BarChart3 },
  { label: 'Tracing', value: 'OpenTelemetry + Jaeger', icon: Radio },
  { label: 'Alerts', value: 'PagerDuty + Slack', icon: MessageSquare },
];

const events = [
  { name: 'exam.started',        color: 'bg-blue-500' },
  { name: 'question.served',     color: 'bg-cyan-500' },
  { name: 'answer.submitted',    color: 'bg-emerald-500' },
  { name: 'exam.completed',      color: 'bg-purple-500' },
  { name: 'proctor.warning',     color: 'bg-yellow-500' },
  { name: 'proctor.violation',   color: 'bg-red-500' },
  { name: 'session.synced',      color: 'bg-teal-500' },
  { name: 'notification.sent',   color: 'bg-pink-500' },
];

const integrations = [
  { name: 'Workday',    type: 'HRMS',  icon: '👔', desc: 'Employee onboarding sync' },
  { name: 'Greenhouse', type: 'ATS',   icon: '🌱', desc: 'Candidate pipeline' },
  { name: 'Moodle',     type: 'LMS',   icon: '📚', desc: 'Course completion data' },
  { name: 'Slack',      type: 'Comms', icon: '💬', desc: 'Real-time alerts' },
  { name: 'Okta',       type: 'IdP',   icon: '🔐', desc: 'SSO & identity' },
  { name: 'Salesforce', type: 'CRM',   icon: '☁️', desc: 'Leadership pipeline' },
];

const FlowArrow = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center my-1">
    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
    {label && <span className="text-[10px] text-gray-400 font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 mb-0.5">{label}</span>}
    <svg width="12" height="8" viewBox="0 0 12 8" className="text-gray-400 dark:text-gray-600">
      <path d="M6 8L0 0h12z" fill="currentColor"/>
    </svg>
  </div>
);

const LayerBlock = ({
  label, sublabel, color, icon: Icon, active, onClick, children
}: {
  label: string; sublabel?: string; color: string; icon: React.ComponentType<{ size?: number | string; className?: string }>;
  active?: boolean; onClick?: () => void; children?: React.ReactNode;
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    onClick={onClick}
    className={`rounded-2xl border-2 transition-all cursor-pointer ${active ? 'border-brand-500 shadow-glow' : 'border-gray-200 dark:border-gray-800'}`}
  >
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-white flex-shrink-0" />
        <div>
          <p className="font-semibold text-white text-sm">{label}</p>
          {sublabel && <p className="text-white/70 text-xs">{sublabel}</p>}
        </div>
      </div>
      {children}
    </div>
  </motion.div>
);

export default function ArchitecturePage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<Layer>(null);

  const selected = services.find(s => s.id === selectedService);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Architecture</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">FAANG-style enterprise architecture blueprint</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge color="blue" size="md">Microservices</Badge>
            <Badge color="green" size="md">Event-Driven</Badge>
            <Badge color="purple" size="md">Kubernetes</Badge>
            <Badge color="indigo" size="md">Zero Trust</Badge>
          </div>
        </div>
      </motion.div>

      {/* End-to-End Flow Diagram */}
      <Card>
        <CardHeader><CardTitle className="text-lg">End-to-End Architecture Flow</CardTitle></CardHeader>
        <div className="flex flex-col items-center gap-0 py-4">
          {/* Client */}
          <LayerBlock label="Client Layer" sublabel="Browser · Desktop · Mobile (PWA, Offline-first)"
            color="bg-gradient-to-r from-gray-700 to-gray-800"
            icon={Globe} active={activeLayer === 'client'} onClick={() => setActiveLayer(activeLayer === 'client' ? null : 'client')}>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['React 18 + TypeScript','Monaco Editor','IndexedDB','Service Worker','WebRTC'].map(t => (
                <span key={t} className="text-[10px] bg-white/15 text-white/80 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </LayerBlock>

          <FlowArrow label="HTTPS / TLS 1.3" />

          {/* Edge */}
          <LayerBlock label="CDN + Edge Layer" sublabel="CloudFront · Azure Front Door · Cloudflare"
            color="bg-gradient-to-r from-blue-600 to-cyan-600"
            icon={Cloud} active={activeLayer === 'edge'} onClick={() => setActiveLayer(activeLayer === 'edge' ? null : 'edge')}>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['DDoS Protection','WAF','Geo-routing','TLS Termination','Static Assets'].map(t => (
                <span key={t} className="text-[10px] bg-white/15 text-white/80 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </LayerBlock>

          <FlowArrow label="Rate-limited requests" />

          {/* API Gateway */}
          <LayerBlock label="API Gateway" sublabel="Auth · Rate Limiting · Routing · Circuit Breaker"
            color="bg-gradient-to-r from-brand-600 to-purple-600"
            icon={Shield} active={activeLayer === 'gateway'} onClick={() => setActiveLayer(activeLayer === 'gateway' ? null : 'gateway')}>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['JWT Validation','RBAC Check','Request Throttling','Load Balancing','OpenAPI Docs'].map(t => (
                <span key={t} className="text-[10px] bg-white/15 text-white/80 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </LayerBlock>

          <FlowArrow label="gRPC / REST" />

          {/* Microservices */}
          <div className="w-full">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">Microservices Layer</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {services.map((svc) => (
                  <motion.button key={svc.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedService(selectedService === svc.id ? null : svc.id)}
                    className={`rounded-xl p-3 text-left transition-all border-2 ${
                      selectedService === svc.id
                        ? 'border-brand-500 shadow-glow'
                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    } bg-gradient-to-br ${svc.color}`}>
                    <svc.icon size={16} className="text-white mb-1.5" />
                    <p className="text-white font-semibold text-xs leading-tight">{svc.name}</p>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {selected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{selected.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selected.desc}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <FlowArrow label="Kafka / Pub-Sub" />

          {/* Event Bus */}
          <div className="w-full">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Radio size={16} className="text-white" />
                <p className="font-semibold text-white text-sm">Event Bus (Kafka / Google Pub-Sub)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {events.map(e => (
                  <span key={e.name} className={`text-[10px] font-mono text-white px-2 py-1 rounded-lg ${e.color}`}>
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <FlowArrow label="Queries & Writes" />

          {/* Data Layer */}
          <div className="w-full">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">Polyglot Data Layer</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {databases.map(db => (
                  <div key={db.name} className={`rounded-xl p-3 ${db.bg} border border-gray-200 dark:border-gray-700`}>
                    <db.icon size={16} className={`${db.color} mb-1.5`} />
                    <p className={`font-semibold text-sm ${db.color}`}>{db.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{db.use}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <FlowArrow label="Model Inference" />

          {/* AI Layer */}
          <LayerBlock label="AI / ML Inference Layer" sublabel="GPU cluster · Model serving · LLM insights engine"
            color="bg-gradient-to-r from-violet-600 to-purple-700"
            icon={Cpu}>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {mlModels.map(m => (
                <div key={m.fn} className="bg-white/10 rounded-lg p-2">
                  <p className="text-lg">{m.icon}</p>
                  <p className="text-white text-[10px] font-semibold">{m.fn}</p>
                  <p className="text-white/60 text-[9px]">{m.model}</p>
                </div>
              ))}
            </div>
          </LayerBlock>
        </div>
      </Card>

      {/* Security Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock size={18} className="text-brand-500" />Zero-Trust Security Architecture</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Identity & Access', color: 'blue', items: ['JWT + refresh tokens','OAuth 2.0 (Google, MS)','SAML 2.0 SSO (Okta)','MFA (OTP + device)','RBAC + ABAC'] },
            { title: 'Encryption', color: 'green', items: ['AES-256 at rest','TLS 1.3 in transit','E2E answer encryption','Key rotation (KMS)','IndexedDB XOR offline'] },
            { title: 'Network Security', color: 'purple', items: ['WAF rules','DDoS mitigation','IP allowlisting','Geo-fencing','VPN detection'] },
            { title: 'Device Security', color: 'red', items: ['Device fingerprinting','Browser integrity checks','Screen capture detection','VM/emulator detection','Trusted Platform Module'] },
            { title: 'Compliance', color: 'yellow', items: ['GDPR Article 17 (erasure)','SOC 2 Type II','ISO 27001 controls','CCPA compliance','Data residency policies'] },
            { title: 'Monitoring', color: 'indigo', items: ['SIEM integration','Anomaly detection','Failed auth alerting','Session hijack detection','Real-time threat scoring'] },
          ].map(section => (
            <div key={section.title} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className={`text-${section.color}-500`} />
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{section.title}</p>
              </div>
              <ul className="space-y-1.5">
                {section.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${section.color}-500 flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Adaptive Testing (IRT) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu size={18} className="text-purple-500" />Adaptive Assessment Engine — IRT</CardTitle>
          <Badge color="purple" size="md">3-PL Model</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Item Response Theory Flow</h3>
            <div className="space-y-2">
              {[
                { step: '1', desc: 'Candidate starts at θ = 0 (average ability)', color: 'bg-gray-500' },
                { step: '2', desc: 'Engine selects question maximizing Fisher Information at θ', color: 'bg-blue-500' },
                { step: '3', desc: 'Candidate answers → MLE updates θ via Newton-Raphson', color: 'bg-brand-500' },
                { step: '4', desc: 'If correct → θ increases (harder questions served)', color: 'bg-emerald-500' },
                { step: '5', desc: 'If wrong → θ decreases (easier questions served)', color: 'bg-yellow-500' },
                { step: '6', desc: 'Terminate when SE(θ) < 0.3 OR min questions reached', color: 'bg-purple-500' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{s.step}</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="font-mono text-xs text-brand-600 dark:text-brand-400 mb-2">3-PL ICC Formula</p>
              <p className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                P(θ) = c + (1-c) / (1 + e^(−1.702·a·(θ−b)))
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center"><p className="font-bold text-gray-900 dark:text-white">a</p><p className="text-gray-500">Discrimination</p></div>
                <div className="text-center"><p className="font-bold text-gray-900 dark:text-white">b</p><p className="text-gray-500">Difficulty</p></div>
                <div className="text-center"><p className="font-bold text-gray-900 dark:text-white">c</p><p className="text-gray-500">Guessing</p></div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <p className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2">Ability Classification</p>
              <div className="space-y-1.5">
                {[
                  { theta: 'θ ≥ 2.0', level: 'Expert',      color: 'text-emerald-600' },
                  { theta: 'θ ≥ 1.0', level: 'Proficient',  color: 'text-blue-600' },
                  { theta: 'θ ≥ 0.0', level: 'Competent',   color: 'text-brand-600' },
                  { theta: 'θ ≥ −1.0', level: 'Developing', color: 'text-yellow-600' },
                  { theta: 'θ < −1.0', level: 'Novice',     color: 'text-red-500' },
                ].map(r => (
                  <div key={r.level} className="flex justify-between text-xs">
                    <span className="font-mono text-gray-500">{r.theta}</span>
                    <span className={`font-semibold ${r.color}`}>{r.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* DevOps & Observability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server size={18} className="text-blue-500" />DevOps & Infra</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {devopsStack.map(s => (
              <div key={s.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <s.icon size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.value}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap pt-1">
              {['Blue/Green Deploy','Canary Releases','Auto-scaling','Health Probes','HPA'].map(t => (
                <Badge key={t} color="blue" size="sm">{t}</Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wifi size={18} className="text-emerald-500" />Offline-First Architecture</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { step: 'Capture', desc: 'Answers stored in IndexedDB with XOR encryption', icon: HardDrive },
              { step: 'Queue', desc: 'Offline sync queue with timestamps & retry logic', icon: Layers },
              { step: 'Detect', desc: 'navigator.onLine + network change events monitored', icon: Wifi },
              { step: 'Sync', desc: 'Auto-sync on reconnect with conflict resolution', icon: Radio },
              { step: 'Resolve', desc: 'Server-wins merge strategy + audit log of conflicts', icon: GitBranch },
              { step: 'Clean', desc: 'Pruned synced entries to free IndexedDB storage', icon: Zap },
            ].map((s, i) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <s.icon size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.step}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Enterprise Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe size={18} className="text-brand-500" />Enterprise Integration Hub</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map(int => (
            <motion.div key={int.name} whileHover={{ y: -4 }}
              className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer">
              <p className="text-3xl mb-2">{int.icon}</p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{int.name}</p>
              <Badge color="gray" size="sm" className="mt-1">{int.type}</Badge>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{int.desc}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* FAANG Checklist */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">FAANG-Level Production Checklist</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            'Microservices + Event-Driven',
            'Polyglot Database Strategy',
            'AI Proctoring Pipeline',
            'Adaptive Testing (IRT)',
            'Zero-Trust Security',
            'Full Observability Stack',
            'Offline-First (IndexedDB)',
            'Enterprise Integrations',
            'Kubernetes + Docker',
            'CI/CD + Canary Deploy',
            'GDPR / SOC 2 Compliance',
            'Horizontal Auto-scaling',
          ].map(item => (
            <div key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-xs text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
