import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPhotoSession,
  getUserPhotoSessions,
  getPhotoSession,
  uploadPhoto,
  applyVirtualTryOn,
  generateVariations,
  upscaleImage,
  createAnimation,
  deletePhotoSession,
} from '../controllers/photoSessionController';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../controllers/uploadController';
import { validate } from '../middleware/validation';

const router = Router();

// Photo session management
router.post(
  '/sessions',
  authenticate,
  [body('title').optional().trim(), validate],
  createPhotoSession
);

router.get('/sessions', authenticate, getUserPhotoSessions);
router.get('/sessions/:id', authenticate, getPhotoSession);
router.delete('/sessions/:id', authenticate, deletePhotoSession);

// Step 1: Upload
router.post(
  '/sessions/:sessionId/upload',
  authenticate,
  uploadMiddleware,
  uploadPhoto
);

// Step 2: Virtual try-on
router.post(
  '/sessions/:sessionId/try-on',
  authenticate,
  [
    body('productAssetId').notEmpty(),
    body('modelAssetId').notEmpty(),
    validate,
  ],
  applyVirtualTryOn
);

// Step 3: Generate variations
router.post(
  '/sessions/:sessionId/variations',
  authenticate,
  [
    body('baseAssetId').notEmpty(),
    body('mood').optional().isIn(['minimalist', 'dynamic', 'dramatic']),
    body('framing').optional(),
    body('count').optional().isInt({ min: 1, max: 12 }),
    validate,
  ],
  generateVariations
);

// Step 4: Upscale
router.post(
  '/sessions/:sessionId/upscale',
  authenticate,
  [
    body('assetId').notEmpty(),
    body('factor').isInt({ min: 2, max: 4 }),
    validate,
  ],
  upscaleImage
);

// Step 5: Create animation
router.post(
  '/sessions/:sessionId/animate',
  authenticate,
  [
    body('assetIds').isArray({ min: 1 }),
    body('duration').optional().isInt({ min: 5, max: 10 }),
    body('style').optional().isIn(['SUBTLE_CINEMATIC', 'LOOKBOOK', 'DYNAMIC']),
    validate,
  ],
  createAnimation
);

export default router;
