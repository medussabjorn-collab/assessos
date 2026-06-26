'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { FileText, Loader, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  sessionId: string;
  status: string;
  createdAt: string;
  benchmarkPercentile?: number;
}

const STATUS_PILL: Record<string, string> = {
  ready:   'bg-brand-100 text-brand-700',
  pending: 'bg-amber-100 text-amber-800',
};

const STATUS_LABEL: Record<string, string> = {
  ready:   'Ready to view',
  pending: 'Generating…',
};

export default function ReportsPage() {
  const { user, tenantId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      try {
        const response = await api.get('/api/reports/user/list');
        setReports(response.data.data);
      } catch {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user, tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">My Assessment Reports</h1>
        <p className="text-subtle">View and download your leadership assessment results</p>
      </div>

      {error && (
        <div className="frost-card border-red-300 p-4 text-red-600 text-sm">{error}</div>
      )}

      {reports.length === 0 ? (
        <div className="frost-card p-12 text-center">
          <FileText className="w-12 h-12 text-hairline mx-auto mb-4" />
          <p className="text-ink font-medium mb-1">No reports yet</p>
          <p className="text-subtle text-sm">Complete an assessment to generate your first report.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="frost-card p-5 flex items-center justify-between hover:shadow-frost-lg transition group"
            >
              <div>
                <h3 className="font-semibold text-ink">Assessment Report</h3>
                <p className="text-xs text-subtle mt-0.5">
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                </p>
                {STATUS_PILL[report.status] && (
                  <span className={`mt-2 inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_PILL[report.status]}`}>
                    {STATUS_LABEL[report.status]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {report.benchmarkPercentile != null && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand-600">{report.benchmarkPercentile}%</div>
                    <p className="text-xs text-subtle">Percentile</p>
                  </div>
                )}
                <ChevronRight size={18} className="text-subtle group-hover:text-brand-500 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
