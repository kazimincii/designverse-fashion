import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Wand2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { aiApi } from '../services/aiApi';
import toast from 'react-hot-toast';

interface AIGenerationPanelProps {
  storyId?: string;
  onVideoGenerated?: () => void;
}

export default function AIGenerationPanel({ storyId, onVideoGenerated }: AIGenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompts, setEnhancedPrompts] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [duration, setDuration] = useState(4);
  const queryClient = useQueryClient();

  // Enhance prompt mutation
  const enhanceMutation = useMutation({
    mutationFn: (userPrompt: string) => aiApi.enhancePrompt(userPrompt),
    onSuccess: (response) => {
      const prompts = response.data.data.enhancedPrompts;
      setEnhancedPrompts(prompts);
      setSelectedPrompt(prompts[0] || '');
      toast.success('Prompts enhanced!');
    },
    onError: () => {
      toast.error('Failed to enhance prompt');
    },
  });

  // Generate video mutation
  const generateMutation = useMutation({
    mutationFn: (data: any) => aiApi.generateVideoFromText(data),
    onSuccess: (response) => {
      const jobId = response.data.data.job.id;
      toast.success('Video generation started! This may take 1-2 minutes.');

      // Start polling for job status
      startPolling(jobId);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Generation failed';
      toast.error(message);
    },
  });

  // Poll job status
  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await aiApi.getJobStatus(jobId);
        const job = response.data.data.job;

        if (job.status === 'SUCCEEDED') {
          clearInterval(interval);
          toast.success('Video generated successfully!');
          queryClient.invalidateQueries({ queryKey: ['story', storyId] });
          onVideoGenerated?.();
          setPrompt('');
          setEnhancedPrompts([]);
          setSelectedPrompt('');
        } else if (job.status === 'FAILED') {
          clearInterval(interval);
          toast.error('Video generation failed: ' + job.errorMessage);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleEnhance = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    enhanceMutation.mutate(prompt);
  };

  const handleGenerate = () => {
    const finalPrompt = selectedPrompt || prompt;

    if (!finalPrompt.trim()) {
      toast.error('Please enter or select a prompt');
      return;
    }

    generateMutation.mutate({
      prompt: finalPrompt,
      storyId,
      duration,
      aspectRatio: '16:9',
      fps: 24,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">AI Video Generation</h3>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Describe your video
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="A serene mountain landscape at sunset with gentle camera pan..."
        />
      </div>

      {/* Enhance Button */}
      <button
        onClick={handleEnhance}
        disabled={enhanceMutation.isPending || !prompt.trim()}
        className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {enhanceMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enhancing...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            <span>Enhance Prompt</span>
          </>
        )}
      </button>

      {/* Enhanced Prompts */}
      {enhancedPrompts.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-400">
            Enhanced Prompts (select one)
          </label>
          {enhancedPrompts.map((enhancedPrompt, index) => (
            <div
              key={index}
              onClick={() => setSelectedPrompt(enhancedPrompt)}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                selectedPrompt === enhancedPrompt
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-1">
                  {selectedPrompt === enhancedPrompt ? (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                  )}
                </div>
                <p className="text-sm text-gray-300">{enhancedPrompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duration Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Duration: {duration} seconds
        </label>
        <input
          type="range"
          min="3"
          max="15"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>3s</span>
          <span>15s</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generateMutation.isPending || (!selectedPrompt && !prompt.trim())}
        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Video (10 credits)</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Generation takes 1-2 minutes. You'll be notified when ready.
      </p>
    </div>
  );
}
