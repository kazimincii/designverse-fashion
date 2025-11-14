import { useState } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import type { GenerationHistory } from '../types/quality';

interface FeedbackModalProps {
  generation: GenerationHistory;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string, issues?: string[]) => Promise<void>;
}

const ISSUE_OPTIONS = [
  'Face not consistent',
  'Garment not accurate',
  'Style mismatch',
  'Poor quality',
  'Artifacts or distortions',
  'Wrong pose',
  'Color mismatch',
  'Missing details',
  'Background issues',
  'Other'
];

export default function FeedbackModal({ generation, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState(generation.userRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState(generation.userFeedback || '');
  const [selectedIssues, setSelectedIssues] = useState<string[]>(generation.reportedIssues || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(
        rating,
        feedback.trim() || undefined,
        selectedIssues.length > 0 ? selectedIssues : undefined
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Rate Generation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generation Info */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-300 line-clamp-3">{generation.prompt}</p>
            {generation.consistencyScore !== null && (
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <span className="text-gray-400">Overall Score:</span>
                <span className="font-bold text-purple-400">
                  {generation.consistencyScore.toFixed(1)}/100
                </span>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-3">
              How would you rate this generation?
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-4 text-sm text-gray-400">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          {/* Issues (for low ratings) */}
          {rating > 0 && rating < 4 && (
            <div>
              <label className="block text-sm font-medium mb-3">
                What issues did you notice? (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ISSUE_OPTIONS.map((issue) => (
                  <button
                    key={issue}
                    onClick={() => handleIssueToggle(issue)}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedIssues.includes(issue)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Additional feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share any additional thoughts or suggestions..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
