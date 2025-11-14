import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import {
  getSessionQualityMetrics,
  getSessionQualityReport,
  getGenerationAnalysis,
  submitGenerationFeedback,
  getGenerationHistory,
  getGenerationHistoryFiltered,
  getGlobalQualityAnalytics,
  exportGenerationHistoryCSV,
  batchRegenerate,
  getQualityThresholds,
  setQualityThresholds,
  getNotificationPreferences,
  setNotificationPreferences,
  toggleFavorite,
  getFavorites,
} from '../controllers/qualityController';

const router = Router();

/**
 * Quality Metrics & Analytics Routes
 *
 * All routes require authentication
 * Read operations are cached for performance
 */

/**
 * @swagger
 * /api/quality/sessions/{sessionId}/metrics:
 *   get:
 *     tags: [Quality]
 *     summary: Get quality metrics for a photo session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quality metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       $ref: '#/components/schemas/QualityMetrics'
 */
router.get('/sessions/:sessionId/metrics', authenticate, cacheMiddleware(300, 'quality:metrics'), getSessionQualityMetrics);

// Session quality report (cache for 10 minutes)
router.get('/sessions/:sessionId/report', authenticate, cacheMiddleware(600, 'quality:report'), getSessionQualityReport);

// Generation history analysis (cache for 15 minutes)
router.get('/sessions/:sessionId/analysis', authenticate, cacheMiddleware(900, 'quality:analysis'), getGenerationAnalysis);

// Generation history list (cache for 2 minutes)
router.get('/sessions/:sessionId/history', authenticate, cacheMiddleware(120, 'quality:history'), getGenerationHistory);

// Generation history with advanced filters (cache for 1 minute)
router.get('/sessions/:sessionId/history/filtered', authenticate, cacheMiddleware(60, 'quality:history:filtered'), getGenerationHistoryFiltered);

// Submit feedback for a specific generation
router.post('/history/:historyId/feedback', authenticate, submitGenerationFeedback);

/**
 * @swagger
 * /api/quality/analytics/global:
 *   get:
 *     tags: [Quality]
 *     summary: Get global quality analytics across all user sessions
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter sessions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter sessions to this date
 *       - in: query
 *         name: minGenerations
 *         schema:
 *           type: integer
 *         description: Minimum number of generations required
 *     responses:
 *       200:
 *         description: Global analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: integer
 *                         totalGenerations:
 *                           type: integer
 *                         averageConsistencyScore:
 *                           type: number
 *                         topPerformingModels:
 *                           type: array
 *                           items:
 *                             type: object
 */
router.get('/analytics/global', authenticate, cacheMiddleware(900, 'quality:global'), getGlobalQualityAnalytics);

// Export generation history as CSV
router.get('/sessions/:sessionId/export/csv', authenticate, exportGenerationHistoryCSV);

// Batch operations
router.post('/sessions/:sessionId/batch-regenerate', authenticate, batchRegenerate);

// Quality thresholds
router.get('/sessions/:sessionId/thresholds', authenticate, getQualityThresholds);
router.put('/sessions/:sessionId/thresholds', authenticate, setQualityThresholds);

// User notification preferences
router.get('/preferences/notifications', authenticate, getNotificationPreferences);
router.put('/preferences/notifications', authenticate, setNotificationPreferences);

// Favorites
router.post('/history/:historyId/favorite', authenticate, toggleFavorite);
router.get('/sessions/:sessionId/favorites', authenticate, cacheMiddleware(60, 'quality:favorites'), getFavorites);

export default router;
