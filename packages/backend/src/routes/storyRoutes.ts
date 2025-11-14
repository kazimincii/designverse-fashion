import { Router } from 'express';
import { body } from 'express-validator';
import {
  createStory,
  getMyStories,
  getStoryById,
  updateStory,
  deleteStory,
  getFeed,
  getAvailableCategories,
  getPopularTags,
} from '../controllers/storyController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('privacy').optional().isIn(['PRIVATE', 'UNLISTED', 'PUBLIC']),
    body('category').optional().trim().isLength({ max: 50 }),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ min: 1, max: 30 }),
    validate,
  ],
  createStory
);

router.get('/my-stories', authenticate, getMyStories);
router.get('/feed', optionalAuth, getFeed);
router.get('/categories', optionalAuth, getAvailableCategories);
router.get('/tags/popular', optionalAuth, getPopularTags);
router.get('/:id', optionalAuth, getStoryById);

router.patch(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('privacy').optional().isIn(['PRIVATE', 'UNLISTED', 'PUBLIC']),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED']),
    body('category').optional().trim().isLength({ max: 50 }),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ min: 1, max: 30 }),
    validate,
  ],
  updateStory
);

router.delete('/:id', authenticate, deleteStory);

export default router;
