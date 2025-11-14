import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, privacy, category, tags } = req.body;
    const userId = req.user!.userId;

    const story = await prisma.story.create({
      data: {
        title,
        description,
        privacy: privacy || 'UNLISTED',
        ownerId: userId,
        ...(category && { category }),
        ...(tags && { tags }),
      },
      include: {
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { story },
    });
  } catch (error) {
    throw error;
  }
};

export const getMyStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, folderId } = req.query;

    const where: any = { ownerId: userId };

    if (status) {
      where.status = status;
    }

    const stories = await prisma.story.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        clips: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { stories },
    });
  } catch (error) {
    throw error;
  }
};

export const getStoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        clips: {
          orderBy: { orderIndex: 'asc' },
          include: {
            textOverlays: true,
          },
        },
        textOverlays: true,
        audioTracks: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    // Check privacy
    if (story.privacy === 'PRIVATE' && story.ownerId !== req.user?.userId) {
      throw new AppError('Not authorized to view this story', 403);
    }

    // Increment view count if not owner
    if (story.ownerId !== req.user?.userId) {
      await prisma.story.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    res.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    throw error;
  }
};

export const updateStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, description, privacy, status, category, tags } = req.body;

    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.ownerId !== userId) {
      throw new AppError('Not authorized to update this story', 403);
    }

    const updatedStory = await prisma.story.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(privacy && { privacy }),
        ...(status && { status }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(status === 'PUBLISHED' && !story.publishedAt && { publishedAt: new Date() }),
      },
      include: {
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { story: updatedStory },
    });
  } catch (error) {
    throw error;
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.ownerId !== userId) {
      throw new AppError('Not authorized to delete this story', 403);
    }

    await prisma.story.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, type = 'global', category, tags } = req.query;
    const userId = req.user?.userId;

    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {
      status: 'PUBLISHED',
      privacy: 'PUBLIC',
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by tags (if any tag matches)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagArray,
      };
    }

    if (type === 'following' && userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followedId: true },
      });

      where.ownerId = {
        in: following.map((f: any) => f.followedId),
      };
    }

    const stories = await prisma.story.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        clips: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      skip,
      take: Number(limit),
    });

    const total = await prisma.story.count({ where });

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAvailableCategories = async (req: AuthRequest, res: Response) => {
  try {
    // Get distinct categories from published stories
    const stories = await prisma.story.findMany({
      where: {
        status: 'PUBLISHED',
        privacy: 'PUBLIC',
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = stories
      .map((s) => s.category)
      .filter((c): c is string => c !== null)
      .sort();

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    throw error;
  }
};

export const getPopularTags = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    // Get all tags from published public stories
    const stories = await prisma.story.findMany({
      where: {
        status: 'PUBLISHED',
        privacy: 'PUBLIC',
        tags: {
          isEmpty: false,
        },
      },
      select: {
        tags: true,
      },
    });

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    stories.forEach((story) => {
      story.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and limit
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Number(limit))
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: { tags: popularTags },
    });
  } catch (error) {
    throw error;
  }
};
