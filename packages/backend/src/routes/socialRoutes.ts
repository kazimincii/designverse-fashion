import { Router } from 'express';
import { body } from 'express-validator';
import {
  toggleLike,
  createComment,
  getComments,
  deleteComment,
  toggleFollow,
  getUserProfile,
  getNotifications,
  markNotificationAsRead,
} from '../controllers/socialController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Likes
router.post('/stories/:storyId/like', authenticate, toggleLike);

// Comments
router.post(
  '/stories/:storyId/comments',
  authenticate,
  [
    body('content').trim().isLength({ min: 1, max: 1000 }),
    validate,
  ],
  createComment
);
router.get('/stories/:storyId/comments', getComments);
router.delete('/comments/:id', authenticate, deleteComment);

// Follow
router.post('/users/:userId/follow', authenticate, toggleFollow);
router.get('/users/:handle/profile', optionalAuth, getUserProfile);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationAsRead);

export default router;
