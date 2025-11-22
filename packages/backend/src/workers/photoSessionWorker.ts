import { photoGenerationQueue } from '../services/jobQueue';
import { prisma } from '../config/database';
import { AIConsistencyEngine } from '../services/aiConsistencyEngine';
import { QualityAssuranceService } from '../services/qualityAssuranceService';
import { referenceService } from '../services/referenceService';
import { storageService } from '../services/storageService';
import { ConsistencyPromptBuilder } from '../services/consistencyPromptBuilder';
import axios from 'axios';

/**
 * Photo Session Worker
 *
 * Processes photo session jobs including:
 * - Virtual try-on with consistency
 * - Variations generation
 * - Upscaling
 * - Animation
 */

// Process photo session jobs using dedicated photo queue
photoGenerationQueue.process(async (job) => {
  const { jobId, userId, jobType, inputPayload } = job.data;

  // This worker handles photo-related jobs
  const photoJobTypes = ['PHOTO_TRYON', 'PHOTO_VARIATION', 'PHOTO_UPSCALE', 'PHOTO_ANIMATION'];
  if (!photoJobTypes.includes(jobType)) {
    console.log(`Ignoring non-photo job type: ${jobType}`);
    return;
  }

  try {
    console.log(`Processing ${jobType} job ${jobId} for user ${userId}`);

    // Update job status to RUNNING
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    let result;

    switch (jobType) {
      case 'PHOTO_TRYON':
        result = await processVirtualTryOn(jobId, inputPayload);
        break;
      case 'PHOTO_VARIATION':
        result = await processVariations(jobId, inputPayload);
        break;
      case 'PHOTO_UPSCALE':
        result = await processUpscale(jobId, inputPayload);
        break;
      case 'PHOTO_ANIMATION':
        result = await processAnimation(jobId, inputPayload);
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    // Update job with success
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SUCCEEDED',
        outputPayloadJson: result,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'PHOTO_SESSION_READY',
        payloadJson: {
          jobId,
          jobType,
          imageUrl: (result as any).imageUrl,
          success: true,
        },
      },
    });

    console.log(`Job ${jobId} completed successfully`);
    return { success: true, jobId, ...result };
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job with failure
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
});

/**
 * Process virtual try-on with AI consistency
 */
