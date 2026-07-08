import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Download, Trophy, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { assessmentApi, type SessionResult } from '../services/assessmentApi';
import { defaultConfigs } from '../data/configs';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import type { AssessmentModuleId } from '../types';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const moduleColors: Record<AssessmentModuleId, string> = {
  technical: '#3b82f6', attitude: '#f59e0b', behavioral: '#10b981', psychometric: '#8b5cf6', communication: '#ec4899',
};

export default function ResultsPage() {
  const { user }    = useAuth();
  const { isDark }  = useTheme();
  const [filter, setFilter]   = useState<string>('all');
  const [results, setResults] = useState<SessionResult[]>([]);

  useEffect(() => {
    if (user) assessmentApi.getResults().then(r => setResults(r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#1f2937' : '#f3f4f6';

  const shown = filter === 'all' ? results : results.filter(r => r.moduleId === filter);
  const byModule: Partial<Record<AssessmentModuleId, number>> = {};
  results.forEach(r => {
    const prev = byModule[r.moduleId] ?? 0;
    byModule[r.moduleId] = Math.max(prev, r.score);
  });
  const totalSessions = results.length;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.score)) : 0;
  const passRate  = results.length ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;

  const barData = {
    labels: defaultConfigs.map(c => c.moduleId.charAt(0).toUpperCase() + c.moduleId.slice(1)),
    datasets: [{ label: 'Best Score (%)', data: defaultConfigs.map(c => byModule[c.moduleId] ?? 0),
      backgroundColor: defaultConfigs.map(c => moduleColors[c.moduleId] + '99'),
      borderColor: defaultConfigs.map(c => moduleColors[c.moduleId]), borderWidth: 2, borderRadius: 8 }],
  };
  const donutData = {
    labels: (Object.keys(byModule) as AssessmentModuleId[]).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{ data: Object.values(byModule),
      backgroundColor: (Object.keys(byModule) as AssessmentModuleId[]).map(k => moduleColors[k] + 'cc'),
      borderColor: (Object.keys(byModule) as AssessmentModuleId[]).map(k => moduleColors[k]), borderWidth: 2 }],
  };
  const chartOpts = { responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } },
               y: { ticks: { color: textColor }, grid: { color: gridColor }, max: 100, beginAtZero: true } } };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your comprehensive assessment analytics</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={15} />}>Export PDF</Button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assessments', value: totalSessions, icon: BarChart3, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Average Score',     value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Best Score',        value: `${bestScore}%`, icon: Trophy,    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Pass Rate',         value: `${passRate}%`,  icon: Clock,     color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <div className={`p-2 rounded-xl w-fit mb-3 ${s.color}`}><s.icon size={18} /></div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Score by Module</CardTitle></CardHeader>
          <div className="h-56">
            {results.length > 0 ? <Bar data={barData} options={chartOpts as Parameters<typeof Bar>[0]['options']} /> :
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Complete assessments to see scores</div>}
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Performance Distribution</CardTitle></CardHeader>
          <div className="h-56 flex items-center justify-center">
            {Object.keys(byModule).length > 0 ? <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor } } } }} /> :
              <div className="text-gray-400 text-sm">No data yet</div>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Progress</CardTitle>
          <div className="flex gap-2">
            {['all', ...defaultConfigs.map(c => c.moduleId)].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'bg-frost-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-frost-200 dark:hover:bg-gray-700'
                }`}>{f}</button>
            ))}
          </div>
        </CardHeader>
        <div className="space-y-4">
          {defaultConfigs.map(cfg => {
            const score = byModule[cfg.moduleId];
            return (
              <div key={cfg.id} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-700 dark:text-gray-300 capitalize flex-shrink-0">{cfg.moduleId}</div>
                <div className="flex-1">
                  <ProgressBar value={score ?? 0} size="sm" color={score !== undefined && score >= 70 ? 'green' : score !== undefined ? 'yellow' : 'brand'} showLabel />
                </div>
                <div className="w-20 flex justify-end">
                  {score !== undefined ? <Badge color={score >= 70 ? 'green' : 'yellow'} size="sm">{score >= 70 ? 'Pass' : 'Fail'}</Badge>
                    : <Badge color="gray" size="sm">Pending</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <Badge color="gray">{shown.length} records</Badge>
        </CardHeader>
        {shown.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No completed assessments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {['Module', 'Date', 'Score', 'IRT Tier', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {shown.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white capitalize">{r.moduleId}</td>
                    <td className="py-3 px-3 text-gray-500">{new Date(r.completedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-3"><span className={`font-semibold tabular-nums ${r.score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{r.score}%</span></td>
                    <td className="py-3 px-3 capitalize text-gray-500">{r.irtTier ?? '—'}</td>
                    <td className="py-3 px-3"><Badge color={r.passed ? 'green' : 'red'} size="sm">{r.passed ? 'Passed' : 'Failed'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
