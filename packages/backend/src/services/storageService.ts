import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

// Initialize S3 client only if configured
const s3Client = isS3Configured()
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nim-videos';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/tmp/uploads';
const USE_S3 = isS3Configured();

// Ensure local storage directory exists
if (!USE_S3) {
  if (!existsSync(LOCAL_STORAGE_PATH)) {
    mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
  }
  console.log(`[Storage] Using local storage at ${LOCAL_STORAGE_PATH}`);
} else {
  console.log(`[Storage] Using S3 storage (bucket: ${BUCKET_NAME})`);
}

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  isPublic?: boolean;
}

export const storageService = {
  // Upload file (automatically uses S3 or local storage)
  async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    options: UploadOptions = {}
  ): Promise<string> {
    if (USE_S3 && s3Client) {
      return this.uploadToS3(fileBuffer, originalFilename, options);
    } else {
      return this.uploadToLocal(fileBuffer, originalFilename, options);
    }
  },

  // Upload to S3
  async uploadToS3(
    fileBuffer: Buffer,
    originalFilename: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { folder = 'uploads', contentType, isPublic = true } = options;

    const fileExtension = path.extname(originalFilename);
    const filename = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || this.getContentType(fileExtension),
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalname: originalFilename,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client!.send(command);

    if (CLOUDFRONT_URL) {
      return `${CLOUDFRONT_URL}/${key}`;
    }

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  },

  // Upload to local file system
  async uploadToLocal(
    fileBuffer: Buffer,
    originalFilename: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { folder = 'uploads' } = options;

    const fileExtension = path.extname(originalFilename);
    const filename = `${uuidv4()}${fileExtension}`;
    const folderPath = path.join(LOCAL_STORAGE_PATH, folder);
    const filePath = path.join(folderPath, filename);

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    await fs.writeFile(filePath, fileBuffer);

    return `/uploads/${folder}/${filename}`;
  },

  // Upload video
  async uploadVideo(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    return this.uploadFile(fileBuffer, originalFilename, {
      folder: 'videos',
      contentType: 'video/mp4',
      isPublic: true,
    });
  },

  // Upload image
  async uploadImage(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    return this.uploadFile(fileBuffer, originalFilename, {
      folder: 'images',
      isPublic: true,
    });
  },

  // Upload audio
  async uploadAudio(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    return this.uploadFile(fileBuffer, originalFilename, {
      folder: 'audio',
      contentType: 'audio/mpeg',
      isPublic: true,
    });
  },

  // Upload thumbnail
  async uploadThumbnail(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    return this.uploadFile(fileBuffer, originalFilename, {
      folder: 'thumbnails',
      contentType: 'image/jpeg',
      isPublic: true,
    });
  },

  // Generate presigned URL for upload (S3 only)
  async getUploadUrl(filename: string, contentType: string, folder: string = 'uploads'): Promise<{ uploadUrl: string; fileUrl: string; key: string } | null> {
    if (!USE_S3 || !s3Client) {
      console.warn('[Storage] Presigned URLs only available with S3');
      return null;
    }

    const fileExtension = path.extname(filename);
    const key = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const fileUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  },

  // Delete file
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (USE_S3 && s3Client) {
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1);

        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });

        await s3Client.send(command);
      } else {
        // Delete from local storage
        const localPath = fileUrl.replace('/uploads/', '');
        const filePath = path.join(LOCAL_STORAGE_PATH, localPath);
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('[Storage] Error deleting file:', error);
      throw error;
    }
  },

  // Generate presigned URL for download (S3 only)
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!USE_S3 || !s3Client) {
      console.warn('[Storage] Download URLs only available with S3');
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  // Get content type based on file extension
  getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  },

  // Check if storage is using S3
  isUsingS3(): boolean {
    return USE_S3;
  },

  // Get storage info
  getStorageInfo(): { type: 'S3' | 'Local'; path?: string; bucket?: string } {
    if (USE_S3) {
      return { type: 'S3', bucket: BUCKET_NAME };
    }
    return { type: 'Local', path: LOCAL_STORAGE_PATH };
  },
};
