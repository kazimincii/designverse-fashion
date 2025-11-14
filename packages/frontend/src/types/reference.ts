// ============================================================
// REFERENCE TYPES
// ============================================================

export enum ReferenceType {
  CHARACTER = 'CHARACTER',
  GARMENT = 'GARMENT',
  STYLE = 'STYLE',
  LOCATION = 'LOCATION',
  LIGHTING = 'LIGHTING',
  MOOD = 'MOOD',
}

export interface CharacterReference {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  faceImageUrl: string;
  bodyImageUrl?: string;
  thumbnailUrl?: string;
  faceEmbedding?: any;
  visualFeatures?: {
    dominantColors: string[];
    colorNames: string[];
    imageMetadata: any;
  };
  metadataJson?: any;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GarmentReference {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  referenceImageUrl: string;
  thumbnailUrl?: string;
  category: string;
  colorPalette: string[];
  colorNames: string[];
  primaryColor?: string;
  garmentEmbedding?: any;
  fabricTexture?: string;
  pattern?: string;
  style?: string;
  metadataJson?: any;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StyleReference {
  id: string;
  sessionId: string;
  type: ReferenceType;
  name: string;
  description?: string;
  referenceImageUrl?: string;
  thumbnailUrl?: string;
  promptTemplate: string;
  negativePrompt?: string;
  styleEmbedding?: any;
  colorPalette: string[];
  lightingSetup?: string;
  mood?: string;
  cameraAngle?: string;
  modelParameters?: any;
  metadataJson?: any;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationHistory {
  id: string;
  sessionId: string;
  generatedAssetId: string;
  jobId?: string;
  characterRefId?: string;
  garmentRefId?: string;
  styleRefId?: string;
  stepNumber: number;
  basePrompt: string;
  enhancedPrompt: string;
  negativePrompt?: string;
  consistencyScore?: number;
  faceSimScore?: number;
  garmentAccScore?: number;
  styleMatchScore?: number;
  modelProvider?: string;
  modelName?: string;
  modelVersion?: string;
  processingTimeMs?: number;
  apiCostUsd?: number;
  wasRegenerated: boolean;
  userRating?: number;
  userFeedback?: string;
  metadataJson?: any;
  createdAt: string;
  characterRef?: CharacterReference;
  garmentRef?: GarmentReference;
  styleRef?: StyleReference;
}

export interface SessionReferences {
  characters: CharacterReference[];
  garments: GarmentReference[];
  styles: StyleReference[];
}

export interface ReferenceStats {
  characterCount: number;
  garmentCount: number;
  styleCount: number;
  totalGenerations: number;
  averageConsistencyScore: number;
}

export interface GenerationAnalytics {
  totalGenerations: number;
  averageConsistencyScore: number;
  averageFaceScore: number;
  averageGarmentScore: number;
  averageStyleScore: number;
  regenerationRate: number;
  averageProcessingTime: number;
  totalCost: number;
}

export interface AutoExtractResult {
  suggestedTypes: string[];
  confidence: Record<string, number>;
  characterData?: {
    faceImageUrl: string;
    thumbnailUrl: string;
    visualFeatures: {
      dominantColors: string[];
      colorNames: string[];
      imageMetadata: any;
    };
  };
  garmentData?: {
    referenceImageUrl: string;
    thumbnailUrl: string;
    colorPalette: string[];
    colorNames: string[];
    primaryColor: string;
    category: string;
  };
  styleData?: {
    referenceImageUrl?: string;
    thumbnailUrl?: string;
    colorPalette: string[];
    promptSuggestions: string[];
  };
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateCharacterRefRequest {
  sessionId: string;
  name: string;
  description?: string;
  image: File;
}

export interface CreateGarmentRefRequest {
  sessionId: string;
  name: string;
  description?: string;
  category?: string;
  image: File;
}

export interface CreateStyleRefRequest {
  sessionId: string;
  type: ReferenceType;
  name: string;
  description?: string;
  promptTemplate: string;
  negativePrompt?: string;
  lightingSetup?: string;
  mood?: string;
  cameraAngle?: string;
  image?: File;
}

export interface UpdateCharacterRefRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGarmentRefRequest {
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateStyleRefRequest {
  name?: string;
  description?: string;
  promptTemplate?: string;
  negativePrompt?: string;
  lightingSetup?: string;
  mood?: string;
  cameraAngle?: string;
  isActive?: boolean;
}

export interface UpdateGenerationFeedbackRequest {
  rating: number; // 1-5
  feedback?: string;
}
