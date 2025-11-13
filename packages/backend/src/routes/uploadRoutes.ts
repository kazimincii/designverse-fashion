import { Router } from 'express';
import { body } from 'express-validator';
import {
  uploadFile,
  uploadMiddleware,
  getUploadUrl,
  deleteAsset,
  getUserAssets,
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Upload file
router.post('/upload', authenticate, uploadMiddleware, uploadFile);

// Get presigned upload URL (for client-side uploads)
router.post(
  '/upload-url',
  authenticate,
  [
    body('filename').trim().isLength({ min: 1 }),
    body('contentType').trim().isLength({ min: 1 }),
    body('folder').optional().trim(),
    validate,
  ],
  getUploadUrl
);

// Get user assets
router.get('/assets', authenticate, getUserAssets);

// Delete asset
router.delete('/assets/:id', authenticate, deleteAsset);

export default router;
