import { Router } from 'express';
import { body } from 'express-validator';
import {
  bulkDeleteStories,
  bulkUpdateStoryPrivacy,
  bulkAddStoryTags,
  bulkDeleteTemplates,
  bulkUpdateTemplateVisibility,
  bulkUpdateStoryCategory,
} from '../controllers/bulkController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// ============================================================
// BULK STORY OPERATIONS
// ============================================================

// Bulk delete stories
router.post(
  '/stories/delete',
  authenticate,
  [
    body('storyIds').isArray({ min: 1, max: 50 }),
    body('storyIds.*').isString(),
    validate,
  ],
  bulkDeleteStories
);

// Bulk update story privacy
router.post(
  '/stories/privacy',
  authenticate,
  [
    body('storyIds').isArray({ min: 1, max: 100 }),
    body('storyIds.*').isString(),
    body('privacy').isIn(['PUBLIC', 'UNLISTED', 'PRIVATE']),
    validate,
  ],
  bulkUpdateStoryPrivacy
);

// Bulk add tags to stories
router.post(
  '/stories/tags/add',
  authenticate,
  [
    body('storyIds').isArray({ min: 1, max: 100 }),
    body('storyIds.*').isString(),
    body('tags').isArray({ min: 1, max: 20 }),
    body('tags.*').trim().isLength({ min: 1, max: 50 }),
    validate,
  ],
  bulkAddStoryTags
);

// Bulk update story category
router.post(
  '/stories/category',
  authenticate,
  [
    body('storyIds').isArray({ min: 1, max: 100 }),
    body('storyIds.*').isString(),
    body('category').trim().isLength({ min: 1, max: 50 }),
    validate,
  ],
  bulkUpdateStoryCategory
);

// ============================================================
// BULK TEMPLATE OPERATIONS
// ============================================================

// Bulk delete templates
router.post(
  '/templates/delete',
  authenticate,
  [
    body('templateIds').isArray({ min: 1, max: 50 }),
    body('templateIds.*').isString(),
    validate,
  ],
  bulkDeleteTemplates
);

// Bulk update template visibility
router.post(
  '/templates/visibility',
  authenticate,
  [
    body('templateIds').isArray({ min: 1, max: 100 }),
    body('templateIds.*').isString(),
    body('isPublic').isBoolean(),
    validate,
  ],
  bulkUpdateTemplateVisibility
);

export default router;
