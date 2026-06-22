'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { Download, Loader } from 'lucide-react';

interface ReportViewProps {
  reportId: string;
}

interface Report {
  id: string;
  status: string;
  dimensionScores: Record<string, number>;
  narrative: string;
  benchmarkPercentile: number;
  coachingPlan: any;
}

export default function ReportView({ reportId }: ReportViewProps) {
  const { user, tenantId } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !reportId) return;

    const fetchReport = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/reports/${reportId}`,
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          },
        );
        setReport(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load report');
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user, tenantId]);

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF download via AI sidecar
    alert('PDF download coming in Phase 3');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!report) {
    return <div className="p-8">Report not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900">
              Leadership Assessment Report
            </h1>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Status Badge */}
          <div className="inline-block">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                report.status === 'ready'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {report.status === 'ready' ? 'Report Ready' : 'Generating...'}
            </span>
          </div>
        </div>

        {report.status === 'pending' ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-brand-600" />
            <p className="text-gray-600">
              Your report is being generated. This typically takes 1-2 minutes.
              Please refresh the page in a moment.
            </p>
          </div>
        ) : (
          <>
            {/* Scores */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">
                Competency Dimension Scores
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {Object.entries(report.dimensionScores).map(
                  ([dimension, score]) => (
                    <div
                      key={dimension}
                      className="border-l-4 border-blue-600 pl-4"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {dimension}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-brand-600">
                          {score.toFixed(1)}
                        </span>
                        <span className="text-gray-600">/5.0</span>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-600 h-2 rounded-full"
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Narrative */}
            {report.narrative && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {report.narrative}
                </p>
              </div>
            )}

            {/* Benchmark */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                Benchmark Percentile
              </h2>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-brand-600 mb-2">
                  {report.benchmarkPercentile}%
                </div>
                <p className="text-gray-600">
                  You rank in the {report.benchmarkPercentile}th percentile
                  compared to peer organizations.
                </p>
              </div>
            </div>

            {/* Coaching Plan */}
            {report.coachingPlan?.goals && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-900">
                  90-Day Coaching Plan
                </h2>

                <div className="space-y-6">
                  {report.coachingPlan.goals.map(
                    (goal: any, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-green-600 pl-4"
                      >
                        <h3 className="font-semibold text-gray-900 mb-3">
                          {goal.goal}
                        </h3>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Recommended Actions:
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {goal.actions?.map((action: string, i: number) => (
                              <li key={i} className="text-gray-600 text-sm">
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
