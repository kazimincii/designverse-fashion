import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTemplate,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  useTemplate,
} from '../controllers/templateController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Create template
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('category').optional().trim().isLength({ max: 50 }),
    body('thumbnailUrl').optional().isURL(),
    body('templateData').notEmpty().isObject(),
    body('isPublic').optional().isBoolean(),
    body('tags').optional().isArray(),
    validate,
  ],
  createTemplate
);

// Get my templates
router.get('/my-templates', authenticate, getMyTemplates);

// Get public templates (cached for 5 minutes)
router.get(
  '/public',
  optionalAuth,
  cacheMiddleware(300, 'templates:public'),
  getPublicTemplates
);

// Get template by ID (cached for 2 minutes)
router.get(
  '/:id',
  optionalAuth,
  cacheMiddleware(120, 'templates:detail'),
  getTemplateById
);

// Update template
router.patch(
  '/:id',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('category').optional().trim().isLength({ max: 50 }),
    body('thumbnailUrl').optional().isURL(),
    body('templateData').optional().isObject(),
    body('isPublic').optional().isBoolean(),
    body('tags').optional().isArray(),
    validate,
  ],
  updateTemplate
);

// Delete template
router.delete('/:id', authenticate, deleteTemplate);

// Use template (increment usage count)
router.post('/:id/use', optionalAuth, useTemplate);

export default router;
