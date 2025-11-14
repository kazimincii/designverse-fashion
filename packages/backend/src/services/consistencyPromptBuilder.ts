import type { CharacterReference, GarmentReference, StyleReference } from '@prisma/client';

export interface ConsistencyPromptParams {
  basePrompt: string;
  characterRef?: CharacterReference | null;
  garmentRef?: GarmentReference | null;
  styleRef?: StyleReference | null;
  additionalParams?: {
    style?: string;
    lighting?: string;
    mood?: string;
    cameraAngle?: string;
  };
}

export interface EnhancedPromptResult {
  enhancedPrompt: string;
  negativePrompt: string;
  promptBreakdown: {
    base: string;
    characterInjection?: string;
    garmentInjection?: string;
    styleInjection?: string;
    additionalInjection?: string;
  };
  consistencyTags: string[];
}

/**
 * Consistency-Aware Prompt Builder
 *
 * Builds AI prompts that incorporate reference data for consistency
 * across multiple generations.
 */
export class ConsistencyPromptBuilder {
  /**
   * Build a consistency-enhanced prompt from references
   */
  static buildPrompt(params: ConsistencyPromptParams): EnhancedPromptResult {
    const {
      basePrompt,
      characterRef,
      garmentRef,
      styleRef,
      additionalParams,
    } = params;

    const promptParts: string[] = [basePrompt.trim()];
    const negativeParts: string[] = [];
    const consistencyTags: string[] = [];
    const breakdown: EnhancedPromptResult['promptBreakdown'] = {
      base: basePrompt.trim(),
    };

    // ============================================================
    // CHARACTER CONSISTENCY INJECTION
    // ============================================================
    if (characterRef) {
      const characterPrompt = this.buildCharacterPrompt(characterRef);
      if (characterPrompt.prompt) {
        promptParts.push(characterPrompt.prompt);
        breakdown.characterInjection = characterPrompt.prompt;
        consistencyTags.push('character-consistent');
      }
      if (characterPrompt.negative) {
        negativeParts.push(characterPrompt.negative);
      }
    }

    // ============================================================
    // GARMENT CONSISTENCY INJECTION
    // ============================================================
    if (garmentRef) {
      const garmentPrompt = this.buildGarmentPrompt(garmentRef);
      if (garmentPrompt.prompt) {
        promptParts.push(garmentPrompt.prompt);
        breakdown.garmentInjection = garmentPrompt.prompt;
        consistencyTags.push('garment-consistent');
      }
      if (garmentPrompt.negative) {
        negativeParts.push(garmentPrompt.negative);
      }
    }

    // ============================================================
    // STYLE CONSISTENCY INJECTION
    // ============================================================
    if (styleRef) {
      promptParts.push(styleRef.promptTemplate);
      breakdown.styleInjection = styleRef.promptTemplate;
      consistencyTags.push('style-consistent');

      if (styleRef.negativePrompt) {
        negativeParts.push(styleRef.negativePrompt);
      }
    }

    // ============================================================
    // ADDITIONAL PARAMETERS
    // ============================================================
    if (additionalParams) {
      const additionalPrompt = this.buildAdditionalPrompt(additionalParams);
      if (additionalPrompt) {
        promptParts.push(additionalPrompt);
        breakdown.additionalInjection = additionalPrompt;
      }
    }

    // ============================================================
    // DEFAULT CONSISTENCY NEGATIVE PROMPTS
    // ============================================================
    const defaultNegatives = [
      'inconsistent style',
      'different person',
      'wrong colors',
      'poor quality',
      'blurry',
      'distorted',
      'artifacts',
    ];
    negativeParts.push(...defaultNegatives);

    // Combine all parts
    const enhancedPrompt = promptParts.join(', ');
    const negativePrompt = negativeParts.join(', ');

    return {
      enhancedPrompt,
      negativePrompt,
      promptBreakdown: breakdown,
      consistencyTags,
    };
  }

  /**
   * Build character-specific prompt injection
   */
  private static buildCharacterPrompt(
    characterRef: CharacterReference
  ): { prompt: string; negative: string } {
    const promptParts: string[] = [];
    const negativeParts: string[] = ['different face', 'different person', 'wrong identity'];

    // Add consistency keywords
    promptParts.push('consistent character');
    promptParts.push('same person');
    promptParts.push('identical face');

    // Extract visual features if available
    if (characterRef.visualFeatures) {
      const features = characterRef.visualFeatures as any;

      // Color features (hair, skin tone from dominant colors)
      if (features.colorNames && Array.isArray(features.colorNames)) {
        const mainColors = features.colorNames.slice(0, 2);
        if (mainColors.length > 0) {
          promptParts.push(`${mainColors.join(' and ')} tones`);
        }
      }
    }

    // Add description if available
    if (characterRef.description) {
      promptParts.push(characterRef.description);
    }

    return {
      prompt: promptParts.join(', '),
      negative: negativeParts.join(', '),
    };
  }

