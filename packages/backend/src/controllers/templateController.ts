import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a new session template
 */
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, category, thumbnailUrl, templateData, isPublic, tags } = req.body;

    const template = await prisma.sessionTemplate.create({
      data: {
        name,
        description,
        category,
        thumbnailUrl,
        templateData,
        isPublic: isPublic || false,
        tags: tags || [],
        ownerId: userId,
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
      message: 'Template created successfully',
      data: { template },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's templates
 */
export const getMyTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const templates = await prisma.sessionTemplate.findMany({
      where: { ownerId: userId },
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
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { templates, count: templates.length },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get public templates (discover)
 */
export const getPublicTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { category, limit = 20 } = req.query;

    const where: any = { isPublic: true };
    if (category) {
      where.category = category;
    }

    const templates = await prisma.sessionTemplate.findMany({
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
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: Number(limit),
    });

    res.json({
      success: true,
      data: { templates, count: templates.length },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
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

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check access permissions
    if (!template.isPublic && template.ownerId !== userId) {
      throw new AppError('Not authorized to view this template', 403);
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update template
 */
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, description, category, thumbnailUrl, templateData, isPublic, tags } = req.body;

    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (template.ownerId !== userId) {
      throw new AppError('Not authorized to update this template', 403);
    }

    const updatedTemplate = await prisma.sessionTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(templateData && { templateData }),
        ...(isPublic !== undefined && { isPublic }),
        ...(tags !== undefined && { tags }),
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
      message: 'Template updated successfully',
      data: { template: updatedTemplate },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (template.ownerId !== userId) {
      throw new AppError('Not authorized to delete this template', 403);
    }

    await prisma.sessionTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Increment template usage count
 */
export const useTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Check access permissions
    if (!template.isPublic && template.ownerId !== userId) {
      throw new AppError('Not authorized to use this template', 403);
    }

    // Increment usage count
    await prisma.sessionTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    res.json({
      success: true,
      message: 'Template usage recorded',
      data: { templateData: template.templateData },
    });
  } catch (error) {
    throw error;
  }
};
