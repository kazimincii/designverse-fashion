import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

interface VideoGenerationParams {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  fps?: number;
  model?: string;
}

interface ImageToVideoParams {
  imageUrl: string;
  prompt?: string;
  duration?: number;
}

export const aiService = {
  // Enhance user's prompt using GPT-4
  async enhancePrompt(userPrompt: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a video prompt enhancement expert. Given a user's simple video idea,
            create 3 enhanced, detailed prompts optimized for AI video generation. Each prompt should:
            - Include cinematic camera movements and angles
            - Specify lighting and mood
            - Add concrete visual details
            - Be 1-2 sentences long
            - Be creative but stay true to the user's intent

            Return only the 3 prompts, one per line, without numbering.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.8,
      });

      const enhancedPrompts = completion.choices[0].message.content
        ?.split('\n')
        .filter((p) => p.trim().length > 0)
        .slice(0, 3) || [userPrompt];

      return enhancedPrompts;
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      return [userPrompt];
    }
  },

  // Generate video using Replicate (Stable Video Diffusion)
  async generateVideoFromText(params: VideoGenerationParams): Promise<any> {
    try {
      // First generate an image from the prompt using DALL-E
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = imageResponse.data[0].url;

      // Then convert image to video using Stable Video Diffusion
      return await this.generateVideoFromImage({
        imageUrl: imageUrl!,
        prompt: params.prompt,
        duration: params.duration || 4,
      });
    } catch (error) {
      console.error('Error generating video from text:', error);
      throw error;
    }
  },

  // Generate video from image using Replicate
  async generateVideoFromImage(params: ImageToVideoParams): Promise<any> {
    try {
      const response = await axios.post(
        REPLICATE_API_URL,
        {
          version: 'stability-ai/stable-video-diffusion',
          input: {
            input_image: params.imageUrl,
            fps: 6,
            motion_bucket_id: 127,
            cond_aug: 0.02,
            decoding_t: 14,
            video_length: params.duration || 4,
          },
        },
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error generating video from image:', error.response?.data || error);
      throw error;
    }
  },

  // Check status of video generation on Replicate
  async checkVideoStatus(predictionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${REPLICATE_API_URL}/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  },

  // Generate video description using GPT-4 Vision
  async describeVideo(videoUrl: string): Promise<string> {
    try {
      // Note: GPT-4 Vision works with images, for videos we'd need to extract frames
      // For now, we'll return a placeholder
      return 'Video analysis will be implemented with frame extraction';
    } catch (error) {
      console.error('Error describing video:', error);
      throw error;
    }
  },

  // Suggest improvements for a video prompt
  async suggestImprovements(currentPrompt: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a video production expert. Given a video prompt, suggest 3 specific
            improvements to make the video more engaging. Focus on:
            - Camera movements and angles
            - Lighting and atmosphere
            - Visual composition
            - Pacing and timing

            Return 3 concise suggestions, one per line.`,
          },
          {
            role: 'user',
            content: currentPrompt,
          },
        ],
        temperature: 0.7,
      });

      const suggestions = completion.choices[0].message.content
        ?.split('\n')
        .filter((s) => s.trim().length > 0)
        .slice(0, 3) || [];

      return suggestions;
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return [];
    }
  },

  // Generate story structure suggestions
  async generateStoryStructure(theme: string, clipCount: number): Promise<any[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a storytelling expert. Create a video story structure with ${clipCount} clips
            based on the given theme. For each clip, provide:
            - A detailed visual prompt (2-3 sentences)
            - Suggested duration (3-15 seconds)
            - Camera movement

            Return as JSON array with format: [{"clipNumber": 1, "prompt": "...", "duration": 5, "cameraMovement": "..."}]`,
          },
          {
            role: 'user',
            content: `Theme: ${theme}`,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return response.clips || [];
    } catch (error) {
      console.error('Error generating story structure:', error);
      return [];
    }
  },
};
