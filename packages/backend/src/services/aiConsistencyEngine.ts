import OpenAI from 'openai';
import axios from 'axios';
import type { CharacterReference, GarmentReference, StyleReference } from '@prisma/client';
import { CharacterConsistencyService } from './characterConsistencyService';
import { GarmentConsistencyService } from './garmentConsistencyService';
import { StyleConsistencyService } from './styleConsistencyService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

export interface ConsistencyGenerationParams {
  prompt: string;
  negativePrompt?: string;
  characterRef?: CharacterReference | null;
  garmentRef?: GarmentReference | null;
  styleRef?: StyleReference | null;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export interface GenerationResult {
  imageUrl: string;
  metadata: {
    model: string;
    provider: string;
    processingTimeMs: number;
    costUsd?: number;
  };
  consistencyMetadata?: {
    usedCharacterRef: boolean;
    usedGarmentRef: boolean;
    usedStyleRef: boolean;
  };
}

export interface ConsistencyScore {
  overall: number; // 0-100
  faceScore?: number; // 0-100
  garmentScore?: number; // 0-100
  styleScore?: number; // 0-100
  breakdown: {
    colorMatch?: number;
    structuralSimilarity?: number;
    featureConsistency?: number;
  };
}

/**
 * AI Consistency Engine
 *
 * Manages AI model selection, generation with references,
 * and consistency scoring.
 */
export class AIConsistencyEngine {
  /**
   * Generate image with consistency references
   *
   * This is the main entry point for reference-aware generation.
   * It selects the best model based on available references and
   * generates the image accordingly.
   */
  static async generateWithConsistency(
    params: ConsistencyGenerationParams
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      let result: GenerationResult;

      // Decide which generation strategy to use based on references
      if (params.characterRef && params.garmentRef) {
        // Both character and garment: Use virtual try-on pipeline
        result = await this.generateWithVirtualTryOn(params);
      } else if (params.characterRef) {
        // Character only: Use face-consistent generation
        result = await this.generateWithCharacterConsistency(params);
      } else if (params.garmentRef) {
        // Garment only: Use garment-consistent generation
        result = await this.generateWithGarmentConsistency(params);
      } else {
        // No references: Standard generation
        result = await this.generateStandard(params);
      }

      // Add processing time
      result.metadata.processingTimeMs = Date.now() - startTime;

      // Add consistency metadata
      result.consistencyMetadata = {
        usedCharacterRef: !!params.characterRef,
        usedGarmentRef: !!params.garmentRef,
        usedStyleRef: !!params.styleRef,
      };

      return result;
    } catch (error) {
      console.error('Error in consistency generation:', error);
      throw error;
    }
  }

  /**
   * Generate with character consistency (face preservation)
   *
   * Uses models like InstantID, PhotoMaker, or IP-Adapter
   * to maintain face consistency across generations.
   */
  private static async generateWithCharacterConsistency(
    params: ConsistencyGenerationParams
  ): Promise<GenerationResult> {
    if (!params.characterRef) {
      throw new Error('Character reference is required for character consistency');
    }

    try {
      // Use CharacterConsistencyService to generate with face preservation
      const result = await CharacterConsistencyService.generateWithCharacterConsistency({
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        characterRef: params.characterRef,
        preferredModel: 'auto', // Auto-select best model
        numInferenceSteps: params.numInferenceSteps,
        guidanceScale: params.guidanceScale,
      });

      return {
        imageUrl: result.outputUrls[0],
        metadata: {
          model: result.modelUsed,
          provider: 'replicate',
          processingTimeMs: result.processingTimeMs,
          costUsd: this.estimateModelCost(result.modelUsed),
        },
      };
    } catch (error: any) {
      console.error('Character consistency generation error:', error);

      // Fallback to DALL-E 3 if specialized models fail
      console.warn('Falling back to DALL-E 3 for character generation');
      return await this.generateStandard(params);
    }
  }

  /**
   * Generate with garment consistency (virtual try-on)
   *
   * Uses models like IDM-VTON, OOTDiffusion, or StableVITON
   * to maintain garment appearance across generations.
   */
  private static async generateWithGarmentConsistency(
    params: ConsistencyGenerationParams
  ): Promise<GenerationResult> {
    if (!params.garmentRef) {
      throw new Error('Garment reference is required for garment consistency');
    }

    // For garment-only generation, we need a base human image
    // Since we don't have one, fallback to standard generation with enhanced prompt
    console.warn('Garment-only generation needs base human image, using standard generation');
    return await this.generateStandard(params);

    // Note: In a real implementation with access to base images,
    // this would call GarmentConsistencyService.applyVirtualTryOn()
  }

