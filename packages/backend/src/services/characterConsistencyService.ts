import Replicate from 'replicate';
import { CharacterReference } from '@prisma/client';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

/**
 * Character Consistency Service
 *
 * Handles character consistency using InstantID and PhotoMaker models
 * for maintaining consistent face appearance across generations.
 */
export class CharacterConsistencyService {
  /**
   * Generate image with character consistency using InstantID
   *
   * InstantID: Zero-shot Identity-Preserving Generation
   * Model: https://replicate.com/zsxkib/instant-id
   */
  static async generateWithInstantID(params: {
    prompt: string;
    negativePrompt?: string;
    characterRef: CharacterReference;
    numOutputs?: number;
    guidanceScale?: number;
    numInferenceSteps?: number;
  }): Promise<{
    outputUrls: string[];
    modelUsed: string;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      // InstantID requires a face image as reference
      const input = {
        image: params.characterRef.faceImageUrl,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
        num_outputs: params.numOutputs || 1,
        guidance_scale: params.guidanceScale || 7.5,
        num_inference_steps: params.numInferenceSteps || 30,
        scheduler: 'K_EULER_ANCESTRAL',
        ip_adapter_scale: 0.8, // Controls identity preservation strength
        controlnet_conditioning_scale: 0.8,
      };

      const output = await replicate.run(
        'zsxkib/instant-id:bf53bfb798dc9e5f48543b6ae3d8ba8d91de9de8c0a439c8ec25d88a34eecf43',
        { input }
      ) as string[];

      return {
        outputUrls: Array.isArray(output) ? output : [output],
        modelUsed: 'instant-id',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('InstantID generation failed:', error);
      throw new Error(`InstantID generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image with character consistency using PhotoMaker
   *
   * PhotoMaker: Customizing Realistic Human Photos via Stacked ID Embedding
   * Model: https://replicate.com/tencentarc/photomaker
   */
  static async generateWithPhotoMaker(params: {
    prompt: string;
    negativePrompt?: string;
    characterRef: CharacterReference;
    numOutputs?: number;
    guidanceScale?: number;
    numInferenceSteps?: number;
  }): Promise<{
    outputUrls: string[];
    modelUsed: string;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();

    try {
      const input = {
        input_image: params.characterRef.faceImageUrl,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || 'nsfw, lowres, bad anatomy, bad hands, text, error',
        num_outputs: params.numOutputs || 1,
        guidance_scale: params.guidanceScale || 5.0,
        num_inference_steps: params.numInferenceSteps || 20,
        style_name: 'Photographic (Default)', // More realistic for fashion
        style_strength_ratio: 20,
      };

      const output = await replicate.run(
        'tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4',
        { input }
      ) as string[];

      return {
        outputUrls: Array.isArray(output) ? output : [output],
        modelUsed: 'photomaker',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('PhotoMaker generation failed:', error);
      throw new Error(`PhotoMaker generation failed: ${error.message}`);
    }
  }

  /**
   * Generate with character consistency using best available model
   * Tries InstantID first, falls back to PhotoMaker if needed
   */
  static async generateWithCharacterConsistency(params: {
    prompt: string;
    negativePrompt?: string;
    characterRef: CharacterReference;
    preferredModel?: 'instant-id' | 'photomaker' | 'auto';
    numOutputs?: number;
    guidanceScale?: number;
    numInferenceSteps?: number;
  }): Promise<{
    outputUrls: string[];
    modelUsed: string;
    processingTimeMs: number;
  }> {
    const preferredModel = params.preferredModel || 'auto';

    // Auto selection: InstantID is generally better for identity preservation
    if (preferredModel === 'auto' || preferredModel === 'instant-id') {
      try {
        return await this.generateWithInstantID(params);
      } catch (error) {
        console.warn('InstantID failed, falling back to PhotoMaker:', error);
        if (preferredModel === 'instant-id') {
          throw error; // Don't fallback if user specifically requested InstantID
        }
      }
    }

    // Try PhotoMaker as fallback or if explicitly requested
    return await this.generateWithPhotoMaker(params);
  }

  /**
   * Extract face embedding from image (for future use)
   * This would use InsightFace or similar for face recognition
   */
  static async extractFaceEmbedding(imageUrl: string): Promise<number[]> {
    // TODO: Implement actual face embedding extraction
    // Options:
    // 1. Use InsightFace Python API via child process
    // 2. Use DeepFace with TensorFlow.js
    // 3. Use face-api.js (less accurate but pure JS)
    // 4. Use external API like Amazon Rekognition

    // Placeholder: Return dummy embedding
    console.warn('Face embedding extraction not yet implemented');
    return new Array(512).fill(0).map(() => Math.random());
  }

  /**
   * Calculate face similarity score between two images
   * Returns score from 0 to 100 (higher = more similar)
   */
  static async calculateFaceSimilarity(
    imageUrl1: string,
    imageUrl2: string
  ): Promise<number> {
    // TODO: Implement actual face similarity calculation
    // Options:
    // 1. Use InsightFace for face comparison
    // 2. Use DeepFace similarity
    // 3. Use AWS Rekognition CompareFaces API
    // 4. Use Azure Face API

    // Placeholder: Return random score between 75-95
    const placeholderScore = 75 + Math.random() * 20;
    console.warn('Face similarity calculation not yet implemented, returning placeholder:', placeholderScore);
    return placeholderScore;
  }
}
