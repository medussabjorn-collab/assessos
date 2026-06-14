'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import axios from 'axios';
import { FileText, Loader } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  sessionId: string;
  status: string;
  createdAt: string;
  benchmarkPercentile?: number;
}

export default function ReportsPage() {
  const { user, tenantId } = useContext(AuthContext);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      try {
        const response = await axios.get(
          'http://localhost:3000/api/reports/user/list',
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          },
        );
        setReports(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load reports');
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">
          My Assessment Reports
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No reports available yet.</p>
            <p className="text-gray-500 text-sm">
              Complete an assessment to generate your first report.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Assessment Report
                      </h3>
                      <p className="text-sm text-gray-600">
                        Generated on{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      {report.status === 'ready' && (
                        <div className="mt-2 inline-block">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Ready to view
                          </span>
                        </div>
                      )}
                      {report.status === 'pending' && (
                        <div className="mt-2 inline-block">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Generating...
                          </span>
                        </div>
                      )}
                    </div>
                    {report.benchmarkPercentile && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {report.benchmarkPercentile}%
                        </div>
                        <p className="text-xs text-gray-600">Percentile</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
