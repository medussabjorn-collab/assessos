'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Users, Briefcase, TrendingUp, Loader } from 'lucide-react';

interface DashboardMetrics {
  openPositions: number;
  totalCandidates: number;
  pipelineStages: Record<string, number>;
  avgTimeToHire: string;
  offerAcceptanceRate: number;
  hiringTeamSize: number;
}

export default function HiringDashboard() {
  const { user, tenantId } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/hiring/dashboard');
        setMetrics(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load hiring dashboard');
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div className="p-8">No data available</div>;
  }

  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Hiring Dashboard
          </h1>
          <p className="text-slate-400">Recruit, evaluate, and hire top talent</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Open Positions</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {metrics.openPositions}
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Total Candidates
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {metrics.totalCandidates}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Avg Time to Hire
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {metrics.avgTimeToHire}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-3">
                Offer Acceptance
              </p>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {metrics.offerAcceptanceRate}%
              </div>
              <p className="text-xs text-slate-500">
                {metrics.hiringTeamSize} team members
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Hiring Pipeline
          </h2>

          <div className="grid grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {metrics.pipelineStages.screening}
              </div>
              <p className="text-slate-400 text-sm">Screening</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {metrics.pipelineStages.technical}
              </div>
              <p className="text-slate-400 text-sm">Technical</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {metrics.pipelineStages.culture_fit}
              </div>
              <p className="text-slate-400 text-sm">Culture Fit</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {metrics.pipelineStages.offer}
              </div>
              <p className="text-slate-400 text-sm">Offer</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {metrics.pipelineStages.hired}
              </div>
              <p className="text-slate-400 text-sm">Hired</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {metrics.pipelineStages.rejected}
              </div>
              <p className="text-slate-400 text-sm">Rejected</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                Create New Position
              </button>
              <button className="w-full py-2 px-4 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition text-sm font-medium">
                View All Candidates
              </button>
              <button className="w-full py-2 px-4 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition text-sm font-medium">
                Manage Team Members
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Top Candidates
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Showing highest-rated candidates ready for offer
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="font-medium text-white">Jane Doe</p>
                <p className="text-xs text-slate-400">Software Engineer - 4.0/5</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="font-medium text-white">John Smith</p>
                <p className="text-xs text-slate-400">
                  Product Manager - 3.8/5
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
