import { videoGenerationQueue } from '../services/jobQueue';
import { prisma } from '../config/database';
import { aiService } from '../services/aiService';

// Process video generation jobs
videoGenerationQueue.process(async (job) => {
  const { jobId, userId, inputPayload } = job.data;

  try {
    console.log(`Processing video generation job ${jobId} for user ${userId}`);

    // Update job status to RUNNING
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    let predictionData;

    // Generate video based on type
    if (inputPayload.type === 'image-to-video') {
      // Image to video
      predictionData = await aiService.generateVideoFromImage({
        imageUrl: inputPayload.imageUrl,
        prompt: inputPayload.prompt,
        duration: inputPayload.duration,
      });
    } else {
      // Text to video
      predictionData = await aiService.generateVideoFromText({
        prompt: inputPayload.prompt,
        duration: inputPayload.duration,
        aspectRatio: inputPayload.aspectRatio,
        fps: inputPayload.fps,
      });
    }

    // Poll for completion
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const status = await aiService.checkVideoStatus(predictionData.id);

      if (status.status === 'succeeded') {
        videoUrl = status.output;
        break;
      } else if (status.status === 'failed') {
        throw new Error('Video generation failed: ' + status.error);
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    // Update job with success
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SUCCEEDED',
        outputPayloadJson: {
          videoUrl,
          predictionId: predictionData.id,
        },
      },
    });

    // If storyId is provided, create clip
    if (inputPayload.storyId) {
      const clipCount = await prisma.clip.count({
        where: { storyId: inputPayload.storyId },
      });

      await prisma.clip.create({
        data: {
          storyId: inputPayload.storyId,
          orderIndex: clipCount,
          sourceType: 'GENERATED',
          inputPrompt: inputPayload.prompt,
          modelProvider: 'replicate',
          modelName: 'stable-video-diffusion',
          videoUrl,
          durationSeconds: inputPayload.duration || 4,
          metadata: {
            aspectRatio: inputPayload.aspectRatio,
            fps: inputPayload.fps,
            predictionId: predictionData.id,
          },
        },
      });

      // Update story total duration
      const clips = await prisma.clip.findMany({
        where: { storyId: inputPayload.storyId },
      });
      const totalDuration = clips.reduce((sum, c) => sum + c.durationSeconds, 0);

      await prisma.story.update({
        where: { id: inputPayload.storyId },
        data: { totalDurationSeconds: totalDuration },
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'STORY_EXPORT_READY',
        payloadJson: {
          jobId,
          videoUrl,
          storyId: inputPayload.storyId,
        },
      },
    });

    console.log(`Job ${jobId} completed successfully`);
    return { success: true, jobId, videoUrl };
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job with failure
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
});

console.log('Video generation worker started');
