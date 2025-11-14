import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QualityAssuranceService } from '../services/qualityAssuranceService';
import { referenceService } from '../services/referenceService';
import { AppError } from '../middleware/errorHandler';

/**
 * Get quality metrics for a session
 */
export const getSessionQualityMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // Verify session ownership
    const { photoSessionService } = await import('../services/photoSessionService');
    const session = await photoSessionService.getSession(sessionId);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    // Get quality metrics
    const metrics = await QualityAssuranceService.getQualityMetrics(sessionId);

    res.json({
      success: true,
      data: { metrics },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get quality report for a session
 */
export const getSessionQualityReport = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    // Verify session ownership
    const { photoSessionService } = await import('../services/photoSessionService');
    const session = await photoSessionService.getSession(sessionId);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    // Generate quality report
    const report = await QualityAssuranceService.generateQualityReport(sessionId);

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get generation history analysis
 */
export const getGenerationAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { referenceType } = req.query;
    const userId = req.user!.userId;

    // Verify session ownership
    const { photoSessionService } = await import('../services/photoSessionService');
    const session = await photoSessionService.getSession(sessionId);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    // Analyze generation history
    const analysis = await QualityAssuranceService.analyzeGenerationHistory(
      sessionId,
      referenceType as 'character' | 'garment' | 'style' | undefined
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Submit feedback for a generation
 */
export const submitGenerationFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { historyId } = req.params;
    const { rating, feedback, issues } = req.body;
    const userId = req.user!.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // TODO: Verify the generation history belongs to user's session
    // For now, we'll trust the auth middleware

    // Submit feedback
    await QualityAssuranceService.processFeedback({
      generationHistoryId: historyId,
      userRating: rating,
      userFeedback: feedback,
      specificIssues: issues,
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get generation history for a session
 */
export const getGenerationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.query;
    const userId = req.user!.userId;

    // Verify session ownership
    const { photoSessionService } = await import('../services/photoSessionService');
    const session = await photoSessionService.getSession(sessionId);

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    // Get generation history
    const history = await referenceService.getGenerationHistory(
      sessionId,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get analytics for all sessions (admin only)
 */
export const getGlobalQualityAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // TODO: Check if user is admin
    // For now, we'll allow all authenticated users

    const { startDate, endDate, minGenerations } = req.query;

    // This would aggregate quality metrics across all sessions
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        analytics: {
          totalSessions: 0,
          totalGenerations: 0,
          averageQuality: 0,
          topPerformingModels: [],
          commonIssues: [],
        },
      },
    });
  } catch (error) {
    throw error;
  }
};
