import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface HistoryFilterOptions {
  search?: string;
  minScore?: number;
  maxScore?: number;
  wasRegenerated?: boolean;
  modelName?: string;
  hasRating?: boolean;
  sortBy?: 'date' | 'score' | 'cost';
  sortOrder?: 'asc' | 'desc';
}

interface HistoryFiltersProps {
  onFilterChange: (filters: HistoryFilterOptions) => void;
  availableModels: string[];
}

export default function HistoryFilters({ onFilterChange, availableModels }: HistoryFiltersProps) {
  const [filters, setFilters] = useState<HistoryFilterOptions>({
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof HistoryFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: HistoryFilterOptions = {
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.search || filters.minScore || filters.maxScore ||
                          filters.wasRegenerated !== undefined || filters.modelName ||
                          filters.hasRating !== undefined;

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            showAdvanced ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          {/* Score Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Quality Score Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.minScore || ''}
                onChange={(e) => updateFilter('minScore', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.maxScore || ''}
                onChange={(e) => updateFilter('maxScore', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>
          </div>

          {/* Model Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Model Used</label>
            <select
              value={filters.modelName || ''}
              onChange={(e) => updateFilter('modelName', e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">All Models</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filters */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.wasRegenerated === true}
                  onChange={(e) => updateFilter('wasRegenerated', e.target.checked ? true : undefined)}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <span className="text-sm">Regenerated Only</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasRating === true}
                  onChange={(e) => updateFilter('hasRating', e.target.checked ? true : undefined)}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <span className="text-sm">Has User Rating</span>
              </label>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="date">Date</option>
              <option value="score">Quality Score</option>
              <option value="cost">Cost</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium mb-2">Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
