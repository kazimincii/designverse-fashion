import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GenerationHistory } from '../types/quality';

interface ModelComparisonProps {
  history: GenerationHistory[];
}

interface ModelStats {
  model: string;
  avgScore: number;
  avgFaceScore: number;
  avgGarmentScore: number;
  avgStyleScore: number;
  totalGenerations: number;
  regenerationRate: number;
  avgCost: number;
  successRate: number;
}

interface ModelStatsAccumulator extends ModelStats {
  _totalScore: number;
  _totalFaceScore: number;
  _totalGarmentScore: number;
  _totalStyleScore: number;
  _totalCost: number;
  _regeneratedCount: number;
  _successfulCount: number;
}

export default function ModelComparison({ history }: ModelComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Calculate stats for each model
  const modelStats = useMemo(() => {
    const statsMap = new Map<string, ModelStatsAccumulator>();

    history.forEach((h) => {
      if (!h.modelName) return;

      const existing = statsMap.get(h.modelName) || {
        model: h.modelName,
        avgScore: 0,
        avgFaceScore: 0,
        avgGarmentScore: 0,
        avgStyleScore: 0,
        totalGenerations: 0,
        regenerationRate: 0,
        avgCost: 0,
        successRate: 0,
        _totalScore: 0,
        _totalFaceScore: 0,
        _totalGarmentScore: 0,
        _totalStyleScore: 0,
        _totalCost: 0,
        _regeneratedCount: 0,
        _successfulCount: 0,
      };

      existing.totalGenerations++;
      if (h.consistencyScore) existing._totalScore += h.consistencyScore;
      if (h.faceSimScore) existing._totalFaceScore += h.faceSimScore;
      if (h.garmentAccScore) existing._totalGarmentScore += h.garmentAccScore;
      if (h.styleMatchScore) existing._totalStyleScore += h.styleMatchScore;
      if (h.apiCostUsd) existing._totalCost += h.apiCostUsd;
      if (h.wasRegenerated) existing._regeneratedCount++;
      if (h.consistencyScore && h.consistencyScore >= 70) existing._successfulCount++;

      statsMap.set(h.modelName, existing);
    });

    // Calculate averages
    const stats: ModelStats[] = [];
    statsMap.forEach((s) => {
      stats.push({
        model: s.model,
        avgScore: Math.round((s._totalScore / s.totalGenerations) * 10) / 10,
        avgFaceScore: Math.round((s._totalFaceScore / s.totalGenerations) * 10) / 10,
        avgGarmentScore: Math.round((s._totalGarmentScore / s.totalGenerations) * 10) / 10,
        avgStyleScore: Math.round((s._totalStyleScore / s.totalGenerations) * 10) / 10,
        totalGenerations: s.totalGenerations,
        regenerationRate: Math.round((s._regeneratedCount / s.totalGenerations) * 100),
        avgCost: Math.round((s._totalCost / s.totalGenerations) * 1000) / 1000,
        successRate: Math.round((s._successfulCount / s.totalGenerations) * 100),
      });
    });

    return stats.sort((a, b) => b.avgScore - a.avgScore);
  }, [history]);

  const availableModels = modelStats.map((s) => s.model);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const comparisonData = selectedModels.length > 0
    ? modelStats.filter((s) => selectedModels.includes(s.model))
    : modelStats.slice(0, 5);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Model Performance Comparison</h3>

      {/* Model Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => toggleModel(model)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedModels.includes(model)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
        {selectedModels.length > 0 && (
          <button
            onClick={() => setSelectedModels([])}
            className="mt-2 text-sm text-gray-400 hover:text-white"
          >
            Clear selection (show top 5)
          </button>
        )}
      </div>

      {/* Comparison Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="model" stroke="#9CA3AF" />
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
          <Bar dataKey="successRate" fill="#10B981" name="Success Rate %" />
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed Stats Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2">Model</th>
              <th className="text-right py-2">Avg Score</th>
              <th className="text-right py-2">Success Rate</th>
              <th className="text-right py-2">Regen Rate</th>
              <th className="text-right py-2">Avg Cost</th>
              <th className="text-right py-2">Total Uses</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((stat) => (
              <tr key={stat.model} className="border-b border-gray-800/50">
                <td className="py-3 font-medium">{stat.model}</td>
                <td className="text-right">
                  <span
                    className={`font-bold ${
                      stat.avgScore >= 90
                        ? 'text-green-500'
                        : stat.avgScore >= 80
                        ? 'text-blue-500'
                        : stat.avgScore >= 70
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {stat.avgScore}
                  </span>
                </td>
                <td className="text-right text-green-500">{stat.successRate}%</td>
                <td className="text-right text-orange-500">{stat.regenerationRate}%</td>
                <td className="text-right text-gray-400">${stat.avgCost.toFixed(3)}</td>
                <td className="text-right text-cyan-500">{stat.totalGenerations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