async function processVirtualTryOn(jobId: string, inputPayload: any) {
  const {
    sessionId,
    productUrl,
    modelUrl,
    enhancedPrompt,
    negativePrompt,
    characterRefId,
    garmentRefId,
    styleRefId,
  } = inputPayload;

  // Load references if provided
  let characterRef = null;
  let garmentRef = null;
  let styleRef = null;

  if (characterRefId) {
    characterRef = await referenceService.getCharacterReference(characterRefId);
  }
  if (garmentRefId) {
    garmentRef = await referenceService.getGarmentReference(garmentRefId);
  }
  if (styleRefId) {
    styleRef = await referenceService.getStyleReference(styleRefId);
  }

  console.log('Generating with consistency:', {
    hasCharacter: !!characterRef,
    hasGarment: !!garmentRef,
    hasStyle: !!styleRef,
  });

  // Generate with AI consistency engine
  const generationResult = await AIConsistencyEngine.generateWithConsistency({
    prompt: enhancedPrompt,
    negativePrompt,
    characterRef,
    garmentRef,
    styleRef,
    numInferenceSteps: 30,
    guidanceScale: 7.5,
  });

  console.log('Generation completed:', {
    model: generationResult.metadata.model,
    processingTime: generationResult.metadata.processingTimeMs,
    cost: generationResult.metadata.costUsd,
  });

  // Download generated image
  const imageResponse = await axios.get(generationResult.imageUrl, {
    responseType: 'arraybuffer',
  });
  const imageBuffer = Buffer.from(imageResponse.data);

  // Upload to storage
  const filename = `generated_${Date.now()}.png`;
  const storageUrl = await storageService.uploadFile(
    imageBuffer,
    `sessions/${sessionId}/${filename}`
  );

  // Calculate consistency score
  let consistencyScore = null;
  if (characterRef || garmentRef || styleRef) {
    console.log('Calculating consistency score...');
    consistencyScore = await AIConsistencyEngine.calculateConsistencyScore(
      storageUrl,
      { characterRef, garmentRef, styleRef }
    );

    console.log('Consistency score:', consistencyScore);

    // Perform quality check
    const qualityCheck = QualityAssuranceService.performQualityCheck(consistencyScore, {
      hasCharacterRef: !!characterRef,
      hasGarmentRef: !!garmentRef,
      hasStyleRef: !!styleRef,
    });

    console.log('Quality check:', {
      passed: qualityCheck.passed,
      shouldRegenerate: qualityCheck.shouldRegenerate,
      issues: qualityCheck.issues.length,
      recommendations: qualityCheck.recommendations,
    });

    // Check if regeneration is needed based on quality check
    if (qualityCheck.shouldRegenerate) {
      console.log(`Regenerating: ${qualityCheck.regenerationReason}`);

      // Regenerate with adjusted parameters
      const regenResult = await AIConsistencyEngine.generateWithConsistency({
        prompt: enhancedPrompt,
        negativePrompt,
        characterRef,
        garmentRef,
        styleRef,
        numInferenceSteps: 40, // More steps for better quality
        guidanceScale: 8.5, // Higher guidance for more adherence
      });

      // Download and upload regenerated image
      const regenImageResponse = await axios.get(regenResult.imageUrl, {
        responseType: 'arraybuffer',
      });
      const regenImageBuffer = Buffer.from(regenImageResponse.data);
      const regenFilename = `generated_${Date.now()}_regen.png`;
      const regenStorageUrl = await storageService.uploadFile(
        regenImageBuffer,
        `sessions/${sessionId}/${regenFilename}`
      );

      // Recalculate score
      const regenScore = await AIConsistencyEngine.calculateConsistencyScore(
        regenStorageUrl,
        { characterRef, garmentRef, styleRef }
      );

      console.log('Regeneration score:', regenScore);

      // Use regenerated if better
      if (regenScore.overall > consistencyScore.overall) {
        console.log('Using regenerated image (better score)');
        consistencyScore = regenScore;

        // Save generation history for regeneration
        await referenceService.createGenerationHistory({
          sessionId,
          generatedAssetId: jobId,
          jobId,
          characterRefId,
          garmentRefId,
          styleRefId,
          stepNumber: 2,
          basePrompt: inputPayload.basePrompt || enhancedPrompt,
          enhancedPrompt,
          negativePrompt,
          modelProvider: regenResult.metadata.provider,
          modelName: regenResult.metadata.model,
          consistencyScore: regenScore.overall,
          faceSimScore: regenScore.faceScore,
          garmentAccScore: regenScore.garmentScore,
          styleMatchScore: regenScore.styleScore,
          wasRegenerated: true,
          apiCostUsd: regenResult.metadata.costUsd,
        });

        // Create photo asset with regenerated image
        const photoAsset = await prisma.photoAsset.create({
          data: {
            sessionId,
            type: 'IMAGE',
            subType: 'GENERATED',
            sourceType: 'GENERATED',
            url: regenStorageUrl,
            metadataJson: {
              model: regenResult.metadata.model,
              provider: regenResult.metadata.provider,
              processingTimeMs: regenResult.metadata.processingTimeMs,
              costUsd: regenResult.metadata.costUsd,
              consistencyScore: regenScore.overall,
              wasRegenerated: true,
            },
          },
        });

        return {
          imageUrl: regenStorageUrl,
          photoAssetId: photoAsset.id,
          consistencyScore: {
            overall: regenScore.overall,
            faceScore: regenScore.faceScore,
            garmentScore: regenScore.garmentScore,
            styleScore: regenScore.styleScore,
          },
          wasRegenerated: true,
          model: regenResult.metadata.model,
          cost: regenResult.metadata.costUsd,
        };
      } else {
        console.log('Keeping original image (better score)');
      }
    }
  }

  // Save generation history
  if (characterRef || garmentRef || styleRef) {
    await referenceService.createGenerationHistory({
      sessionId,
      generatedAssetId: jobId,
      jobId,
      characterRefId,
      garmentRefId,
      styleRefId,
      stepNumber: 2,
      basePrompt: inputPayload.basePrompt || enhancedPrompt,
      enhancedPrompt,
      negativePrompt,
      modelProvider: generationResult.metadata.provider,
      modelName: generationResult.metadata.model,
      consistencyScore: consistencyScore?.overall,
      faceSimScore: consistencyScore?.faceScore,
      garmentAccScore: consistencyScore?.garmentScore,
      styleMatchScore: consistencyScore?.styleScore,
      wasRegenerated: false,
      apiCostUsd: generationResult.metadata.costUsd,
    });
  }

  // Increment reference usage counts
  if (characterRef && characterRefId) {
    await referenceService.incrementCharacterUsage(characterRefId);
  }
  if (garmentRef && garmentRefId) {
    await referenceService.incrementGarmentUsage(garmentRefId);
  }
  if (styleRef && styleRefId) {
    await referenceService.incrementStyleUsage(styleRefId);
  }

  // Create photo asset
  const photoAsset = await prisma.photoAsset.create({
    data: {
      sessionId,
      type: 'IMAGE',
      subType: 'GENERATED',
      sourceType: 'GENERATED',
      url: storageUrl,
      metadataJson: {
        model: generationResult.metadata.model,
        provider: generationResult.metadata.provider,
        processingTimeMs: generationResult.metadata.processingTimeMs,
        costUsd: generationResult.metadata.costUsd,
        consistencyScore: consistencyScore?.overall,
      },
    },
  });

  return {
    imageUrl: storageUrl,
    photoAssetId: photoAsset.id,
    consistencyScore: consistencyScore ? {
      overall: consistencyScore.overall,
      faceScore: consistencyScore.faceScore,
      garmentScore: consistencyScore.garmentScore,
      styleScore: consistencyScore.styleScore,
    } : null,
    wasRegenerated: false,
    model: generationResult.metadata.model,
    cost: generationResult.metadata.costUsd,
  };
}

