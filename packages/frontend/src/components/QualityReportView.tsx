import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';
import type { QualityReport } from '../types/quality';

interface QualityReportViewProps {
  report: QualityReport;
  loading?: boolean;
}

export default function QualityReportView({ report, loading }: QualityReportViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              <div className="h-4 bg-gray-800 rounded w-4/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'info':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quality Summary */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Quality Summary</h3>
          <div className={`px-3 py-1 rounded-full ${
            report.summary.overallQuality === 'excellent'
              ? 'bg-green-500/10 text-green-500'
              : report.summary.overallQuality === 'good'
              ? 'bg-blue-500/10 text-blue-500'
              : report.summary.overallQuality === 'fair'
              ? 'bg-yellow-500/10 text-yellow-500'
              : 'bg-red-500/10 text-red-500'
          } text-sm font-medium capitalize`}>
            {report.summary.overallQuality}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Average Score</div>
            <div className="text-2xl font-bold">{report.summary.averageScore}/100</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-500">
              {Math.round(report.summary.successRate * 100)}%
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Generations</div>
            <div className="text-2xl font-bold text-cyan-500">
              {report.summary.totalGenerations}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-green-500">
              ${report.summary.totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Quality Issues</h3>
          <div className="space-y-3">
            {report.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(issue.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{issue.category}</span>
                    <span className="text-sm">
                      Score: {issue.score}/{issue.threshold}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {report.trends && (
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h3 className="text-xl font-bold">Quality Trends</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score Trend */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Average Score Trend</span>
                {report.trends.scoreTrend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : report.trends.scoreTrend === 'declining' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <span className="text-gray-500">→</span>
                )}
              </div>
              <div className="text-lg font-bold capitalize">{report.trends.scoreTrend}</div>
            </div>

            {/* Regeneration Trend */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Regeneration Trend</span>
                {report.trends.regenerationTrend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : report.trends.regenerationTrend === 'declining' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <span className="text-gray-500">→</span>
                )}
              </div>
              <div className="text-lg font-bold capitalize">{report.trends.regenerationTrend}</div>
            </div>

            {/* Cost Trend */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Cost Trend</span>
                {report.trends.costTrend === 'increasing' ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : report.trends.costTrend === 'decreasing' ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-gray-500">→</span>
                )}
              </div>
              <div className="text-lg font-bold capitalize">{report.trends.costTrend}</div>
            </div>

            {/* Common Issues */}
            {report.trends.commonIssues && report.trends.commonIssues.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Most Common Issues</div>
                <div className="space-y-1">
                  {report.trends.commonIssues.slice(0, 3).map((issue, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      • {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-xl font-bold">Recommendations</h3>
          </div>
          <div className="space-y-3">
            {report.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 p-4 rounded-lg ${
                  rec.priority === 'high'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                <Lightbulb
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    rec.priority === 'high'
                      ? 'text-red-500'
                      : rec.priority === 'medium'
                      ? 'text-yellow-500'
                      : 'text-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{rec.category}</span>
                    <span className="text-xs uppercase opacity-75">{rec.priority} Priority</span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{rec.suggestion}</p>
                  {rec.expectedImprovement && (
                    <div className="text-xs text-green-400">
                      Expected improvement: {rec.expectedImprovement}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {report.performanceInsights && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average Processing Time */}
            {report.performanceInsights.avgProcessingTime && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Avg Processing Time</div>
                <div className="text-lg font-bold">
                  {(report.performanceInsights.avgProcessingTime / 1000).toFixed(1)}s
                </div>
              </div>
            )}

            {/* Most Efficient Model */}
            {report.performanceInsights.mostEfficientModel && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Most Efficient Model</div>
                <div className="text-lg font-bold text-purple-400">
                  {report.performanceInsights.mostEfficientModel}
                </div>
              </div>
            )}

            {/* Cost per Generation */}
            {report.performanceInsights.costPerGeneration && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Cost per Generation</div>
                <div className="text-lg font-bold text-green-500">
                  ${report.performanceInsights.costPerGeneration.toFixed(3)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
