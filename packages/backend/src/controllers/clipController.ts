import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createClip = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId, inputPrompt, videoUrl, thumbnailUrl, durationSeconds, sourceType, orderIndex } = req.body;
    const userId = req.user!.userId;

    // Verify story ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.ownerId !== userId) {
      throw new AppError('Not authorized to add clips to this story', 403);
    }

    // Get the next order index if not provided
    let clipOrderIndex = orderIndex;
    if (clipOrderIndex === undefined) {
      const lastClip = await prisma.clip.findFirst({
        where: { storyId },
        orderBy: { orderIndex: 'desc' },
      });
      clipOrderIndex = lastClip ? lastClip.orderIndex + 1 : 0;
    }

    const clip = await prisma.clip.create({
      data: {
        storyId,
        inputPrompt,
        videoUrl,
        thumbnailUrl,
        durationSeconds,
        sourceType: sourceType || 'UPLOADED',
        orderIndex: clipOrderIndex,
      },
    });

    // Update story total duration
    const clips = await prisma.clip.findMany({
      where: { storyId },
    });
    const totalDuration = clips.reduce((sum: number, c: any) => sum + c.durationSeconds, 0);

    await prisma.story.update({
      where: { id: storyId },
      data: { totalDurationSeconds: totalDuration },
    });

    res.status(201).json({
      success: true,
      data: { clip },
    });
  } catch (error) {
    throw error;
  }
};

export const updateClip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updates = req.body;

    const clip = await prisma.clip.findUnique({
      where: { id },
      include: { story: true },
    });

    if (!clip) {
      throw new AppError('Clip not found', 404);
    }

    if (clip.story.ownerId !== userId) {
      throw new AppError('Not authorized to update this clip', 403);
    }

    const updatedClip = await prisma.clip.update({
      where: { id },
      data: updates,
    });

    res.json({
      success: true,
      data: { clip: updatedClip },
    });
  } catch (error) {
    throw error;
  }
};

export const deleteClip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const clip = await prisma.clip.findUnique({
      where: { id },
      include: { story: true },
    });

    if (!clip) {
      throw new AppError('Clip not found', 404);
    }

    if (clip.story.ownerId !== userId) {
      throw new AppError('Not authorized to delete this clip', 403);
    }

    await prisma.clip.delete({
      where: { id },
    });

    // Update story total duration
    const clips = await prisma.clip.findMany({
      where: { storyId: clip.storyId },
    });
    const totalDuration = clips.reduce((sum: number, c: any) => sum + c.durationSeconds, 0);

    await prisma.story.update({
      where: { id: clip.storyId },
      data: { totalDurationSeconds: totalDuration },
    });

    res.json({
      success: true,
      message: 'Clip deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

export const reorderClips = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const { clipIds } = req.body; // Array of clip IDs in new order
    const userId = req.user!.userId;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.ownerId !== userId) {
      throw new AppError('Not authorized to reorder clips in this story', 403);
    }

    // Update order index for each clip
    await Promise.all(
      clipIds.map((clipId: string, index: number) =>
        prisma.clip.update({
          where: { id: clipId },
          data: { orderIndex: index },
        })
      )
    );

    const updatedClips = await prisma.clip.findMany({
      where: { storyId },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({
      success: true,
      data: { clips: updatedClips },
    });
  } catch (error) {
    throw error;
  }
};
