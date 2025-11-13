import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { photoSessionService } from '../services/photoSessionService';
import { AppError } from '../middleware/errorHandler';

export const createPhotoSession = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user!.userId;

    const session = await photoSessionService.createSession({
      title: title || 'Untitled Photo Session',
      ownerId: userId,
    });

    res.status(201).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    throw error;
  }
};

export const getUserPhotoSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const sessions = await photoSessionService.getUserSessions(userId);

    res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    throw error;
  }
};

export const getPhotoSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(id);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    throw error;
  }
};

export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, subType } = req.body;
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) {
      throw new AppError('No file provided', 400);
    }

    const session = await photoSessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const photoAsset = await photoSessionService.uploadPhoto({
      sessionId,
      subType,
      fileBuffer: file.buffer,
      filename: file.originalname,
    });

    res.status(201).json({
      success: true,
      data: { photoAsset },
    });
  } catch (error) {
    throw error;
  }
};

export const applyVirtualTryOn = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, productAssetId, modelAssetId } = req.body;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    // Deduct credits
    await req.app.locals.prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: 15 } },
    });

    const job = await photoSessionService.applyVirtualTryOn(
      sessionId,
      productAssetId,
      modelAssetId
    );

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: 'Virtual try-on started. This may take 1-2 minutes.',
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const generateVariations = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, baseAssetId, mood, framing, count } = req.body;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const creditsNeeded = (count || 4) * 5;
    await req.app.locals.prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: creditsNeeded } },
    });

    const job = await photoSessionService.generateVariations(sessionId, baseAssetId, {
      mood,
      framing,
      count,
    });

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: `Generating ${count || 4} variations...`,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const upscaleImage = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, assetId, factor } = req.body;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const creditsNeeded = factor === 2 ? 5 : factor === 4 ? 10 : 15;
    await req.app.locals.prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: creditsNeeded } },
    });

    const job = await photoSessionService.upscaleImage(sessionId, assetId, factor);

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: `Upscaling to ${factor}x...`,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const createAnimation = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, assetIds, duration, style } = req.body;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    await req.app.locals.prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { decrement: 12 } },
    });

    const job = await photoSessionService.createAnimation(sessionId, assetIds, {
      duration,
      style,
    });

    res.status(202).json({
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          message: 'Creating animation...',
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const deletePhotoSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await photoSessionService.getSession(id);
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    await photoSessionService.deleteSession(id);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};
