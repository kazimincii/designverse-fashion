import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Likes
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const userId = req.user!.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      res.json({
        success: true,
        data: { liked: false },
      });
    } else {
      await prisma.like.create({
        data: { userId, storyId },
      });

      // Create notification
      const story = await prisma.story.findUnique({
        where: { id: storyId },
      });

      if (story && story.ownerId !== userId) {
        await prisma.notification.create({
          data: {
            userId: story.ownerId,
            type: 'LIKE_STORY',
            payloadJson: {
              storyId,
              likedBy: userId,
            },
          },
        });
      }

      res.json({
        success: true,
        data: { liked: true },
      });
    }
  } catch (error) {
    throw error;
  }
};

// Comments
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user!.userId;

    const comment = await prisma.comment.create({
      data: {
        storyId,
        authorId: userId,
        content,
        parentCommentId,
      },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create notification
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (story && story.ownerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: story.ownerId,
          type: 'COMMENT_STORY',
          payloadJson: {
            storyId,
            commentId: comment.id,
            commentedBy: userId,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    throw error;
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { storyId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        storyId,
        parentCommentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                handle: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    throw error;
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

// Follow
export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user!.userId;

    if (userId === targetUserId) {
      throw new AppError('Cannot follow yourself', 400);
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followedId: {
          followerId: userId,
          followedId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      res.json({
        success: true,
        data: { following: false },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId: userId,
          followedId: targetUserId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'NEW_FOLLOWER',
          payloadJson: {
            followerId: userId,
          },
        },
      });

      res.json({
        success: true,
        data: { following: true },
      });
    }
  } catch (error) {
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { handle } = req.params;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { handle },
      select: {
        id: true,
        displayName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            stories: { where: { status: 'PUBLISHED', privacy: 'PUBLIC' } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId: currentUserId,
            followedId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const stories = await prisma.story.findMany({
      where: {
        ownerId: user.id,
        status: 'PUBLISHED',
        privacy: 'PUBLIC',
      },
      include: {
        clips: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          isFollowing,
        },
        stories,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    throw error;
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Not authorized', 403);
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    throw error;
  }
};
