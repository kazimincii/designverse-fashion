import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { storageService } from './storageService';

const execPromise = promisify(exec);

export interface VideoProcessingOptions {
  generateThumbnail?: boolean;
  compress?: boolean;
  targetResolution?: string; // e.g., '1280x720'
  targetBitrate?: string; // e.g., '2M'
}

export const videoProcessingService = {
  // Extract thumbnail from video
  async extractThumbnail(videoPath: string, timeStamp: string = '00:00:01'): Promise<Buffer> {
    const outputPath = `/tmp/thumbnail-${Date.now()}.jpg`;

    try {
      // Use FFmpeg to extract frame
      await execPromise(
        `ffmpeg -i "${videoPath}" -ss ${timeStamp} -vframes 1 -vf scale=1280:-1 "${outputPath}"`
      );

      const buffer = await fs.readFile(outputPath);
      await fs.unlink(outputPath); // Cleanup

      return buffer;
    } catch (error) {
      console.error('Error extracting thumbnail:', error);
      throw new Error('Failed to extract thumbnail');
    }
  },

  // Get video metadata
  async getVideoMetadata(videoPath: string): Promise<any> {
    try {
      const { stdout } = await execPromise(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
      );

      return JSON.parse(stdout);
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw new Error('Failed to get video metadata');
    }
  },

  // Compress/optimize video
  async compressVideo(
    inputPath: string,
    outputPath: string,
    options: { bitrate?: string; resolution?: string } = {}
  ): Promise<void> {
    const { bitrate = '2M', resolution } = options;

    try {
      let command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset medium -b:v ${bitrate} -c:a aac -b:a 128k`;

      if (resolution) {
        command += ` -vf scale=${resolution}`;
      }

      command += ` "${outputPath}"`;

      await execPromise(command);
    } catch (error) {
      console.error('Error compressing video:', error);
      throw new Error('Failed to compress video');
    }
  },

  // Merge multiple videos
  async mergeVideos(videoPaths: string[], outputPath: string): Promise<void> {
    try {
      // Create concat file
      const concatFilePath = `/tmp/concat-${Date.now()}.txt`;
      const concatContent = videoPaths.map((p) => `file '${p}'`).join('\n');
      await fs.writeFile(concatFilePath, concatContent);

      // Merge videos
      await execPromise(
        `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`
      );

      await fs.unlink(concatFilePath); // Cleanup
    } catch (error) {
      console.error('Error merging videos:', error);
      throw new Error('Failed to merge videos');
    }
  },

  // Add audio to video
  async addAudioToVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    options: { videoVolume?: number; audioVolume?: number } = {}
  ): Promise<void> {
    const { videoVolume = 1.0, audioVolume = 1.0 } = options;

    try {
      await execPromise(
        `ffmpeg -i "${videoPath}" -i "${audioPath}" ` +
          `-filter_complex "[0:a]volume=${videoVolume}[a1];[1:a]volume=${audioVolume}[a2];[a1][a2]amix=inputs=2:duration=first" ` +
          `-c:v copy "${outputPath}"`
      );
    } catch (error) {
      console.error('Error adding audio to video:', error);
      throw new Error('Failed to add audio to video');
    }
  },

  // Add text overlay to video
  async addTextOverlay(
    videoPath: string,
    outputPath: string,
    text: string,
    options: {
      position?: string; // e.g., 'top', 'center', 'bottom'
      fontSize?: number;
      fontColor?: string;
      startTime?: number;
      endTime?: number;
    } = {}
  ): Promise<void> {
    const {
      position = 'bottom',
      fontSize = 48,
      fontColor = 'white',
      startTime,
      endTime,
    } = options;

    // Position mapping
    const positions: Record<string, string> = {
      top: '(w-text_w)/2:50',
      center: '(w-text_w)/2:(h-text_h)/2',
      bottom: '(w-text_w)/2:h-100',
    };

    const xy = positions[position] || positions.center;

    try {
      let filterComplex = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${xy}`;

      if (startTime !== undefined && endTime !== undefined) {
        filterComplex += `:enable='between(t,${startTime},${endTime})'`;
      }

      await execPromise(
        `ffmpeg -i "${videoPath}" -vf "${filterComplex}" -c:a copy "${outputPath}"`
      );
    } catch (error) {
      console.error('Error adding text overlay:', error);
      throw new Error('Failed to add text overlay');
    }
  },

  // Process uploaded video (extract thumbnail, get metadata, optionally compress)
  async processUploadedVideo(
    videoUrl: string,
    options: VideoProcessingOptions = {}
  ): Promise<{
    thumbnailUrl?: string;
    metadata: any;
    processedVideoUrl?: string;
  }> {
    const tempVideoPath = `/tmp/video-${Date.now()}.mp4`;

    try {
      // Download video from URL
      const videoBuffer = await storageService.downloadFromUrl(videoUrl);
      await fs.writeFile(tempVideoPath, videoBuffer);

      // Get metadata
      const metadata = await this.getVideoMetadata(tempVideoPath);

      let thumbnailUrl: string | undefined;
      let processedVideoUrl: string | undefined;

      // Generate thumbnail
      if (options.generateThumbnail !== false) {
        const thumbnailBuffer = await this.extractThumbnail(tempVideoPath);
        thumbnailUrl = await storageService.uploadThumbnail(
          thumbnailBuffer,
          'thumbnail.jpg'
        );
      }

      // Compress video if requested
      if (options.compress) {
        const compressedPath = `/tmp/compressed-${Date.now()}.mp4`;
        await this.compressVideo(tempVideoPath, compressedPath, {
          bitrate: options.targetBitrate,
          resolution: options.targetResolution,
        });

        const compressedBuffer = await fs.readFile(compressedPath);
        processedVideoUrl = await storageService.uploadVideo(
          compressedBuffer,
          'compressed.mp4'
        );

        await fs.unlink(compressedPath);
      }

      // Cleanup
      await fs.unlink(tempVideoPath);

      return {
        thumbnailUrl,
        metadata,
        processedVideoUrl,
      };
    } catch (error) {
      // Cleanup on error
      try {
        await fs.unlink(tempVideoPath);
      } catch {}
      throw error;
    }
  },
};
