import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Server, Database,
  Cpu, TrendingUp, TrendingDown, Minus, Radio, Zap, BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const generateSeries = (points: number, base: number, variance: number) =>
  Array.from({ length: points }, () => rand(base - variance, base + variance));

const SERVICES = [
  { name: 'Auth Service',       status: 'healthy', latency: 42,  rps: 847,  cpu: 23, memory: 41 },
  { name: 'Assessment Service', status: 'healthy', latency: 89,  rps: 1240, cpu: 45, memory: 62 },
  { name: 'Question Bank',      status: 'healthy', latency: 31,  rps: 3200, cpu: 18, memory: 35 },
  { name: 'Proctoring Service', status: 'warning', latency: 210, rps: 420,  cpu: 78, memory: 71 },
  { name: 'Reporting Service',  status: 'healthy', latency: 156, rps: 230,  cpu: 31, memory: 48 },
  { name: 'Notification Svc',   status: 'healthy', latency: 28,  rps: 560,  cpu: 12, memory: 22 },
];

const LABELS = Array.from({ length: 20 }, (_, i) => `${i}m`);

export default function ObservabilityPage() {
  const { isDark } = useTheme();
  const [tick, setTick] = useState(0);
  const [metrics, setMetrics] = useState({
    rps:    generateSeries(20, 5200, 800),
    latency: generateSeries(20, 85, 30),
    errors: generateSeries(20, 12, 8),
    cpu:    generateSeries(20, 42, 15),
  });

  // Simulate live metrics
  useEffect(() => {
    const t = setInterval(() => {
      setTick(n => n + 1);
      setMetrics(prev => ({
        rps:     [...prev.rps.slice(1), rand(4200, 6800)],
        latency: [...prev.latency.slice(1), rand(55, 135)],
        errors:  [...prev.errors.slice(1), rand(2, 25)],
        cpu:     [...prev.cpu.slice(1), rand(28, 65)],
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#1f2937' : '#f3f4f6';

  const makeChart = (data: number[], color: string, fill = false) => ({
    labels: LABELS,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: fill ? color.replace(')', ', 0.15)').replace('rgb', 'rgba') : 'transparent',
      borderWidth: 2,
      tension: 0.4,
      fill,
      pointRadius: 0,
    }],
  });

  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
    scales: {
      x: { ticks: { color: textColor, maxTicksLimit: 5 }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };

  const currentRps    = metrics.rps[metrics.rps.length - 1];
  const currentLatency = metrics.latency[metrics.latency.length - 1];
  const currentErrors = metrics.errors[metrics.errors.length - 1];
  const currentCpu    = metrics.cpu[metrics.cpu.length - 1];
  const errorRate     = ((currentErrors / currentRps) * 100).toFixed(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Observability Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time platform health · Prometheus · OpenTelemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
          <Badge color="gray" size="sm">Updated {tick}s ago</Badge>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Requests / sec', value: currentRps.toLocaleString(), icon: Zap, trend: 'up', color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20', chart: metrics.rps, chartColor: 'rgb(99,102,241)' },
          { label: 'P99 Latency', value: `${currentLatency}ms`, icon: Clock, trend: currentLatency > 100 ? 'down' : 'up', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', chart: metrics.latency, chartColor: 'rgb(59,130,246)' },
          { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, trend: 'up', color: `${Number(errorRate) > 0.5 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`, chart: metrics.errors, chartColor: 'rgb(239,68,68)' },
          { label: 'Avg CPU', value: `${currentCpu}%`, icon: Cpu, trend: currentCpu > 60 ? 'down' : 'neutral', color: `${currentCpu > 70 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'}`, chart: metrics.cpu, chartColor: 'rgb(245,158,11)' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl ${m.color}`}><m.icon size={16} /></div>
                {m.trend === 'up'      && <TrendingUp  size={14} className="text-emerald-500" />}
                {m.trend === 'down'    && <TrendingDown size={14} className="text-red-500" />}
                {m.trend === 'neutral' && <Minus        size={14} className="text-gray-400" />}
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
              <div className="h-10 mt-2">
                <Line data={makeChart(m.chart, m.chartColor, true)} options={{ ...chartOpts, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Request Throughput (RPS)</CardTitle></CardHeader>
          <div className="h-48">
            <Line data={makeChart(metrics.rps, 'rgb(99,102,241)', true)} options={chartOpts} />
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>P99 Latency (ms)</CardTitle></CardHeader>
          <div className="h-48">
            <Line data={makeChart(metrics.latency, 'rgb(59,130,246)', true)} options={chartOpts} />
          </div>
        </Card>
      </div>

      {/* Service health table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Matrix</CardTitle>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
            <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" /> Warning
            <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> Critical
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Service', 'Status', 'Latency', 'RPS', 'CPU', 'Memory', 'Uptime'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {SERVICES.map(svc => (
                <tr key={svc.name} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{svc.name}</td>
                  <td className="py-3 px-3">
                    <Badge color={svc.status === 'healthy' ? 'green' : svc.status === 'warning' ? 'yellow' : 'red'} size="sm" dot>
                      {svc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 tabular-nums text-gray-600 dark:text-gray-400">
                    <span className={svc.latency > 150 ? 'text-yellow-600' : 'text-emerald-600'}>{svc.latency}ms</span>
                  </td>
                  <td className="py-3 px-3 tabular-nums text-gray-600 dark:text-gray-400">{svc.rps.toLocaleString()}</td>
                  <td className="py-3 px-3 min-w-24">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={svc.cpu} size="xs" color={svc.cpu > 70 ? 'red' : svc.cpu > 50 ? 'yellow' : 'green'} animated={false} />
                      <span className="text-xs tabular-nums text-gray-500 w-8">{svc.cpu}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 min-w-24">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={svc.memory} size="xs" color={svc.memory > 80 ? 'red' : svc.memory > 60 ? 'yellow' : 'green'} animated={false} />
                      <span className="text-xs tabular-nums text-gray-500 w-8">{svc.memory}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">99.97%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tracing + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Radio size={16} className="text-brand-500" />Distributed Traces</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { traceId: 'abc123', op: 'POST /api/assessment/submit', duration: '89ms', spans: 7, status: 'ok' },
              { traceId: 'def456', op: 'GET /api/questions?module=technical', duration: '31ms', spans: 4, status: 'ok' },
              { traceId: 'ghi789', op: 'POST /api/proctor/analyze', duration: '412ms', spans: 12, status: 'slow' },
              { traceId: 'jkl012', op: 'POST /api/auth/refresh', duration: '18ms', spans: 3, status: 'ok' },
              { traceId: 'mno345', op: 'GET /api/reports/user/xxx', duration: '203ms', spans: 8, status: 'ok' },
            ].map(t => (
              <div key={t.traceId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'ok' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{t.op}</p>
                  <p className="text-[10px] text-gray-400">{t.spans} spans · trace: {t.traceId}</p>
                </div>
                <span className={`text-xs font-mono tabular-nums flex-shrink-0 ${t.status === 'slow' ? 'text-yellow-600' : 'text-gray-500'}`}>{t.duration}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500" />Active Alerts</CardTitle>
            <Badge color="yellow" size="sm">2 firing</Badge>
          </CardHeader>
          <div className="space-y-3">
            {[
              { severity: 'warning', title: 'Proctoring Service CPU > 75%', since: '3m ago', team: 'Platform' },
              { severity: 'warning', title: 'P99 latency spike on /api/proctor/analyze', since: '5m ago', team: 'ML Infra' },
              { severity: 'info', title: 'Assessment Service auto-scaled to 6 pods', since: '12m ago', team: 'Platform' },
              { severity: 'resolved', title: 'DB connection pool exhaustion', since: '1h ago', team: 'Data' },
            ].map((a, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                a.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                a.severity === 'info'    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${
                    a.severity === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                    a.severity === 'info'    ? 'text-blue-800 dark:text-blue-200' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>{a.title}</p>
                  <Badge color={a.severity === 'warning' ? 'yellow' : a.severity === 'info' ? 'blue' : 'green'} size="sm">
                    {a.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">{a.since} · {a.team} team</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
