import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { storageService } from '../services/storageService';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept videos, images, and audio
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video, image, and audio files are allowed.'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

// Upload file
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) {
      throw new AppError('No file provided', 400);
    }

    let fileUrl: string;

    // Upload based on file type
    if (file.mimetype.startsWith('video/')) {
      fileUrl = await storageService.uploadVideo(file.buffer, file.originalname);
    } else if (file.mimetype.startsWith('image/')) {
      fileUrl = await storageService.uploadImage(file.buffer, file.originalname);
    } else if (file.mimetype.startsWith('audio/')) {
      fileUrl = await storageService.uploadAudio(file.buffer, file.originalname);
    } else {
      throw new AppError('Unsupported file type', 400);
    }

    // Create asset record
    const assetType = file.mimetype.startsWith('video/')
      ? 'VIDEO'
      : file.mimetype.startsWith('image/')
      ? 'IMAGE'
      : 'AUDIO';

    const asset = await prisma.asset.create({
      data: {
        ownerId: userId,
        type: assetType,
        url: fileUrl,
        name: file.originalname,
        tags: [],
        metadataJson: {
          size: file.size,
          mimetype: file.mimetype,
        },
      },
    });

    res.json({
      success: true,
      data: {
        asset,
        url: fileUrl,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Get presigned upload URL
export const getUploadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { filename, contentType, folder } = req.body;

    if (!filename || !contentType) {
      throw new AppError('Filename and content type are required', 400);
    }

    const { uploadUrl, fileUrl, key } = await storageService.getUploadUrl(
      filename,
      contentType,
      folder
    );

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        key,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Delete asset
export const deleteAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    if (asset.ownerId !== userId) {
      throw new AppError('Not authorized to delete this asset', 403);
    }

    // Delete from S3
    await storageService.deleteFile(asset.url);

    // Delete from database
    await prisma.asset.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

// Get user assets
export const getUserAssets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type } = req.query;

    const where: any = { ownerId: userId };
    if (type) {
      where.type = type;
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: { assets },
    });
  } catch (error) {
    throw error;
  }
};