  /**
   * Build garment-specific prompt injection
   */
  private static buildGarmentPrompt(
    garmentRef: GarmentReference
  ): { prompt: string; negative: string } {
    const promptParts: string[] = [];
    const negativeParts: string[] = [
      'different clothing',
      'wrong colors',
      'inconsistent outfit',
    ];

    // Add consistency keywords
    promptParts.push('consistent clothing');
    promptParts.push('same outfit');

    // Category
    if (garmentRef.category) {
      promptParts.push(garmentRef.category);
    }

    // Color palette
    if (garmentRef.colorNames && garmentRef.colorNames.length > 0) {
      const colorStr = garmentRef.colorNames.slice(0, 3).join(' and ');
      promptParts.push(`${colorStr} colors`);
    }

    // Primary color
    if (garmentRef.primaryColor) {
      promptParts.push(`primarily ${garmentRef.primaryColor}`);
    }

    // Fabric texture
    if (garmentRef.fabricTexture) {
      promptParts.push(`${garmentRef.fabricTexture} fabric`);
    }

    // Pattern
    if (garmentRef.pattern) {
      promptParts.push(`${garmentRef.pattern} pattern`);
    }

    // Style
    if (garmentRef.style) {
      promptParts.push(`${garmentRef.style} style`);
    }

    // Description
    if (garmentRef.description) {
      promptParts.push(garmentRef.description);
    }

    return {
      prompt: promptParts.join(', '),
      negative: negativeParts.join(', '),
    };
  }

  /**
   * Build additional parameters prompt
   */
  private static buildAdditionalPrompt(params: {
    style?: string;
    lighting?: string;
    mood?: string;
    cameraAngle?: string;
  }): string {
    const parts: string[] = [];

    if (params.style) {
      parts.push(`${params.style} style`);
    }

    if (params.lighting) {
      parts.push(`${params.lighting} lighting`);
    }

    if (params.mood) {
      parts.push(`${params.mood} mood`);
    }

    if (params.cameraAngle) {
      parts.push(`${params.cameraAngle} camera angle`);
    }

    return parts.join(', ');
  }

  /**
   * Extract keywords from prompt for analysis
   */
  static extractKeywords(prompt: string): string[] {
    // Simple keyword extraction (can be improved with NLP)
    const keywords = prompt
      .toLowerCase()
      .split(/[,.\s]+/)
      .filter((word) => word.length > 3)
      .filter((word) => !['with', 'and', 'the', 'for', 'that'].includes(word));

    return Array.from(new Set(keywords));
  }

  /**
   * Calculate prompt complexity score
   */
  static calculateComplexity(prompt: string): number {
    const words = prompt.split(/\s+/).length;
    const commas = (prompt.match(/,/g) || []).length;
    const descriptors = (prompt.match(/\b(vibrant|beautiful|stunning|professional|high-quality|detailed)\b/gi) || []).length;

    // Complexity score: 0-100
    const wordScore = Math.min(words / 50, 1) * 40; // Up to 40 points
    const structureScore = Math.min(commas / 10, 1) * 30; // Up to 30 points
    const descriptorScore = Math.min(descriptors / 5, 1) * 30; // Up to 30 points

    return Math.round(wordScore + structureScore + descriptorScore);
  }

  /**
   * Validate prompt for AI generation
   */
  static validatePrompt(prompt: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check length
    if (prompt.length < 10) {
      issues.push('Prompt too short');
      suggestions.push('Add more descriptive details');
    }

    if (prompt.length > 1000) {
      issues.push('Prompt too long');
      suggestions.push('Simplify and focus on key elements');
    }

    // Check for common issues
    if (!prompt.match(/\w/)) {
      issues.push('No valid words found');
    }

    // Check for conflicting terms
    const conflicts = [
      ['day', 'night'],
      ['bright', 'dark'],
      ['happy', 'sad'],
    ];

    for (const [term1, term2] of conflicts) {
      if (
        prompt.toLowerCase().includes(term1) &&
        prompt.toLowerCase().includes(term2)
      ) {
        issues.push(`Conflicting terms: ${term1} and ${term2}`);
        suggestions.push(`Choose either ${term1} or ${term2}`);
      }
    }

    // Suggestions for improvement
    if (!prompt.match(/\b(professional|high-quality|detailed|cinematic)\b/i)) {
      suggestions.push('Consider adding quality descriptors (professional, high-quality, etc.)');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}
