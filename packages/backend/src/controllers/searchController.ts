import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

/**
 * Global search across stories, templates, and photo sessions
 */
export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { query, type, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const searchTerm = query.toLowerCase();
    const maxResults = Math.min(Number(limit), 50);

    const results: any = {
      stories: [],
      templates: [],
      photoSessions: [],
    };

    // Search stories if no type filter or type is 'story'
    if (!type || type === 'story') {
      const stories = await prisma.story.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { hasSome: [searchTerm] } },
              ],
            },
            {
              OR: [
                { privacy: 'PUBLIC' },
                { ownerId: userId },
              ],
            },
            { status: 'PUBLISHED' },
          ],
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        take: maxResults,
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      results.stories = stories;
    }

    // Search templates if no type filter or type is 'template'
    if (!type || type === 'template') {
      const templates = await prisma.sessionTemplate.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { hasSome: [searchTerm] } },
              ],
            },
            {
              OR: [
                { isPublic: true },
                { ownerId: userId },
              ],
            },
          ],
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
        take: maxResults,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      results.templates = templates;
    }

    // Search photo sessions if authenticated and (no type filter or type is 'session')
    if (userId && (!type || type === 'session')) {
      const photoSessions = await prisma.photoSession.findMany({
        where: {
          AND: [
            { ownerId: userId },
            { title: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              photoAssets: true,
              photoAnimations: true,
            },
          },
        },
        take: maxResults,
        orderBy: { updatedAt: 'desc' },
      });

      results.photoSessions = photoSessions;
    }

    // Calculate total results
    const totalResults =
      results.stories.length +
      results.templates.length +
      results.photoSessions.length;

    res.json({
      success: true,
      data: {
        query: searchTerm,
        totalResults,
        results,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Advanced filtering for stories with multiple criteria
 */
export const advancedStoryFilter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      category,
      tags,
      minViews,
      maxViews,
      minLikes,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = req.query;

    const where: any = {
      AND: [
        {
          OR: [
            { privacy: 'PUBLIC' },
            { ownerId: userId },
          ],
        },
        { status: 'PUBLISHED' },
      ],
    };

    // Apply filters
    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (tags && typeof tags === 'string') {
      where.tags = { hasSome: tags.split(',') };
    }

    if (minViews || maxViews) {
      where.viewCount = {};
      if (minViews) where.viewCount.gte = Number(minViews);
      if (maxViews) where.viewCount.lte = Number(maxViews);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    // Get total count
    const totalCount = await prisma.story.count({ where });

    // Get stories
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({
      success: true,
      data: {
        stories,
        totalCount,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const searchTerm = query.toLowerCase();

    // Get popular tags matching the query
    const stories = await prisma.story.findMany({
      where: {
        AND: [
          { privacy: 'PUBLIC' },
          { status: 'PUBLISHED' },
          { tags: { isEmpty: false } },
        ],
      },
      select: { tags: true },
      take: 100,
    });

    const tagCounts: Record<string, number> = {};
    stories.forEach((story) => {
      story.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(searchTerm)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const tagSuggestions = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Get categories matching the query
    const categories = await prisma.story.findMany({
      where: {
        AND: [
          { privacy: 'PUBLIC' },
          { status: 'PUBLISHED' },
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: { category: true },
      distinct: ['category'],
      take: 5,
    });

    const categorySuggestions = categories
      .map((s) => s.category)
      .filter((c): c is string => c !== null);

    res.json({
      success: true,
      data: {
        suggestions: [...new Set([...tagSuggestions, ...categorySuggestions])],
      },
    });
  } catch (error) {
    throw error;
  }
};
