import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, RefreshCw } from 'lucide-react';
import type { QualityMetrics } from '../types/quality';

interface QualityMetricsCardProps {
  metrics: QualityMetrics;
  loading?: boolean;
}

export default function QualityMetricsCard({ metrics, loading }: QualityMetricsCardProps) {
  const qualityRating = useMemo(() => {
    const score = metrics.averageConsistencyScore;
    if (score >= 90) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 70) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-500/10' };
  }, [metrics.averageConsistencyScore]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Quality Metrics</h3>
        <div className={`px-3 py-1 rounded-full ${qualityRating.bg} ${qualityRating.color} text-sm font-medium`}>
          {qualityRating.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-400">Overall Score</span>
          </div>
          <div className="text-2xl font-bold">{metrics.averageConsistencyScore}/100</div>
        </div>

        {/* Face Score */}
        {metrics.averageFaceScore > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-400">Face Quality</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageFaceScore}/100</div>
          </div>
        )}

        {/* Garment Score */}
        {metrics.averageGarmentScore > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-gray-400">Garment Quality</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageGarmentScore}/100</div>
          </div>
        )}

        {/* Style Score */}
        {metrics.averageStyleScore > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-pink-500" />
              <span className="text-sm text-gray-400">Style Quality</span>
            </div>
            <div className="text-2xl font-bold">{metrics.averageStyleScore}/100</div>
          </div>
        )}

        {/* Success Rate */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {metrics.successRate >= 0.7 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <div className="text-2xl font-bold">{Math.round(metrics.successRate * 100)}%</div>
        </div>

        {/* Regeneration Rate */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-400">Regeneration Rate</span>
          </div>
          <div className="text-2xl font-bold">{Math.round(metrics.regenerationRate * 100)}%</div>
        </div>

        {/* Total Generations */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <span className="text-sm text-gray-400">Total Generations</span>
          </div>
          <div className="text-2xl font-bold">{metrics.totalGenerations}</div>
        </div>

        {/* Total Cost */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-400">Total Cost</span>
          </div>
          <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
