import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, handle } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { handle }],
      },
    });

    if (existingUser) {
      throw new AppError('User with this email or handle already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        handle,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      handle: user.handle,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          handle: user.handle,
          avatarUrl: user.avatarUrl,
          planType: user.planType,
          creditsBalance: user.creditsBalance,
        },
        token,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      handle: user.handle,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          handle: user.handle,
          avatarUrl: user.avatarUrl,
          planType: user.planType,
          creditsBalance: user.creditsBalance,
        },
        token,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        planType: true,
        creditsBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { displayName, bio, avatarUrl } = req.body;

    // Check if handle is being updated and if it's available
    if (req.body.handle) {
      const existingUser = await prisma.user.findFirst({
        where: {
          handle: req.body.handle,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new AppError('Handle already taken', 400);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl && { avatarUrl }),
        ...(req.body.handle && { handle: req.body.handle }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        planType: true,
        creditsBalance: true,
      },
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Change password
 */
export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    throw error;
  }
};
