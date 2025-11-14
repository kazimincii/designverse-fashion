import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import {
  getSessionQualityMetrics,
  getSessionQualityReport,
  getGenerationAnalysis,
  submitGenerationFeedback,
  getGenerationHistory,
  getGlobalQualityAnalytics,
} from '../controllers/qualityController';

const router = Router();

/**
 * Quality Metrics & Analytics Routes
 *
 * All routes require authentication
 * Read operations are cached for performance
 */

// Session-specific quality metrics (cache for 5 minutes)
router.get('/sessions/:sessionId/metrics', authenticate, cacheMiddleware(300, 'quality:metrics'), getSessionQualityMetrics);

// Session quality report (cache for 10 minutes)
router.get('/sessions/:sessionId/report', authenticate, cacheMiddleware(600, 'quality:report'), getSessionQualityReport);

// Generation history analysis (cache for 15 minutes)
router.get('/sessions/:sessionId/analysis', authenticate, cacheMiddleware(900, 'quality:analysis'), getGenerationAnalysis);

// Generation history list (cache for 2 minutes)
router.get('/sessions/:sessionId/history', authenticate, cacheMiddleware(120, 'quality:history'), getGenerationHistory);

// Submit feedback for a specific generation
router.post('/history/:historyId/feedback', authenticate, submitGenerationFeedback);

// Global analytics (admin)
router.get('/analytics/global', authenticate, getGlobalQualityAnalytics);

export default router;
