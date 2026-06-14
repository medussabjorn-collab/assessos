'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import axios from 'axios';
import {
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface DashboardData {
  summary: {
    totalLeaders: number;
    avgLeadershipIndex: number;
    healthRating: string;
    distribution: Record<string, number>;
  };
  leadershipData: Array<{
    userId: string;
    userName: string;
    email: string;
    department: string;
    leadershipIndex: number;
    tier: string;
    successorReadiness: number;
  }>;
  topPerformers: any[];
  developmentPriorities: any[];
  succession: {
    ready_now: any[];
    ready_2yr: any[];
    ready_5yr: any[];
    not_ready: any[];
  };
}

export default function CHRODashboard() {
  const { user, tenantId } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        const response = await axios.get(
          'http://localhost:3000/api/analytics/dashboard',
          {
            headers: {
              'x-tenant-id': tenantId,
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          },
        );
        setDashboard(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, tenantId]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'exceptional':
        return 'bg-purple-100 text-purple-900';
      case 'strong':
        return 'bg-blue-100 text-blue-900';
      case 'solid':
        return 'bg-yellow-100 text-yellow-900';
      case 'emerging':
        return 'bg-orange-100 text-orange-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const getHealthColor = (rating: string) => {
    switch (rating) {
      case 'Exceptional':
        return 'text-purple-600';
      case 'Strong':
        return 'text-blue-600';
      case 'Healthy':
        return 'text-green-600';
      case 'Needs Attention':
        return 'text-yellow-600';
      case 'At Risk':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

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

  if (!dashboard) {
    return <div className="p-8">No data available</div>;
  }

  const { summary, leadershipData, topPerformers, developmentPriorities, succession } =
    dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Organization Leadership Health
          </h1>
          <p className="text-gray-600">CHRO Dashboard & Succession Pipeline</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Leaders</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {summary.totalLeaders}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Avg Leadership Index
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {summary.avgLeadershipIndex.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Health Status</p>
                <p className={`text-3xl font-bold mt-2 ${getHealthColor(summary.healthRating)}`}>
                  {summary.healthRating}
                </p>
              </div>
              <Award className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-3">Distribution</p>
              <div className="space-y-1 text-xs">
                <p className="text-purple-600">
                  <strong>{summary.distribution.exceptional}</strong> Exceptional
                </p>
                <p className="text-blue-600">
                  <strong>{summary.distribution.strong}</strong> Strong
                </p>
                <p className="text-yellow-600">
                  <strong>{summary.distribution.solid}</strong> Solid
                </p>
                <p className="text-orange-600">
                  <strong>{summary.distribution.emerging}</strong> Emerging
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">
              Top Performers
            </h2>
            <div className="space-y-3">
              {topPerformers.map((leader, idx) => (
                <div key={leader.userId} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {idx + 1}. {leader.userName}
                    </p>
                    <p className="text-xs text-gray-600">{leader.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {leader.leadershipIndex.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getTierColor(
                        leader.tier,
                      )}`}
                    >
                      {leader.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Succession Pipeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">
              Succession Pipeline
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Ready Now</span>
                  <span className="text-sm font-bold text-green-600">
                    {succession.ready_now.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (succession.ready_now.length / leadershipData.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Ready in 2 Years</span>
                  <span className="text-sm font-bold text-blue-600">
                    {succession.ready_2yr.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (succession.ready_2yr.length / leadershipData.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Ready in 5 Years</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {succession.ready_5yr.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (succession.ready_5yr.length / leadershipData.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Development Priorities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-slate-900">
              Development Priorities
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {developmentPriorities.map((leader) => (
              <div
                key={leader.userId}
                className="border-l-4 border-orange-500 pl-4 py-3"
              >
                <p className="font-semibold text-slate-900">{leader.userName}</p>
                <p className="text-sm text-gray-600 mb-2">{leader.department}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(leader.tier)}`}>
                    {leader.tier}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Index: {leader.leadershipIndex.toFixed(2)}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
