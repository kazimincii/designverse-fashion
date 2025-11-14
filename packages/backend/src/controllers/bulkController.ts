import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Bulk delete stories
 */
export const bulkDeleteStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { storyIds } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      throw new AppError('storyIds must be a non-empty array', 400);
    }

    if (storyIds.length > 50) {
      throw new AppError('Cannot delete more than 50 stories at once', 400);
    }

    // Verify ownership of all stories
    const stories = await prisma.story.findMany({
      where: {
        id: { in: storyIds },
      },
      select: { id: true, ownerId: true },
    });

    const unauthorizedStories = stories.filter((s) => s.ownerId !== userId);
    if (unauthorizedStories.length > 0) {
      throw new AppError(
        'Not authorized to delete some of the selected stories',
        403
      );
    }

    // Delete stories (cascades to clips, likes, comments, etc.)
    const result = await prisma.story.deleteMany({
      where: {
        id: { in: storyIds },
        ownerId: userId,
      },
    });

    res.json({
      success: true,
      message: `${result.count} stories deleted successfully`,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk update story privacy
 */
export const bulkUpdateStoryPrivacy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { storyIds, privacy } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      throw new AppError('storyIds must be a non-empty array', 400);
    }

    if (storyIds.length > 100) {
      throw new AppError('Cannot update more than 100 stories at once', 400);
    }

    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(privacy)) {
      throw new AppError('Invalid privacy value', 400);
    }

    // Update stories (only user's own stories)
    const result = await prisma.story.updateMany({
      where: {
        id: { in: storyIds },
        ownerId: userId,
      },
      data: { privacy },
    });

    res.json({
      success: true,
      message: `${result.count} stories updated successfully`,
      data: { updatedCount: result.count, privacy },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk add tags to stories
 */
export const bulkAddStoryTags = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { storyIds, tags } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      throw new AppError('storyIds must be a non-empty array', 400);
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new AppError('tags must be a non-empty array', 400);
    }

    if (storyIds.length > 100) {
      throw new AppError('Cannot update more than 100 stories at once', 400);
    }

    // Get existing stories with their tags
    const stories = await prisma.story.findMany({
      where: {
        id: { in: storyIds },
        ownerId: userId,
      },
      select: { id: true, tags: true },
    });

    // Update each story with merged tags (avoid duplicates)
    const updates = stories.map((story) => {
      const mergedTags = Array.from(new Set([...story.tags, ...tags]));
      return prisma.story.update({
        where: { id: story.id },
        data: { tags: mergedTags },
      });
    });

    await prisma.$transaction(updates);

    res.json({
      success: true,
      message: `Tags added to ${stories.length} stories successfully`,
      data: { updatedCount: stories.length, tagsAdded: tags },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk delete templates
 */
export const bulkDeleteTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { templateIds } = req.body;

    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      throw new AppError('templateIds must be a non-empty array', 400);
    }

    if (templateIds.length > 50) {
      throw new AppError('Cannot delete more than 50 templates at once', 400);
    }

    // Delete templates (only user's own templates)
    const result = await prisma.sessionTemplate.deleteMany({
      where: {
        id: { in: templateIds },
        ownerId: userId,
      },
    });

    res.json({
      success: true,
      message: `${result.count} templates deleted successfully`,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk update template visibility
 */
export const bulkUpdateTemplateVisibility = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const { templateIds, isPublic } = req.body;

    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      throw new AppError('templateIds must be a non-empty array', 400);
    }

    if (typeof isPublic !== 'boolean') {
      throw new AppError('isPublic must be a boolean', 400);
    }

    if (templateIds.length > 100) {
      throw new AppError('Cannot update more than 100 templates at once', 400);
    }

    // Update templates (only user's own templates)
    const result = await prisma.sessionTemplate.updateMany({
      where: {
        id: { in: templateIds },
        ownerId: userId,
      },
      data: { isPublic },
    });

    res.json({
      success: true,
      message: `${result.count} templates updated successfully`,
      data: { updatedCount: result.count, isPublic },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Bulk update story category
 */
export const bulkUpdateStoryCategory = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const { storyIds, category } = req.body;

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      throw new AppError('storyIds must be a non-empty array', 400);
    }

    if (typeof category !== 'string') {
      throw new AppError('category must be a string', 400);
    }

    if (storyIds.length > 100) {
      throw new AppError('Cannot update more than 100 stories at once', 400);
    }

    // Update stories
    const result = await prisma.story.updateMany({
      where: {
        id: { in: storyIds },
        ownerId: userId,
      },
      data: { category },
    });

    res.json({
      success: true,
      message: `${result.count} stories updated successfully`,
      data: { updatedCount: result.count, category },
    });
  } catch (error) {
    throw error;
  }
};