/**
 * Process variations generation
 */
async function processVariations(jobId: string, inputPayload: any) {
  const { sessionId, baseImageUrl, mood, framing, count, characterRefId, garmentRefId, styleRefId } = inputPayload;

  console.log('Processing variations:', { mood, framing, count });

  try {
    // Load references if provided
    let characterRef = null;
    let garmentRef = null;
    let styleRef = null;

    if (characterRefId) {
      characterRef = await referenceService.getCharacterReference(characterRefId);
    }
    if (garmentRefId) {
      garmentRef = await referenceService.getGarmentReference(garmentRefId);
    }
    if (styleRefId) {
      styleRef = await referenceService.getStyleReference(styleRefId);
    }

    const variations = [];
    
    // Generate specified number of variations
    for (let i = 0; i < (count || 4); i++) {
      // Build prompt based on mood and framing
      let promptModifiers = [];
      
      if (mood === 'minimalist') {
        promptModifiers.push('minimalist aesthetic', 'clean background', 'simple composition');
      } else if (mood === 'dynamic') {
        promptModifiers.push('dynamic pose', 'energetic', 'action shot');
      } else if (mood === 'dramatic') {
        promptModifiers.push('dramatic lighting', 'high contrast', 'cinematic');
      }
      
      if (framing === 'close-up') {
        promptModifiers.push('close-up shot', 'detailed view');
      } else if (framing === 'waist-up') {
        promptModifiers.push('waist-up portrait');
      } else if (framing === 'full-body') {
        promptModifiers.push('full body shot');
      }

      const basePrompt = `fashion model, professional photography, ${promptModifiers.join(', ')}`;
      const promptResult = ConsistencyPromptBuilder.buildPrompt({
        basePrompt,
        characterRef,
        garmentRef,
        styleRef,
      });

      // Generate variation with consistency
      const generationResult = await AIConsistencyEngine.generateWithConsistency({
        prompt: promptResult.enhancedPrompt,
        negativePrompt: promptResult.negativePrompt,
        characterRef,
        garmentRef,
        styleRef,
        numInferenceSteps: 30,
        guidanceScale: 7.5,
      });

      // Download and store the generated image
      const imageResponse = await axios.get(generationResult.imageUrl, {
        responseType: 'arraybuffer',
      });
      const imageBuffer = Buffer.from(imageResponse.data);
      const filename = `variation_${i + 1}_${Date.now()}.png`;
      const storageUrl = await storageService.uploadFile(
        imageBuffer,
        `sessions/${sessionId}/variations/${filename}`
      );

      // Create photo asset
      const photoAsset = await prisma.photoAsset.create({
        data: {
          sessionId,
          type: 'IMAGE',
          subType: 'GENERATED',
          sourceType: 'GENERATED',
          url: storageUrl,
          metadataJson: {
            variationIndex: i + 1,
            mood,
            framing,
            model: generationResult.metadata.model,
            provider: generationResult.metadata.provider,
          },
        },
      });

      variations.push({
        assetId: photoAsset.id,
        url: storageUrl,
        index: i + 1,
      });
    }

    return {
      variations,
      count: variations.length,
    };
  } catch (error: any) {
    console.error('Error generating variations:', error);
    // Return empty result on error
    return {
      variations: [],
      count: 0,
      error: error.message,
    };
  }
}

/**
 * Process image upscaling
 */
