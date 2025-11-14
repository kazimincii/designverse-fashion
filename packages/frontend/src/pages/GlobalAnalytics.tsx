import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Image as ImageIcon,
  Award,
  AlertCircle,
  BarChart3,
  RefreshCw,
  BarChart2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { qualityApi } from '../services/api';
import type { GlobalAnalytics } from '../types/quality';
import QualityChart from '../components/QualityChart';

export default function GlobalAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { startDate?: string } = {};
      if (dateRange === '7d') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        params.startDate = date.toISOString();
      } else if (dateRange === '30d') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        params.startDate = date.toISOString();
      }

      const response = await qualityApi.getGlobalAnalytics(params);
      setAnalytics(response.data.data.analytics);
    } catch (err: any) {
      console.error('Failed to load global analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <span>Global Analytics</span>
              </h1>
              <p className="text-gray-400 mt-1">Your generation history across all sessions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-1 bg-gray-900 rounded-lg p-1">
              {(['7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Sessions</span>
              <ImageIcon className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-3xl font-bold">{analytics.totalSessions}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Generations</span>
              <ImageIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{analytics.totalGenerations}</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Average Quality</span>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div className={`text-3xl font-bold ${getQualityColor(analytics.averageConsistencyScore)}`}>
              {analytics.averageConsistencyScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Cost</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">
              ${analytics.totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Success Rate</div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-500">{analytics.successRate}%</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">Scores ≥ 70</div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Face Consistency</div>
            <div className={`text-2xl font-bold ${getQualityColor(analytics.averageFaceScore)}`}>
              {analytics.averageFaceScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Garment Accuracy</div>
            <div className={`text-2xl font-bold ${getQualityColor(analytics.averageGarmentScore)}`}>
              {analytics.averageGarmentScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Style Matching</div>
            <div className={`text-2xl font-bold ${getQualityColor(analytics.averageStyleScore)}`}>
              {analytics.averageStyleScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Quality Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {analytics.qualityDistribution.excellent}
              </div>
              <div className="text-sm text-gray-400">Excellent (90+)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {analytics.qualityDistribution.good}
              </div>
              <div className="text-sm text-gray-400">Good (80-89)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-1">
                {analytics.qualityDistribution.fair}
              </div>
              <div className="text-sm text-gray-400">Fair (70-79)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-1">
                {analytics.qualityDistribution.poor}
              </div>
              <div className="text-sm text-gray-400">Poor (&lt;70)</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Performing Models */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span>Top Performing Models</span>
            </h3>
            {analytics.topPerformingModels.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPerformingModels.map((model, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-gray-700/20 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium">{model.model}</div>
                        <div className="text-xs text-gray-500">{model.usageCount} uses</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getQualityColor(model.averageScore)}`}>
                      {model.averageScore.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>

          {/* Most Used Models */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Most Used Models</span>
            </h3>
            {analytics.mostUsedModels.length > 0 ? (
              <div className="space-y-3">
                {analytics.mostUsedModels.map((model, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="font-medium">{model.model}</div>
                      <div className="text-xs text-gray-500">
                        Avg: {model.averageScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-cyan-500">
                      {model.usageCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>

        {/* Common Issues */}
        {analytics.commonIssues.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Common Issues</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.commonIssues.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-sm">{issue.issue}</span>
                  <span className="text-lg font-bold text-red-500">{issue.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Trend Chart */}
        {analytics.timeSeriesData.length > 0 && (
          <QualityChart data={analytics.timeSeriesData} />
        )}

        {/* Model Performance Comparison */}
        {analytics.topPerformingModels.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-cyan-500" />
              <span>Model Performance Comparison</span>
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Compare average quality scores and usage across different AI models
            </p>

            {/* Comparison Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.topPerformingModels.map((m) => ({
                  model: m.model,
                  avgScore: m.averageScore,
                  usage: m.usageCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="model"
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar dataKey="avgScore" fill="#8B5CF6" name="Avg Quality Score" />
                <Bar dataKey="usage" fill="#10B981" name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>

            {/* Detailed Stats Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2">Model</th>
                    <th className="text-right py-2">Avg Score</th>
                    <th className="text-right py-2">Total Uses</th>
                    <th className="text-right py-2">Performance Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPerformingModels.map((model, idx) => (
                    <tr key={idx} className="border-b border-gray-800/50">
                      <td className="py-3 font-medium">{model.model}</td>
                      <td className="text-right">
                        <span
                          className={`font-bold ${
                            model.averageScore >= 90
                              ? 'text-green-500'
                              : model.averageScore >= 80
                              ? 'text-blue-500'
                              : model.averageScore >= 70
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }`}
                        >
                          {model.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-right text-cyan-500">{model.usageCount}</td>
                      <td className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            model.averageScore >= 90
                              ? 'bg-green-500/20 text-green-400'
                              : model.averageScore >= 80
                              ? 'bg-blue-500/20 text-blue-400'
                              : model.averageScore >= 70
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {model.averageScore >= 90
                            ? 'Excellent'
                            : model.averageScore >= 80
                            ? 'Good'
                            : model.averageScore >= 70
                            ? 'Fair'
                            : 'Poor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Regeneration Stats */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Regeneration Statistics</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Regeneration Rate</span>
                <span className={`font-bold ${
                  analytics.regenerationRate < 20 ? 'text-green-500' :
                  analytics.regenerationRate < 40 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {analytics.regenerationRate}%
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    analytics.regenerationRate < 20 ? 'bg-green-500' :
                    analytics.regenerationRate < 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${analytics.regenerationRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lower regeneration rate indicates better first-time quality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
