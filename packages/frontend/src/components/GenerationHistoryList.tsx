import { useState } from 'react';
import { Clock, Star, RefreshCw, AlertCircle, TrendingUp, Image as ImageIcon, Heart } from 'lucide-react';
import type { GenerationHistory } from '../types/quality';
import FeedbackModal from './FeedbackModal';
import { qualityApi } from '../services/api';
import toast from 'react-hot-toast';

interface GenerationHistoryListProps {
  history: GenerationHistory[];
  loading?: boolean;
  onFeedbackSubmit?: (historyId: string, rating: number, feedback?: string, issues?: string[]) => Promise<void>;
  onFavoriteToggle?: () => void;
}

export default function GenerationHistoryList({ history, loading, onFeedbackSubmit, onFavoriteToggle }: GenerationHistoryListProps) {
  const [selectedHistory, setSelectedHistory] = useState<GenerationHistory | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleOpenFeedback = (item: GenerationHistory) => {
    setSelectedHistory(item);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (rating: number, feedback?: string, issues?: string[]) => {
    if (selectedHistory && onFeedbackSubmit) {
      await onFeedbackSubmit(selectedHistory.id, rating, feedback, issues);
      setShowFeedbackModal(false);
      setSelectedHistory(null);
    }
  };

  const handleFavoriteToggle = async (historyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setTogglingFavorite(historyId);

    try {
      await qualityApi.toggleFavorite(historyId);
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
      toast.error('Failed to update favorite status');
    } finally {
      setTogglingFavorite(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/4 mb-3"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-12 text-center">
        <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No generation history yet</p>
        <p className="text-sm text-gray-500 mt-2">Start generating images to see history</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">{formatDate(item.createdAt)}</span>
                  {item.wasRegenerated && (
                    <span className="flex items-center space-x-1 text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerated</span>
                    </span>
                  )}
                  {item.qualityIssues && item.qualityIssues.length > 0 && (
                    <span className="flex items-center space-x-1 text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>{item.qualityIssues.length} issues</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{item.prompt}</p>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <button
                  onClick={(e) => handleFavoriteToggle(item.id, e)}
                  disabled={togglingFavorite === item.id}
                  className={`p-2 rounded-lg transition-colors ${
                    (item as any).isFavorite
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                  } disabled:opacity-50`}
                  title={(item as any).isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${(item as any).isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleOpenFeedback(item)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                >
                  <Star className="w-4 h-4" />
                  <span>Rate</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {/* Overall Score */}
              {item.consistencyScore !== null && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Overall</div>
                  <div className={`text-lg font-bold ${getScoreColor(item.consistencyScore)}`}>
                    {item.consistencyScore.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Face Score */}
              {item.faceSimScore !== null && item.faceSimScore > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Face</div>
                  <div className={`text-lg font-bold ${getScoreColor(item.faceSimScore)}`}>
                    {item.faceSimScore.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Garment Score */}
              {item.garmentAccScore !== null && item.garmentAccScore > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Garment</div>
                  <div className={`text-lg font-bold ${getScoreColor(item.garmentAccScore)}`}>
                    {item.garmentAccScore.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Style Score */}
              {item.styleMatchScore !== null && item.styleMatchScore > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Style</div>
                  <div className={`text-lg font-bold ${getScoreColor(item.styleMatchScore)}`}>
                    {item.styleMatchScore.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Cost */}
              {item.apiCostUsd !== null && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Cost</div>
                  <div className="text-lg font-bold text-green-500">
                    ${item.apiCostUsd.toFixed(3)}
                  </div>
                </div>
              )}
            </div>

            {/* Model & Processing Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {item.modelName && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{item.modelName}</span>
                </div>
              )}
              {item.processingTimeMs && (
                <div>Processing: {(item.processingTimeMs / 1000).toFixed(1)}s</div>
              )}
              {item.numInferenceSteps && (
                <div>Steps: {item.numInferenceSteps}</div>
              )}
              {item.guidanceScale && (
                <div>Guidance: {item.guidanceScale}</div>
              )}
            </div>

            {/* User Rating */}
            {item.userRating !== null && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Your rating:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.userRating!
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {item.userFeedback && (
                  <p className="text-sm text-gray-400 mt-2">{item.userFeedback}</p>
                )}
              </div>
            )}

            {/* Quality Issues */}
            {item.qualityIssues && item.qualityIssues.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-400">Quality Issues:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.qualityIssues.map((issue, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedHistory && (
        <FeedbackModal
          generation={selectedHistory}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedHistory(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </>
  );
}
