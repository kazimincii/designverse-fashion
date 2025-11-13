import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nim-videos';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL; // Optional CDN

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  isPublic?: boolean;
}

export const storageService = {
  // Upload file to S3
  async uploadFile(
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

    await s3Client.send(command);

    // Return CloudFront URL if available, otherwise S3 URL
    if (CLOUDFRONT_URL) {
      return `${CLOUDFRONT_URL}/${key}`;
    }

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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

  // Generate presigned URL for upload (client-side uploads)
  async getUploadUrl(filename: string, contentType: string, folder: string = 'uploads'): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const fileExtension = path.extname(filename);
    const key = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    const fileUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  },

  // Delete file from S3
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  },

  // Generate presigned URL for download (private files)
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
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
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  },

  // Download file from URL (for processing AI-generated videos)
  async downloadFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },

  // Upload from URL (download and upload to S3)
  async uploadFromUrl(url: string, originalFilename: string, options: UploadOptions = {}): Promise<string> {
    const buffer = await this.downloadFromUrl(url);
    return this.uploadFile(buffer, originalFilename, options);
  },
};
