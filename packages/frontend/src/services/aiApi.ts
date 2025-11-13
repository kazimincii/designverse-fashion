import { api } from './api';

export const aiApi = {
  // Enhance prompt
  enhancePrompt: (prompt: string) =>
    api.post('/ai/enhance-prompt', { prompt }),

  // Suggest improvements
  suggestImprovements: (prompt: string) =>
    api.post('/ai/suggest-improvements', { prompt }),

  // Generate story structure
  generateStoryStructure: (theme: string, clipCount?: number) =>
    api.post('/ai/generate-story-structure', { theme, clipCount }),

  // Generate video from text
  generateVideoFromText: (data: {
    prompt: string;
    storyId?: string;
    duration?: number;
    aspectRatio?: string;
    fps?: number;
  }) => api.post('/ai/generate-video-from-text', data),

  // Generate video from image
  generateVideoFromImage: (data: {
    imageUrl: string;
    prompt?: string;
    storyId?: string;
    duration?: number;
  }) => api.post('/ai/generate-video-from-image', data),

  // Get job status
  getJobStatus: (jobId: string) => api.get(`/ai/jobs/${jobId}`),

  // Get user jobs
  getUserJobs: (status?: string) =>
    api.get('/ai/jobs', { params: { status } }),
};