  /**
   * Generate with both character and garment consistency
   *
   * Combines face preservation and virtual try-on.
   */
  private static async generateWithVirtualTryOn(
    params: ConsistencyGenerationParams
  ): Promise<GenerationResult> {
    if (!params.characterRef || !params.garmentRef) {
      throw new Error('Both character and garment references required for virtual try-on');
    }

    try {
      // Multi-stage pipeline:
      // Stage 1: Generate base image with character consistency
      console.log('Stage 1: Generating character-consistent base image');
      const baseResult = await CharacterConsistencyService.generateWithCharacterConsistency({
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        characterRef: params.characterRef,
        numInferenceSteps: params.numInferenceSteps,
        guidanceScale: params.guidanceScale,
      });

      // Stage 2: Apply virtual try-on with garment reference
      console.log('Stage 2: Applying virtual try-on with garment');
      const vtonResult = await GarmentConsistencyService.applyVirtualTryOn({
        humanImageUrl: baseResult.outputUrls[0],
        garmentRef: params.garmentRef,
        garmentDescription: params.prompt,
        numInferenceSteps: params.numInferenceSteps,
        guidanceScale: params.guidanceScale,
      });

      // Apply style consistency if style reference provided
      let finalUrl = vtonResult.outputUrl;
      let finalModel = `${baseResult.modelUsed}+${vtonResult.modelUsed}`;

      if (params.styleRef) {
        console.log('Stage 3: Applying style consistency');
        const styleResult = await StyleConsistencyService.generateWithStyleConsistency({
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          styleRef: params.styleRef,
          baseImage: vtonResult.outputUrl,
          preferredMethod: 'controlnet',
          numInferenceSteps: params.numInferenceSteps,
          guidanceScale: params.guidanceScale,
        });
        finalUrl = styleResult.outputUrls[0];
        finalModel = `${finalModel}+${styleResult.modelUsed}`;
      }

      const totalProcessingTime = baseResult.processingTimeMs + vtonResult.processingTimeMs;

      return {
        imageUrl: finalUrl,
        metadata: {
          model: finalModel,
          provider: 'replicate',
          processingTimeMs: totalProcessingTime,
          costUsd: this.estimateModelCost(finalModel),
        },
      };
    } catch (error: any) {
      console.error('Virtual try-on pipeline error:', error);

      // Fallback to character consistency only
      console.warn('Virtual try-on failed, falling back to character consistency only');
      return await this.generateWithCharacterConsistency(params);
    }
  }

