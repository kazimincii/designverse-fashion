import { Router } from 'express';
import { query } from 'express-validator';
import {
  globalSearch,
  advancedStoryFilter,
  getSearchSuggestions,
} from '../controllers/searchController';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Global search across all content types
router.get(
  '/global',
  optionalAuth,
  [
    query('query').trim().isLength({ min: 1, max: 100 }),
    query('type').optional().isIn(['story', 'template', 'session']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  cacheMiddleware(60, 'search:global'), // Cache for 1 minute
  globalSearch
);

// Advanced filtering for stories
router.get(
  '/stories/filter',
  optionalAuth,
  [
    query('category').optional().trim().isLength({ max: 50 }),
    query('tags').optional().trim(),
    query('minViews').optional().isInt({ min: 0 }),
    query('maxViews').optional().isInt({ min: 0 }),
    query('minLikes').optional().isInt({ min: 0 }),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('sortBy').optional().isIn(['createdAt', 'viewCount', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    validate,
  ],
  cacheMiddleware(120, 'search:stories:filter'), // Cache for 2 minutes
  advancedStoryFilter
);

// Search suggestions (autocomplete)
router.get(
  '/suggestions',
  [
    query('query').trim().isLength({ min: 2, max: 50 }),
    validate,
  ],
  cacheMiddleware(300, 'search:suggestions'), // Cache for 5 minutes
  getSearchSuggestions
);

export default router;
