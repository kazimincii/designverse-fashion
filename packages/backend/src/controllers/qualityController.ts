import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QualityAssuranceService } from '../services/qualityAssuranceService';
import { referenceService } from '../services/referenceService';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { GenerationHistory, PhotoSession } from '@prisma/client';
import { createObjectCsvStringifier } from 'csv-writer';

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
 * Get generation history with advanced filters
 */
export const getGenerationHistoryFiltered = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const {
      search,
      minScore,
      maxScore,
      modelName,
      wasRegenerated,
      sortBy,
      sortOrder,
      limit,
    } = req.query;
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

    // Parse filters
    const options: any = {};
    if (search) options.search = search as string;
    if (minScore) options.minScore = parseFloat(minScore as string);
    if (maxScore) options.maxScore = parseFloat(maxScore as string);
    if (modelName) options.modelName = modelName as string;
    if (wasRegenerated !== undefined) options.wasRegenerated = wasRegenerated === 'true';
    if (sortBy) options.sortBy = sortBy as 'date' | 'score' | 'cost';
    if (sortOrder) options.sortOrder = sortOrder as 'asc' | 'desc';
    if (limit) options.limit = parseInt(limit as string);

    // Get filtered history
    const history = await referenceService.getGenerationHistoryFiltered(sessionId, options);

    res.json({
      success: true,
      data: { history, filters: options },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get analytics for all sessions (user's own data)
 */
export const getGlobalQualityAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, minGenerations } = req.query;

    const { photoSessionService } = await import('../services/photoSessionService');

    // Get all user's sessions
    const userSessions = await prisma.photoSession.findMany({
      where: {
        ownerId: userId,
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      select: { id: true },
    });

    const sessionIds = userSessions.map((s: Pick<PhotoSession, 'id'>) => s.id);

    if (sessionIds.length === 0) {
      return res.json({
        success: true,
        data: {
          analytics: {
            totalSessions: 0,
            totalGenerations: 0,
            averageConsistencyScore: 0,
            averageFaceScore: 0,
            averageGarmentScore: 0,
            averageStyleScore: 0,
            successRate: 0,
            regenerationRate: 0,
            totalCost: 0,
            topPerformingModels: [],
            mostUsedModels: [],
            commonIssues: [],
            qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
            timeSeriesData: [],
          },
        },
      });
    }

    // Get all generation history for user's sessions
    const allHistory = await prisma.generationHistory.findMany({
      where: {
        sessionId: { in: sessionIds },
        ...(minGenerations ? { consistencyScore: { not: null } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalGenerations = allHistory.length;
    const totalSessions = sessionIds.length;

    // Calculate average scores
    const generationsWithScores = allHistory.filter((h: GenerationHistory) => h.consistencyScore !== null) as (GenerationHistory & { consistencyScore: number })[];
    const avgConsistencyScore = generationsWithScores.length > 0
      ? generationsWithScores.reduce((sum: number, h: GenerationHistory) => sum + (h.consistencyScore || 0), 0) / generationsWithScores.length
      : 0;

    const withFaceScore = allHistory.filter((h: GenerationHistory) => h.faceSimScore !== null && h.faceSimScore > 0) as (GenerationHistory & { faceSimScore: number })[];
    const avgFaceScore = withFaceScore.length > 0
      ? withFaceScore.reduce((sum: number, h: GenerationHistory) => sum + (h.faceSimScore || 0), 0) / withFaceScore.length
      : 0;

    const withGarmentScore = allHistory.filter((h: GenerationHistory) => h.garmentAccScore !== null && h.garmentAccScore > 0) as (GenerationHistory & { garmentAccScore: number })[];
    const avgGarmentScore = withGarmentScore.length > 0
      ? withGarmentScore.reduce((sum: number, h: GenerationHistory) => sum + (h.garmentAccScore || 0), 0) / withGarmentScore.length
      : 0;

    const withStyleScore = allHistory.filter((h: GenerationHistory) => h.styleMatchScore !== null && h.styleMatchScore > 0) as (GenerationHistory & { styleMatchScore: number })[];
    const avgStyleScore = withStyleScore.length > 0
      ? withStyleScore.reduce((sum: number, h: GenerationHistory) => sum + (h.styleMatchScore || 0), 0) / withStyleScore.length
      : 0;

    // Success rate (score >= 70)
    const successfulGenerations = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) >= 70);
    const successRate = generationsWithScores.length > 0
      ? successfulGenerations.length / generationsWithScores.length
      : 0;

    // Regeneration rate
    const regeneratedCount = allHistory.filter((h: GenerationHistory) => h.wasRegenerated).length;
    const regenerationRate = totalGenerations > 0 ? regeneratedCount / totalGenerations : 0;

    // Total cost
    const totalCost = allHistory.reduce((sum: number, h: GenerationHistory) => sum + (h.apiCostUsd || 0), 0);

    // Top performing models (by average score)
    const modelStats = new Map<string, { totalScore: number; count: number; avgScore: number }>();
    generationsWithScores.forEach((h: GenerationHistory) => {
      if (h.modelName) {
        const stats = modelStats.get(h.modelName) || { totalScore: 0, count: 0, avgScore: 0 };
        stats.totalScore += h.consistencyScore || 0;
        stats.count += 1;
        stats.avgScore = stats.totalScore / stats.count;
        modelStats.set(h.modelName, stats);
      }
    });

    const topPerformingModels = Array.from(modelStats.entries())
      .map(([name, stats]) => ({ model: name, averageScore: stats.avgScore, usageCount: stats.count }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Most used models
    const mostUsedModels = Array.from(modelStats.entries())
      .map(([name, stats]) => ({ model: name, usageCount: stats.count, averageScore: stats.avgScore }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Common issues (from failed generations)
    const failedGenerations = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) < 70);
    const issueCategories: string[] = [];
    failedGenerations.forEach((h: GenerationHistory) => {
      if (h.faceSimScore && h.faceSimScore < 70) issueCategories.push('Face consistency issues');
      if (h.garmentAccScore && h.garmentAccScore < 70) issueCategories.push('Garment accuracy issues');
      if (h.styleMatchScore && h.styleMatchScore < 70) issueCategories.push('Style matching issues');
    });

    const issueCounts = new Map<string, number>();
    issueCategories.forEach((issue: string) => {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    });

    const commonIssues = Array.from(issueCounts.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Quality distribution
    const excellent = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) >= 90).length;
    const good = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) >= 80 && (h.consistencyScore || 0) < 90).length;
    const fair = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) >= 70 && (h.consistencyScore || 0) < 80).length;
    const poor = generationsWithScores.filter((h: GenerationHistory) => (h.consistencyScore || 0) < 70).length;

    // Time series data (daily aggregates for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHistory = allHistory.filter((h: GenerationHistory) => new Date(h.createdAt) >= thirtyDaysAgo);
    const dailyStats = new Map<string, { date: string; count: number; avgScore: number; totalScore: number }>();

    recentHistory.forEach((h: GenerationHistory) => {
      const dateKey = new Date(h.createdAt).toISOString().split('T')[0];
      const stats = dailyStats.get(dateKey) || { date: dateKey, count: 0, avgScore: 0, totalScore: 0 };
      stats.count += 1;
      if (h.consistencyScore) {
        stats.totalScore += h.consistencyScore;
        stats.avgScore = stats.totalScore / stats.count;
      }
      dailyStats.set(dateKey, stats);
    });

    const timeSeriesData = Array.from(dailyStats.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        analytics: {
          totalSessions,
          totalGenerations,
          averageConsistencyScore: Math.round(avgConsistencyScore * 10) / 10,
          averageFaceScore: Math.round(avgFaceScore * 10) / 10,
          averageGarmentScore: Math.round(avgGarmentScore * 10) / 10,
          averageStyleScore: Math.round(avgStyleScore * 10) / 10,
          successRate: Math.round(successRate * 100),
          regenerationRate: Math.round(regenerationRate * 100),
          totalCost: Math.round(totalCost * 100) / 100,
          topPerformingModels,
          mostUsedModels,
          commonIssues,
          qualityDistribution: { excellent, good, fair, poor },
          timeSeriesData,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Export generation history as CSV
 */
export const exportGenerationHistoryCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.userId;

    const { photoSessionService } = await import('../services/photoSessionService');
    const session = await photoSessionService.getSession(sessionId);

    if (!session || session.ownerId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const history = await referenceService.getGenerationHistory(sessionId, 1000);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'consistencyScore', title: 'Quality Score' },
        { id: 'faceSimScore', title: 'Face Score' },
        { id: 'garmentAccScore', title: 'Garment Score' },
        { id: 'styleMatchScore', title: 'Style Score' },
        { id: 'modelName', title: 'Model Used' },
        { id: 'wasRegenerated', title: 'Regenerated' },
        { id: 'userRating', title: 'User Rating' },
        { id: 'apiCostUsd', title: 'Cost (USD)' },
      ],
    });

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(history);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="generation-history-${sessionId}.csv"`);
    res.send(csvData);
  } catch (error) {
    throw error;
  }
};
