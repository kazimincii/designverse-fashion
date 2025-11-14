import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, TrendingUp, FileDown } from 'lucide-react';
import { qualityApi } from '../services/api';
import toast from 'react-hot-toast';
import QualityMetricsCard from '../components/QualityMetricsCard';
import QualityReportView from '../components/QualityReportView';
import GenerationHistoryList from '../components/GenerationHistoryList';
import HistoryFilters from '../components/HistoryFilters';
import type { QualityMetrics, QualityReport, GenerationHistory } from '../types/quality';
import type { HistoryFilterOptions } from '../components/HistoryFilters';

type TabType = 'overview' | 'report' | 'history';

export default function SessionAnalytics() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<GenerationHistory[]>([]);
  const [filters, setFilters] = useState<HistoryFilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  // TODO: Add batch regeneration UI
  // const [batchRegenerating, setBatchRegenerating] = useState(false);
  // const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchThreshold] = useState(70);
  const [batchMaxCount] = useState(10);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const loadData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [metricsRes, reportRes, historyRes] = await Promise.all([
        qualityApi.getSessionMetrics(sessionId),
        qualityApi.getSessionReport(sessionId),
        qualityApi.getGenerationHistory(sessionId, 50),
      ]);

      setMetrics(metricsRes.data.data.metrics);
      setReport(reportRes.data.data.report);
      setHistory(historyRes.data.data.history);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFeedbackSubmit = async (
    historyId: string,
    rating: number,
    feedback?: string,
    issues?: string[]
  ) => {
    try {
      await qualityApi.submitFeedback(historyId, {
        rating,
        feedback,
        issues,
      });

      // Refresh history to show updated feedback
      const historyRes = await qualityApi.getGenerationHistory(sessionId!, 50);
      setHistory(historyRes.data.data.history);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      throw new Error(err.response?.data?.error || 'Failed to submit feedback');
    }
  };

  const handleExportReport = () => {
    if (!report || !metrics) return;

    const exportData = {
      sessionId,
      exportDate: new Date().toISOString(),
      metrics,
      report,
      history: history.slice(0, 20), // Include first 20 generations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${sessionId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (!sessionId) return;

    try {
      setExportingCSV(true);
      const response = await qualityApi.exportHistoryCSV(sessionId);

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation-history-${sessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      setError(err.response?.data?.error || 'Failed to export CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleFilterChange = async (newFilters: HistoryFilterOptions) => {
    if (!sessionId) return;

    setFilters(newFilters);

    try {
      const response = await qualityApi.getGenerationHistoryFiltered(sessionId, {
        search: newFilters.search,
        minScore: newFilters.minScore,
        maxScore: newFilters.maxScore,
        modelName: newFilters.modelName,
        wasRegenerated: newFilters.wasRegenerated,
        sortBy: newFilters.sortBy,
        sortOrder: newFilters.sortOrder,
        limit: 100,
      });

      setFilteredHistory(response.data.data.history);
    } catch (err: any) {
      console.error('Failed to filter history:', err);
      // Fall back to unfiltered history
      setFilteredHistory(history);
    }
  };

  const handleFavoriteToggle = () => {
    // Reload data to reflect favorite changes
    loadData();
  };

  // Get available models from history
  const availableModels = useMemo(() => {
    const models = new Set<string>();
    history.forEach((h) => {
      if (h.modelName) models.add(h.modelName);
    });
    return Array.from(models);
  }, [history]);

  // Use filtered history if filters are active, otherwise use all history
  const displayHistory = Object.keys(filters).length > 0 ? filteredHistory : history;

  // Batch regeneration handler - TODO: Add full UI with modal
  const handleBatchRegenerate = async () => {
    if (!sessionId) return;

    const confirmed = window.confirm(
      `This will regenerate all images with quality scores below ${batchThreshold}. Continue?`
    );
    if (!confirmed) return;

    try {
      const response = await qualityApi.batchRegenerate(sessionId, {
        threshold: batchThreshold,
        maxRegenerations: batchMaxCount,
      });

      const { count } = response.data.data;

      if (count === 0) {
        toast('No low quality generations found!', { icon: 'ℹ️' });
      } else {
        toast.success(`Queued ${count} generation${count > 1 ? 's' : ''} for improvement!`);
        // Refresh data after a short delay
        setTimeout(() => handleRefresh(), 2000);
      }
    } catch (err: any) {
      console.error('Failed to batch regenerate:', err);
      toast.error(err.response?.data?.error || 'Failed to start batch regeneration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <span>Quality Analytics</span>
              </h1>
              <p className="text-gray-400 mt-1">Session: {sessionId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'report'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Detailed Report
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Generation History
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              <QualityMetricsCard metrics={metrics} />

              {/* Batch Regeneration - Quick Action */}
              {metrics.averageConsistencyScore < 80 && (
                <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-orange-400">Low Quality Detected</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Some generations are below quality threshold. Regenerate them automatically.
                      </p>
                    </div>
                    <button
                      onClick={handleBatchRegenerate}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      Batch Regenerate
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Insights */}
              {report && report.recommendations.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Quick Insights</h3>
                  <div className="space-y-3">
                    {report.recommendations.slice(0, 3).map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg"
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          rec.priority === 'high'
                            ? 'bg-red-500'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="font-medium mb-1 capitalize">{rec.category}</div>
                          <p className="text-sm text-gray-400">{rec.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="mt-4 text-sm text-purple-400 hover:text-purple-300"
                  >
                    View full report →
                  </button>
                </div>
              )}

              {/* Recent History Preview */}
              {history.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Recent Generations</h3>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      View all →
                    </button>
                  </div>
                  <GenerationHistoryList
                    history={history.slice(0, 5)}
                    onFeedbackSubmit={handleFeedbackSubmit}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'report' && report && (
            <QualityReportView report={report} />
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Export CSV Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{exportingCSV ? 'Exporting...' : 'Export CSV'}</span>
                </button>
              </div>

              {/* Filters */}
              <HistoryFilters
                onFilterChange={handleFilterChange}
                availableModels={availableModels}
              />

              {/* History List */}
              <GenerationHistoryList
                history={displayHistory}
                onFeedbackSubmit={handleFeedbackSubmit}
                onFavoriteToggle={handleFavoriteToggle}
              />

              {displayHistory.length === 0 && (
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <p className="text-gray-400">No generations match your filters</p>
                  <button
                    onClick={() => setFilters({})}
                    className="mt-4 text-sm text-purple-400 hover:text-purple-300"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