async function processUpscale(jobId: string, inputPayload: any) {
  const { sessionId, imageUrl, factor } = inputPayload;

  console.log('Processing upscale:', { factor });

  try {
    // Check if Replicate API key is available
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      console.warn('Replicate API key not configured, returning original image');
      return {
        upscaledUrl: imageUrl,
        factor: 1,
        message: 'Upscaling not available without Replicate API key',
      };
    }

    // Use Replicate's Real-ESRGAN for upscaling
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'nightmareai/real-esrgan:42fd23f4b5b7e3a7a80e3e2e9b1697c3b7d8e2c0d7f8e9a0b1c2d3e4f5a6b7c8',
        input: {
          image: imageUrl,
          scale: factor || 2,
          face_enhance: true,
        },
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const predictionId = response.data.id;

    // Poll for completion
    let upscaledUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (!upscaledUrl && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      if (statusResponse.data.status === 'succeeded') {
        upscaledUrl = statusResponse.data.output;
        break;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Upscaling failed: ' + statusResponse.data.error);
      }

      attempts++;
    }

    if (!upscaledUrl) {
      throw new Error('Upscaling timed out');
    }

    // Download and store the upscaled image
    const imageResponse = await axios.get(upscaledUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(imageResponse.data);
    const filename = `upscaled_${factor}x_${Date.now()}.png`;
    const storageUrl = await storageService.uploadFile(
      imageBuffer,
      `sessions/${sessionId}/upscaled/${filename}`
    );

    // Create photo asset
    await prisma.photoAsset.create({
      data: {
        sessionId,
        type: 'IMAGE',
        subType: 'GENERATED',
        sourceType: 'GENERATED',
        url: storageUrl,
        metadataJson: {
          upscaleFactor: factor,
          originalUrl: imageUrl,
          model: 'real-esrgan',
        },
      },
    });

    return {
      upscaledUrl: storageUrl,
      factor,
    };
  } catch (error: any) {
    console.error('Error upscaling image:', error);
    // Return original image on error
    return {
      upscaledUrl: imageUrl,
      factor: 1,
      error: error.message,
    };
  }
}

/**
 * Process animation
 */
async function processAnimation(jobId: string, inputPayload: any) {
  const { sessionId, assetIds, duration, style } = inputPayload;

  console.log('Processing animation:', { assetIds, duration, style });

  try {
    // Check if Replicate API key is available
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      console.warn('Replicate API key not configured, animation not available');
      return {
        animationUrl: '',
        duration,
        message: 'Animation not available without Replicate API key',
      };
    }

    // Get the assets
    const assets = await prisma.photoAsset.findMany({
      where: {
        id: { in: assetIds },
        sessionId,
      },
    });

    if (assets.length === 0) {
      throw new Error('No assets found for animation');
    }

    // For single image, use Stable Video Diffusion
    if (assets.length === 1) {
      const imageUrl = assets[0].url;

      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
          input: {
            input_image: imageUrl,
            fps: 30,
            motion_bucket_id: style === 'DYNAMIC' ? 200 : 127,
            cond_aug: 0.02,
            decoding_t: 14,
            video_length: duration || 7,
          },
        },
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const predictionId = response.data.id;

      // Poll for completion
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes max

      while (!videoUrl && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              Authorization: `Token ${REPLICATE_API_KEY}`,
            },
          }
        );

        if (statusResponse.data.status === 'succeeded') {
          videoUrl = statusResponse.data.output;
          break;
        } else if (statusResponse.data.status === 'failed') {
          throw new Error('Animation failed: ' + statusResponse.data.error);
        }

        attempts++;
      }

      if (!videoUrl) {
        throw new Error('Animation timed out');
      }

      // Download and store the video
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });
      const videoBuffer = Buffer.from(videoResponse.data);
      const filename = `animation_${Date.now()}.mp4`;
      const storageUrl = await storageService.uploadFile(
        videoBuffer,
        `sessions/${sessionId}/animations/${filename}`
      );

      // Create photo animation record
      await prisma.photoAnimation.create({
        data: {
          sessionId,
          videoUrl: storageUrl,
          durationSeconds: duration || 7,
          fps: 30,
          resolutionW: 1024,
          resolutionH: 576,
          style: style || 'SUBTLE_CINEMATIC',
          sourceAssetIds: assetIds,
        },
      });

      return {
        animationUrl: storageUrl,
        duration: duration || 7,
      };
    } else {
      // For multiple images, create a slideshow-style animation
      // This is a simplified implementation
      console.log('Multi-image animation not fully implemented yet');
      return {
        animationUrl: '',
        duration,
        message: 'Multi-image animation not yet supported',
      };
    }
  } catch (error: any) {
    console.error('Error creating animation:', error);
    return {
      animationUrl: '',
      duration,
      error: error.message,
    };
  }
}

console.log('Photo session worker started');
