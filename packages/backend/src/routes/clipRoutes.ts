import { Router } from 'express';
import { body } from 'express-validator';
import {
  createClip,
  updateClip,
  deleteClip,
  reorderClips,
} from '../controllers/clipController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('storyId').notEmpty(),
    body('videoUrl').isURL(),
    body('durationSeconds').isFloat({ min: 0 }),
    validate,
  ],
  createClip
);

router.patch('/:id', authenticate, updateClip);
router.delete('/:id', authenticate, deleteClip);
router.post('/reorder/:storyId', authenticate, reorderClips);

export default router;
