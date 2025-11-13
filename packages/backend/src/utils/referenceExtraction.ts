import {
  extractColorPalette,
  getColorNamesFromPalette,
  createThumbnail,
  getImageMetadata,
  downloadImage,
} from './imageProcessing';
import { storageService } from '../services/storageService';

export interface CharacterExtractionResult {
  faceImageUrl: string;
  thumbnailUrl: string;
  visualFeatures: {
    dominantColors: string[];
    colorNames: string[];
    imageMetadata: any;
  };
}

export interface GarmentExtractionResult {
  referenceImageUrl: string;
  thumbnailUrl: string;
  colorPalette: string[];
  colorNames: string[];
  primaryColor: string;
  category: string; // Auto-detected or manual
}

export interface StyleExtractionResult {
  referenceImageUrl?: string;
  thumbnailUrl?: string;
  colorPalette: string[];
  promptSuggestions: string[];
}

/**
 * Extract character reference data from an uploaded image
 */
export async function extractCharacterReference(
  imageBuffer: Buffer,
  filename: string
): Promise<CharacterExtractionResult> {
  // 1. Create thumbnail
  const thumbnailBuffer = await createThumbnail(imageBuffer, 300, 300);

  // 2. Upload both to storage
  const [imageUrl, thumbnailUrl] = await Promise.all([
    storageService.uploadFile(imageBuffer, `characters/${filename}`),
    storageService.uploadFile(thumbnailBuffer, `characters/thumb_${filename}`),
  ]);

  // 3. Extract color palette (for visual features)
  const { colors: dominantColors } = await extractColorPalette(imageBuffer, 5);
  const colorNames = getColorNamesFromPalette(dominantColors);

  // 4. Get image metadata
  const imageMetadata = await getImageMetadata(imageBuffer);

  return {
    faceImageUrl: imageUrl,
    thumbnailUrl,
    visualFeatures: {
      dominantColors,
      colorNames,
      imageMetadata,
    },
  };
}

/**
 * Extract garment reference data from an uploaded image
 */
export async function extractGarmentReference(
  imageBuffer: Buffer,
  filename: string,
  category?: string
): Promise<GarmentExtractionResult> {
  // 1. Create thumbnail
  const thumbnailBuffer = await createThumbnail(imageBuffer, 300, 300);

  // 2. Upload both to storage
  const [imageUrl, thumbnailUrl] = await Promise.all([
    storageService.uploadFile(imageBuffer, `garments/${filename}`),
    storageService.uploadFile(thumbnailBuffer, `garments/thumb_${filename}`),
  ]);

  // 3. Extract color palette (more colors for garments)
  const { colors: colorPalette } = await extractColorPalette(imageBuffer, 8);
  const colorNames = getColorNamesFromPalette(colorPalette);
  const primaryColor = colorPalette[0]; // First color is usually most dominant

  // 4. Auto-detect category (basic implementation, can be improved with AI)
  const detectedCategory = category || detectGarmentCategory(colorPalette, colorNames);

  return {
    referenceImageUrl: imageUrl,
    thumbnailUrl,
    colorPalette,
    colorNames,
    primaryColor,
    category: detectedCategory,
  };
}

/**
 * Extract style reference data from an uploaded image
 */
export async function extractStyleReference(
  imageBuffer: Buffer,
  filename: string,
  referenceType: string
): Promise<StyleExtractionResult> {
  // 1. Create thumbnail
  const thumbnailBuffer = await createThumbnail(imageBuffer, 300, 300);

  // 2. Upload both to storage
  const [imageUrl, thumbnailUrl] = await Promise.all([
    storageService.uploadFile(imageBuffer, `styles/${filename}`),
    storageService.uploadFile(thumbnailBuffer, `styles/thumb_${filename}`),
  ]);

  // 3. Extract color palette
  const { colors: colorPalette } = await extractColorPalette(imageBuffer, 6);
  const colorNames = getColorNamesFromPalette(colorPalette);

  // 4. Generate prompt suggestions based on visual analysis
  const promptSuggestions = generatePromptSuggestions(colorPalette, colorNames, referenceType);

  return {
    referenceImageUrl: imageUrl,
    thumbnailUrl,
    colorPalette,
    promptSuggestions,
  };
}

