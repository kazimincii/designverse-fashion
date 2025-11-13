import { prisma } from '../config/database';
import { storageService } from './storageService';
import { addVideoGenerationJob } from './jobQueue';
import { ConsistencyPromptBuilder } from './consistencyPromptBuilder';
import { AIConsistencyEngine } from './aiConsistencyEngine';
import { referenceService } from './referenceService';

export interface CreatePhotoSessionData {
  title: string;
  ownerId: string;
}

export interface UploadPhotoData {
  sessionId: string;
  subType: 'PRODUCT' | 'MODEL';
  fileBuffer: Buffer;
  filename: string;
}

export const photoSessionService = {
  // Create new photo session
  async createSession(data: CreatePhotoSessionData) {
    return await prisma.photoSession.create({
      data: {
        title: data.title,
        ownerId: data.ownerId,
        status: 'DRAFT',
      },
      include: {
        photoAssets: true,
        photoAnimations: true,
      },
    });
  },

  // Get user's photo sessions
  async getUserSessions(userId: string) {
    return await prisma.photoSession.findMany({
      where: { ownerId: userId },
      include: {
        photoAssets: {
          orderBy: { createdAt: 'desc' },
        },
        photoAnimations: true,
        _count: {
          select: {
            photoAssets: true,
            photoAnimations: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  // Get session by ID
  async getSession(sessionId: string) {
    return await prisma.photoSession.findUnique({
      where: { id: sessionId },
      include: {
        photoAssets: {
          orderBy: { createdAt: 'asc' },
        },
        photoAnimations: true,
        owner: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            creditsBalance: true,
          },
        },
      },
    });
  },

  // Upload product or model photo
  async uploadPhoto(data: UploadPhotoData) {
    const folder = data.subType === 'PRODUCT' ? 'photos/products' : 'photos/models';
    const url = await storageService.uploadImage(data.fileBuffer, data.filename);

    const photoAsset = await prisma.photoAsset.create({
      data: {
        sessionId: data.sessionId,
        type: 'IMAGE',
        subType: data.subType,
        sourceType: 'UPLOADED',
        url,
      },
    });

    // Update session status
    await prisma.photoSession.update({
      where: { id: data.sessionId },
      data: { status: 'STEP_1_UPLOAD' },
    });

    return photoAsset;
  },

  // Virtual try-on: Apply product to model (with optional references)
  async applyVirtualTryOn(
    sessionId: string,
    productAssetId: string,
    modelAssetId: string,
    options?: {
      characterRefId?: string;
      garmentRefId?: string;
      styleRefId?: string;
      additionalParams?: {
        style?: string;
        lighting?: string;
        mood?: string;
      };
    }
  ) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const productAsset = session.photoAssets.find((a: any) => a.id === productAssetId);
    const modelAsset = session.photoAssets.find((a: any) => a.id === modelAssetId);

    if (!productAsset || !modelAsset) {
      throw new Error('Product or model asset not found');
    }

    // Load references if provided
    let characterRef = null;
    let garmentRef = null;
    let styleRef = null;

    if (options?.characterRefId) {
      characterRef = await referenceService.getCharacterReference(options.characterRefId);
    }
    if (options?.garmentRefId) {
      garmentRef = await referenceService.getGarmentReference(options.garmentRefId);
    }
    if (options?.styleRefId) {
      styleRef = await referenceService.getStyleReference(options.styleRefId);
    }

    // Build consistency-aware prompt
    const basePrompt = 'fashion model wearing product, professional photography, studio lighting';
    const promptResult = ConsistencyPromptBuilder.buildPrompt({
      basePrompt,
      characterRef,
      garmentRef,
      styleRef,
      additionalParams: options?.additionalParams,
    });

    // Create job with enhanced prompt and references
    const job = await prisma.job.create({
      data: {
        ownerId: session.ownerId,
        jobType: 'PHOTO_TRYON',
        status: 'QUEUED',
        inputPayloadJson: {
          sessionId,
          productUrl: productAsset.url,
          modelUrl: modelAsset.url,
          enhancedPrompt: promptResult.enhancedPrompt,
          negativePrompt: promptResult.negativePrompt,
          characterRefId: options?.characterRefId,
          garmentRefId: options?.garmentRefId,
          styleRefId: options?.styleRefId,
          consistencyTags: promptResult.consistencyTags,
        },
        modelProvider: 'replicate',
      },
    });

    // Add to queue
    await addVideoGenerationJob({
      jobId: job.id,
      userId: session.ownerId,
      jobType: 'PHOTO_TRYON',
      inputPayload: {
        sessionId,
        productUrl: productAsset.url,
        modelUrl: modelAsset.url,
        enhancedPrompt: promptResult.enhancedPrompt,
        negativePrompt: promptResult.negativePrompt,
        characterRefId: options?.characterRefId,
        garmentRefId: options?.garmentRefId,
        styleRefId: options?.styleRefId,
      },
    });

    // Create generation history entry
    if (characterRef || garmentRef || styleRef) {
      await referenceService.createGenerationHistory({
        sessionId,
        generatedAssetId: job.id, // Will be updated when job completes
        jobId: job.id,
        characterRefId: options?.characterRefId,
        garmentRefId: options?.garmentRefId,
        styleRefId: options?.styleRefId,
        stepNumber: 2, // Enhance step
        basePrompt,
        enhancedPrompt: promptResult.enhancedPrompt,
        negativePrompt: promptResult.negativePrompt,
        modelProvider: 'replicate',
        modelName: 'virtual-tryon',
      });
    }

    // Update session status
    await prisma.photoSession.update({
      where: { id: sessionId },
      data: { status: 'STEP_2_ENHANCE' },
    });

    return job;
  },

  // Generate pose variations
  async generateVariations(sessionId: string, baseAssetId: string, options: {
    mood?: string;
    framing?: string;
    count?: number;
  }) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const baseAsset = session.photoAssets.find((a: any) => a.id === baseAssetId);
    if (!baseAsset) throw new Error('Base asset not found');

    const job = await prisma.job.create({
      data: {
        ownerId: session.ownerId,
        jobType: 'PHOTO_VARIATION',
        status: 'QUEUED',
        inputPayloadJson: {
          sessionId,
          baseImageUrl: baseAsset.url,
          mood: options.mood || 'minimalist',
          framing: options.framing || 'full-body',
          count: options.count || 4,
        },
        modelProvider: 'replicate',
      },
    });

    await addVideoGenerationJob({
      jobId: job.id,
      userId: session.ownerId,
      jobType: 'PHOTO_VARIATION',
      inputPayload: {
        sessionId,
        baseImageUrl: baseAsset.url,
        ...options,
      },
    });

    await prisma.photoSession.update({
      where: { id: sessionId },
      data: { status: 'STEP_3_VARIATIONS' },
    });

    return job;
  },

  // Upscale image
  async upscaleImage(sessionId: string, assetId: string, factor: number = 2) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const asset = session.photoAssets.find((a: any) => a.id === assetId);
    if (!asset) throw new Error('Asset not found');

    const job = await prisma.job.create({
      data: {
        ownerId: session.ownerId,
        jobType: 'PHOTO_UPSCALE',
        status: 'QUEUED',
        inputPayloadJson: {
          sessionId,
          imageUrl: asset.url,
          factor,
        },
        modelProvider: 'replicate',
      },
    });

    await addVideoGenerationJob({
      jobId: job.id,
      userId: session.ownerId,
      jobType: 'PHOTO_UPSCALE',
      inputPayload: {
        sessionId,
        imageUrl: asset.url,
        factor,
      },
    });

    await prisma.photoSession.update({
      where: { id: sessionId },
      data: { status: 'STEP_4_UPSCALE' },
    });

    return job;
  },

  // Create animation from photos
  async createAnimation(sessionId: string, assetIds: string[], options: {
    duration?: number;
    style?: 'SUBTLE_CINEMATIC' | 'LOOKBOOK' | 'DYNAMIC';
  }) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const job = await prisma.job.create({
      data: {
        ownerId: session.ownerId,
        jobType: 'PHOTO_ANIMATION',
        status: 'QUEUED',
        inputPayloadJson: {
          sessionId,
          assetIds,
          duration: options.duration || 7,
          style: options.style || 'SUBTLE_CINEMATIC',
        },
        modelProvider: 'replicate',
      },
    });

    await addVideoGenerationJob({
      jobId: job.id,
      userId: session.ownerId,
      jobType: 'PHOTO_ANIMATION',
      inputPayload: {
        sessionId,
        assetIds,
        ...options,
      },
    });

    await prisma.photoSession.update({
      where: { id: sessionId },
      data: { status: 'STEP_5_ANIMATION' },
    });

    return job;
  },

  // Mark session as completed
  async completeSession(sessionId: string) {
    return await prisma.photoSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });
  },

  // Delete session
  async deleteSession(sessionId: string) {
    // Delete all assets from storage
    const session = await this.getSession(sessionId);
    if (session) {
      for (const asset of session.photoAssets) {
        try {
          await storageService.deleteFile(asset.url);
        } catch (error) {
          console.error('Failed to delete asset:', error);
        }
      }

      for (const animation of session.photoAnimations) {
        try {
          await storageService.deleteFile(animation.videoUrl);
        } catch (error) {
          console.error('Failed to delete animation:', error);
        }
      }
    }

    return await prisma.photoSession.delete({
      where: { id: sessionId },
    });
  },
};