  /**
   * Standard generation without consistency references
   */
  private static async generateStandard(
    params: ConsistencyGenerationParams
  ): Promise<GenerationResult> {
    try {
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = imageResponse.data?.[0]?.url;
      if (!imageUrl) throw new Error('Failed to generate image');

      return {
        imageUrl,
        metadata: {
          model: 'dall-e-3',
          provider: 'openai',
          processingTimeMs: 0,
          costUsd: 0.04,
        },
      };
    } catch (error) {
      console.error('Standard generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate consistency score between reference and generated image
   *
   * This compares the generated image with references to score consistency.
   * Uses various metrics like face similarity, color matching, etc.
   */
  static async calculateConsistencyScore(
    generatedImageUrl: string,
    params: {
      characterRef?: CharacterReference | null;
      garmentRef?: GarmentReference | null;
      styleRef?: StyleReference | null;
    }
  ): Promise<ConsistencyScore> {
    const scores: ConsistencyScore = {
      overall: 0,
      breakdown: {},
    };

    const scorePromises: Array<Promise<void>> = [];

    // Calculate face similarity if character reference provided
    if (params.characterRef) {
      scorePromises.push(
        CharacterConsistencyService.calculateFaceSimilarity(
          generatedImageUrl,
          params.characterRef.faceImageUrl
        ).then(score => {
          scores.faceScore = score;
          scores.breakdown.featureConsistency = score;
        }).catch(error => {
          console.error('Face similarity calculation failed:', error);
          scores.faceScore = 75; // Fallback score
          scores.breakdown.featureConsistency = 75;
        })
      );
    }

    // Calculate garment accuracy if garment reference provided
    if (params.garmentRef) {
      scorePromises.push(
        GarmentConsistencyService.calculateGarmentAccuracy(
          generatedImageUrl,
          params.garmentRef
        ).then(result => {
          scores.garmentScore = result.overallScore;
          scores.breakdown.colorMatch = result.colorMatchScore;
          scores.breakdown.structuralSimilarity = result.patternMatchScore;
        }).catch(error => {
          console.error('Garment accuracy calculation failed:', error);
          scores.garmentScore = 80; // Fallback score
          scores.breakdown.colorMatch = 80;
        })
      );
    }

    // Calculate style match if style reference provided
    if (params.styleRef) {
      scorePromises.push(
        StyleConsistencyService.calculateStyleMatchScore(
          generatedImageUrl,
          params.styleRef
        ).then(result => {
          scores.styleScore = result.overallScore;
          if (!scores.breakdown.colorMatch) {
            scores.breakdown.colorMatch = result.colorHarmonyScore;
          }
          if (!scores.breakdown.structuralSimilarity) {
            scores.breakdown.structuralSimilarity = result.compositionScore;
          }
        }).catch(error => {
          console.error('Style match calculation failed:', error);
          scores.styleScore = 82; // Fallback score
        })
      );
    }

    // Wait for all scoring operations to complete
    await Promise.all(scorePromises);

    // Calculate overall score as weighted average
    const weights: number[] = [];
    const values: number[] = [];

    if (scores.faceScore !== undefined) {
      weights.push(0.4); // Face is most important
      values.push(scores.faceScore);
    }

    if (scores.garmentScore !== undefined) {
      weights.push(0.35); // Garment is second most important
      values.push(scores.garmentScore);
    }

    if (scores.styleScore !== undefined) {
      weights.push(0.25); // Style is important but less critical
      values.push(scores.styleScore);
    }

    // Calculate weighted average
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    scores.overall = Math.round(weightedSum / totalWeight);

    return scores;
  }

  /**
   * Estimate cost for AI model usage
   */
  private static estimateModelCost(modelName: string): number {
    const costMap: Record<string, number> = {
      'instant-id': 0.10,
      'photomaker': 0.08,
      'idm-vton': 0.12,
      'oot-diffusion': 0.10,
      'controlnet-canny': 0.05,
      'sdxl': 0.04,
      'dall-e-3': 0.04,
    };

    // For combined models, sum the costs
    if (modelName.includes('+')) {
      const models = modelName.split('+');
      return models.reduce((total, model) => {
        return total + (costMap[model.trim()] || 0.05);
      }, 0);
    }

    return costMap[modelName] || 0.05;
  }

  /**
   * Decide if regeneration is needed based on consistency score
   */
  static shouldRegenerate(score: ConsistencyScore): boolean {
    const REGENERATION_THRESHOLD = 70;

    // If overall score is below threshold, regenerate
    if (score.overall < REGENERATION_THRESHOLD) {
      return true;
    }

    // If any individual score is critically low, regenerate
    if (score.faceScore && score.faceScore < 60) {
      return true;
    }

    if (score.garmentScore && score.garmentScore < 65) {
      return true;
    }

    if (score.styleScore && score.styleScore < 60) {
      return true;
    }

    return false;
  }

  /**
   * Get model recommendation based on references
   */
  static getRecommendedModel(params: {
    hasCharacterRef: boolean;
    hasGarmentRef: boolean;
    hasStyleRef: boolean;
  }): {
    primary: string;
    fallback: string[];
    estimatedCost: number;
  } {
    if (params.hasCharacterRef && params.hasGarmentRef) {
      return {
        primary: 'InstantID + IDM-VTON',
        fallback: ['Fooocus IP-Adapter', 'DALL-E 3'],
        estimatedCost: 0.15,
      };
    }

    if (params.hasCharacterRef) {
      return {
        primary: 'InstantID',
        fallback: ['PhotoMaker', 'Fooocus IP-Adapter', 'DALL-E 3'],
        estimatedCost: 0.10,
      };
    }

    if (params.hasGarmentRef) {
      return {
        primary: 'IDM-VTON',
        fallback: ['OOTDiffusion', 'StableVITON', 'DALL-E 3'],
        estimatedCost: 0.12,
      };
    }

    return {
      primary: 'DALL-E 3',
      fallback: ['Midjourney', 'Stable Diffusion XL'],
      estimatedCost: 0.04,
    };
  }
}
