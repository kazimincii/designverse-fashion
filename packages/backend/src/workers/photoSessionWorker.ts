import { videoGenerationQueue } from '../services/jobQueue';
import { prisma } from '../config/database';
import { AIConsistencyEngine } from '../services/aiConsistencyEngine';
import { QualityAssuranceService } from '../services/qualityAssuranceService';
import { referenceService } from '../services/referenceService';
import { storageService } from '../services/storageService';
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

// Process photo session jobs
videoGenerationQueue.process(async (job) => {
  const { jobId, userId, jobType, inputPayload } = job.data;

  // Only process photo-related jobs in this worker
  const photoJobTypes = ['PHOTO_TRYON', 'PHOTO_VARIATION', 'PHOTO_UPSCALE', 'PHOTO_ANIMATION'];
  if (!photoJobTypes.includes(jobType)) {
    // Let other workers handle non-photo jobs
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
  const { sessionId, baseImageUrl, mood, framing, count } = inputPayload;

  // TODO: Implement variations with consistency
  // For now, return placeholder
  console.log('Processing variations:', { mood, framing, count });

  return {
    variations: [],
    count: 0,
  };
}

/**
 * Process image upscaling
 */
async function processUpscale(jobId: string, inputPayload: any) {
  const { sessionId, imageUrl, factor } = inputPayload;

  // TODO: Implement upscaling
  // For now, return placeholder
  console.log('Processing upscale:', { factor });

  return {
    upscaledUrl: imageUrl,
    factor,
  };
}

/**
 * Process animation
 */
async function processAnimation(jobId: string, inputPayload: any) {
  const { sessionId, assetIds, duration, style } = inputPayload;

  // TODO: Implement animation
  // For now, return placeholder
  console.log('Processing animation:', { assetIds, duration, style });

  return {
    animationUrl: '',
    duration,
  };
}

console.log('Photo session worker started');