/**
 * Basic garment category detection
 * TODO: Replace with AI-based classification (CLIP or specialized model)
 */
function detectGarmentCategory(colorPalette: string[], colorNames: string[]): string {
  // For now, return a default category
  // In the future, this will use AI vision models
  return 'clothing';
}

/**
 * Generate prompt suggestions based on visual analysis
 */
function generatePromptSuggestions(
  colorPalette: string[],
  colorNames: string[],
  referenceType: string
): string[] {
  const suggestions: string[] = [];

  // Color-based suggestions
  const dominantColorName = colorNames[0]?.toLowerCase() || 'neutral';
  suggestions.push(`${dominantColorName} tones`);

  // Check for warm vs cool colors
  const isWarm = colorPalette.some((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r > b && r > g;
  });
  suggestions.push(isWarm ? 'warm color palette' : 'cool color palette');

  // Brightness-based suggestions
  const avgBrightness =
    colorPalette.reduce((sum, hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return sum + (r + g + b) / 3;
    }, 0) / colorPalette.length;

  if (avgBrightness > 180) {
    suggestions.push('high-key lighting', 'bright and airy');
  } else if (avgBrightness < 80) {
    suggestions.push('low-key lighting', 'moody and dramatic');
  } else {
    suggestions.push('balanced lighting');
  }

  // Type-specific suggestions
  switch (referenceType) {
    case 'LOCATION':
      suggestions.push('consistent background', 'same environment');
      break;
    case 'LIGHTING':
      suggestions.push('consistent lighting setup', 'same mood');
      break;
    case 'STYLE':
      suggestions.push('consistent artistic style', 'same aesthetic');
      break;
    case 'MOOD':
      suggestions.push('consistent emotional tone');
      break;
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Analyze image and suggest reference type
 */
export async function suggestReferenceType(
  imageBuffer: Buffer
): Promise<{
  suggestedTypes: string[];
  confidence: Record<string, number>;
}> {
  const metadata = await getImageMetadata(imageBuffer);
  const { colors } = await extractColorPalette(imageBuffer, 5);

  const confidence: Record<string, number> = {};

  // Simple heuristics (can be improved with AI)

  // Portrait detection (aspect ratio + brightness analysis)
  const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
  if (aspectRatio > 0.6 && aspectRatio < 0.8) {
    confidence.CHARACTER = 0.7;
  } else {
    confidence.CHARACTER = 0.3;
  }

  // Garment detection (high color saturation)
  const colorCount = colors.length;
  if (colorCount >= 3) {
    confidence.GARMENT = 0.6;
  } else {
    confidence.GARMENT = 0.4;
  }

  // Style/scene detection (wide aspect ratio)
  if (aspectRatio > 1.2) {
    confidence.STYLE = 0.7;
    confidence.LOCATION = 0.7;
  } else {
    confidence.STYLE = 0.4;
    confidence.LOCATION = 0.4;
  }

  // Sort by confidence
  const suggestedTypes = Object.entries(confidence)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type);

  return {
    suggestedTypes,
    confidence,
  };
}

/**
 * Extract all reference data from an image (auto-detect type)
 */
export async function extractAllReferenceData(
  imageBuffer: Buffer,
  filename: string
) {
  const typeSuggestion = await suggestReferenceType(imageBuffer);

  const [character, garment, style] = await Promise.all([
    extractCharacterReference(imageBuffer, filename).catch(() => null),
    extractGarmentReference(imageBuffer, filename).catch(() => null),
    extractStyleReference(imageBuffer, filename, 'STYLE').catch(() => null),
  ]);

  return {
    suggestedTypes: typeSuggestion.suggestedTypes,
    confidence: typeSuggestion.confidence,
    characterData: character,
    garmentData: garment,
    styleData: style,
  };
}
