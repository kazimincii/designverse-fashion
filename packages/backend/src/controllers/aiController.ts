import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { prisma } from '../config/database';
import { addVideoGenerationJob } from '../services/jobQueue';
import { AppError } from '../middleware/errorHandler';

// Enhance prompt
export const enhancePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      throw new AppError('Prompt is required', 400);
    }

    const enhancedPrompts = await aiService.enhancePrompt(prompt);

    res.json({
      success: true,
      data: { enhancedPrompts },
    });
  } catch (error) {
    throw error;
  }
};

// Generate video from text
export const generateVideoFromText = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, storyId, duration, aspectRatio, fps } = req.body;
    const userId = req.user!.userId;

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.creditsBalance < 10) {
      throw new AppError('Insufficient credits. Video generation costs 10 credits.', 402);
    }

    // Verify story ownership
    if (storyId) {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
      });

      if (!story || story.ownerId !== userId) {
        throw new AppError('Story not found or unauthorized', 404);
      }
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        ownerId: userId,
        jobType: 'GENERATE_CLIP',
        status: 'QUEUED',
        inputPayloadJson: {
          prompt,
          storyId,
          duration: duration || 4,
          aspectRatio: aspectRatio || '16:9',
          fps: fps || 24,
        },
        modelProvider: 'replicate',
      },
    });

    // Add to queue
    await addVideoGenerationJob({
      jobId: job.id,
      userId,
      jobType: 'GENERATE_CLIP',
      inputPayload: {
        prompt,
        storyId,
        duration: duration || 4,
        aspectRatio,
        fps,
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsBalance: {
          decrement: 10,
        },
      },
    });

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: 'Video generation started. This may take 1-2 minutes.',
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

// Generate video from image
export const generateVideoFromImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl, prompt, storyId, duration } = req.body;
    const userId = req.user!.userId;

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.creditsBalance < 8) {
      throw new AppError('Insufficient credits. Image-to-video costs 8 credits.', 402);
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        ownerId: userId,
        jobType: 'GENERATE_CLIP',
        status: 'QUEUED',
        inputPayloadJson: {
          imageUrl,
          prompt,
          storyId,
          duration: duration || 4,
          type: 'image-to-video',
        },
        modelProvider: 'replicate',
      },
    });

    // Add to queue
    await addVideoGenerationJob({
      jobId: job.id,
      userId,
      jobType: 'GENERATE_CLIP',
      inputPayload: {
        imageUrl,
        prompt,
        storyId,
        duration: duration || 4,
        type: 'image-to-video',
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsBalance: {
          decrement: 8,
        },
      },
    });

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: 'Image-to-video generation started.',
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

// Get job status
export const getJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.ownerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    throw error;
  }
};

// Get user's jobs
export const getUserJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    const where: any = { ownerId: userId };
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: { jobs },
    });
  } catch (error) {
    throw error;
  }
};

// Suggest improvements
export const suggestImprovements = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      throw new AppError('Prompt is required', 400);
    }

    const suggestions = await aiService.suggestImprovements(prompt);

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    throw error;
  }
};

// Generate story structure
export const generateStoryStructure = async (req: AuthRequest, res: Response) => {
  try {
    const { theme, clipCount } = req.body;

    if (!theme) {
      throw new AppError('Theme is required', 400);
    }

    const count = clipCount || 5;
    const structure = await aiService.generateStoryStructure(theme, count);

    res.json({
      success: true,
      data: { structure },
    });
  } catch (error) {
    throw error;
  }
};
