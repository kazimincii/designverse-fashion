import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('displayName').trim().isLength({ min: 1, max: 100 }),
    body('handle').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  login
);

router.get('/me', authenticate, getMe);

// Profile management
router.patch(
  '/profile',
  authenticate,
  [
    body('displayName').optional().trim().isLength({ min: 1, max: 100 }),
    body('handle').optional().trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('avatarUrl').optional().isURL(),
    validate,
  ],
  updateProfile
);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    validate,
  ],
  changePassword
);

export default router;
