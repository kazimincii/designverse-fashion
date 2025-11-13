import { Router } from 'express';
import { body } from 'express-validator';
import {
  enhancePrompt,
  generateVideoFromText,
  generateVideoFromImage,
  getJobStatus,
  getUserJobs,
  suggestImprovements,
  generateStoryStructure,
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Prompt enhancement
router.post(
  '/enhance-prompt',
  authenticate,
  [body('prompt').trim().isLength({ min: 1, max: 500 }), validate],
  enhancePrompt
);

// Suggest improvements
router.post(
  '/suggest-improvements',
  authenticate,
  [body('prompt').trim().isLength({ min: 1, max: 500 }), validate],
  suggestImprovements
);

// Generate story structure
router.post(
  '/generate-story-structure',
  authenticate,
  [
    body('theme').trim().isLength({ min: 1, max: 200 }),
    body('clipCount').optional().isInt({ min: 3, max: 10 }),
    validate,
  ],
  generateStoryStructure
);

// Video generation
router.post(
  '/generate-video-from-text',
  authenticate,
  [
    body('prompt').trim().isLength({ min: 1, max: 500 }),
    body('storyId').optional().isString(),
    body('duration').optional().isInt({ min: 3, max: 15 }),
    validate,
  ],
  generateVideoFromText
);

router.post(
  '/generate-video-from-image',
  authenticate,
  [
    body('imageUrl').isURL(),
    body('prompt').optional().trim(),
    body('storyId').optional().isString(),
    body('duration').optional().isInt({ min: 3, max: 15 }),
    validate,
  ],
  generateVideoFromImage
);

// Job management
router.get('/jobs', authenticate, getUserJobs);
router.get('/jobs/:id', authenticate, getJobStatus);

export default router;
