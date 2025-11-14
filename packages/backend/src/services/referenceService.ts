import { prisma } from '../config/database';
import { ReferenceType, type GenerationHistory } from '@prisma/client';

export interface CreateCharacterRefData {
  sessionId: string;
  name: string;
  description?: string;
  faceImageUrl: string;
  bodyImageUrl?: string;
  thumbnailUrl?: string;
  faceEmbedding?: any;
  visualFeatures?: any;
}

export interface CreateGarmentRefData {
  sessionId: string;
  name: string;
  description?: string;
  referenceImageUrl: string;
  thumbnailUrl?: string;
  category: string;
  colorPalette?: string[];
  colorNames?: string[];
  primaryColor?: string;
  garmentEmbedding?: any;
  fabricTexture?: string;
  pattern?: string;
  style?: string;
}

export interface CreateStyleRefData {
  sessionId: string;
  type: ReferenceType;
  name: string;
  description?: string;
  referenceImageUrl?: string;
  thumbnailUrl?: string;
  promptTemplate: string;
  negativePrompt?: string;
  styleEmbedding?: any;
  colorPalette?: string[];
  lightingSetup?: string;
  mood?: string;
  cameraAngle?: string;
  modelParameters?: any;
}

export interface CreateGenerationHistoryData {
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
  wasRegenerated?: boolean;
  userRating?: number;
  userFeedback?: string;
}

export const referenceService = {
  // ============================================================
  // CHARACTER REFERENCE METHODS
  // ============================================================

  /**
   * Create a new character reference from an image
   */
  async createCharacterReference(data: CreateCharacterRefData) {
    const charRef = await prisma.characterReference.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        description: data.description,
        faceImageUrl: data.faceImageUrl,
        bodyImageUrl: data.bodyImageUrl,
        thumbnailUrl: data.thumbnailUrl,
        faceEmbedding: data.faceEmbedding,
        visualFeatures: data.visualFeatures,
      },
    });

    return charRef;
  },

  /**
   * Get all character references for a session
   */
  async getCharacterReferences(sessionId: string, activeOnly = false) {
    return await prisma.characterReference.findMany({
      where: {
        sessionId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get a specific character reference by ID
   */
  async getCharacterReference(id: string) {
    return await prisma.characterReference.findUnique({
      where: { id },
      include: {
        session: true,
        generationHistories: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  /**
   * Update character reference
   */
  async updateCharacterReference(
    id: string,
    data: Partial<CreateCharacterRefData>
  ) {
    return await prisma.characterReference.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete character reference
   */
  async deleteCharacterReference(id: string) {
    return await prisma.characterReference.delete({
      where: { id },
    });
  },

  /**
   * Increment usage count when character reference is used
   */
  async incrementCharacterUsage(id: string) {
    return await prisma.characterReference.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  },

  // ============================================================
  // GARMENT REFERENCE METHODS
  // ============================================================

  /**
   * Create a new garment reference from an image
   */
  async createGarmentReference(data: CreateGarmentRefData) {
    const garmentRef = await prisma.garmentReference.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        description: data.description,
        referenceImageUrl: data.referenceImageUrl,
        thumbnailUrl: data.thumbnailUrl,
        category: data.category,
        colorPalette: data.colorPalette || [],
        colorNames: data.colorNames || [],
        primaryColor: data.primaryColor,
        garmentEmbedding: data.garmentEmbedding,
        fabricTexture: data.fabricTexture,
        pattern: data.pattern,
        style: data.style,
      },
    });

    return garmentRef;
  },

  /**
   * Get all garment references for a session
   */
  async getGarmentReferences(sessionId: string, activeOnly = false) {
    return await prisma.garmentReference.findMany({
      where: {
        sessionId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get a specific garment reference by ID
   */
  async getGarmentReference(id: string) {
    return await prisma.garmentReference.findUnique({
      where: { id },
      include: {
        session: true,
        generationHistories: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  /**
   * Update garment reference
   */
  async updateGarmentReference(
    id: string,
    data: Partial<CreateGarmentRefData>
  ) {
    return await prisma.garmentReference.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete garment reference
   */
  async deleteGarmentReference(id: string) {
    return await prisma.garmentReference.delete({
      where: { id },
    });
  },

  /**
   * Increment usage count when garment reference is used
   */
  async incrementGarmentUsage(id: string) {
    return await prisma.garmentReference.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  },

  // ============================================================
  // STYLE REFERENCE METHODS
  // ============================================================

  /**
   * Create a new style reference
   */
  async createStyleReference(data: CreateStyleRefData) {
    const styleRef = await prisma.styleReference.create({
      data: {
        sessionId: data.sessionId,
        type: data.type,
        name: data.name,
        description: data.description,
        referenceImageUrl: data.referenceImageUrl,
        thumbnailUrl: data.thumbnailUrl,
        promptTemplate: data.promptTemplate,
        negativePrompt: data.negativePrompt,
        styleEmbedding: data.styleEmbedding,
        colorPalette: data.colorPalette || [],
        lightingSetup: data.lightingSetup,
        mood: data.mood,
        cameraAngle: data.cameraAngle,
        modelParameters: data.modelParameters,
      },
    });

    return styleRef;
  },

  /**
   * Get all style references for a session
   */
  async getStyleReferences(
    sessionId: string,
    type?: ReferenceType,
    activeOnly = false
  ) {
    return await prisma.styleReference.findMany({
      where: {
        sessionId,
        ...(type && { type }),
        ...(activeOnly && { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get a specific style reference by ID
   */
  async getStyleReference(id: string) {
    return await prisma.styleReference.findUnique({
      where: { id },
      include: {
        session: true,
        generationHistories: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  /**
   * Update style reference
   */
  async updateStyleReference(id: string, data: Partial<CreateStyleRefData>) {
    return await prisma.styleReference.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete style reference
   */
  async deleteStyleReference(id: string) {
    return await prisma.styleReference.delete({
      where: { id },
    });
  },

  /**
   * Increment usage count when style reference is used
   */
  async incrementStyleUsage(id: string) {
    return await prisma.styleReference.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  },

  // ============================================================
  // COMBINED METHODS
  // ============================================================

  /**
   * Get all references for a session (characters, garments, styles)
   */
  async getSessionReferences(sessionId: string, activeOnly = false) {
    const [characters, garments, styles] = await Promise.all([
      this.getCharacterReferences(sessionId, activeOnly),
      this.getGarmentReferences(sessionId, activeOnly),
      this.getStyleReferences(sessionId, undefined, activeOnly),
    ]);

    return {
      characters,
      garments,
      styles,
    };
  },

  /**
   * Get reference statistics for a session
   */
  async getSessionReferenceStats(sessionId: string) {
    const [
      characterCount,
      garmentCount,
      styleCount,
      totalGenerations,
      avgConsistencyScore,
    ] = await Promise.all([
      prisma.characterReference.count({ where: { sessionId, isActive: true } }),
      prisma.garmentReference.count({ where: { sessionId, isActive: true } }),
      prisma.styleReference.count({ where: { sessionId, isActive: true } }),
      prisma.generationHistory.count({ where: { sessionId } }),
      prisma.generationHistory.aggregate({
        where: {
          sessionId,
          consistencyScore: { not: null },
        },
        _avg: {
          consistencyScore: true,
        },
      }),
    ]);

    return {
      characterCount,
      garmentCount,
      styleCount,
      totalGenerations,
      averageConsistencyScore: avgConsistencyScore._avg.consistencyScore || 0,
    };
  },

  // ============================================================
  // GENERATION HISTORY METHODS
  // ============================================================

  /**
   * Create a generation history entry
   */
  async createGenerationHistory(data: CreateGenerationHistoryData) {
    const history = await prisma.generationHistory.create({
      data: {
        sessionId: data.sessionId,
        generatedAssetId: data.generatedAssetId,
        jobId: data.jobId,
        characterRefId: data.characterRefId,
        garmentRefId: data.garmentRefId,
        styleRefId: data.styleRefId,
        stepNumber: data.stepNumber,
        basePrompt: data.basePrompt,
        enhancedPrompt: data.enhancedPrompt,
        negativePrompt: data.negativePrompt,
        consistencyScore: data.consistencyScore,
        faceSimScore: data.faceSimScore,
        garmentAccScore: data.garmentAccScore,
        styleMatchScore: data.styleMatchScore,
        modelProvider: data.modelProvider,
        modelName: data.modelName,
        modelVersion: data.modelVersion,
        processingTimeMs: data.processingTimeMs,
        apiCostUsd: data.apiCostUsd,
        wasRegenerated: data.wasRegenerated || false,
        userRating: data.userRating,
        userFeedback: data.userFeedback,
      },
    });

    // Increment usage counts for references
    if (data.characterRefId) {
      await this.incrementCharacterUsage(data.characterRefId);
    }
    if (data.garmentRefId) {
      await this.incrementGarmentUsage(data.garmentRefId);
    }
    if (data.styleRefId) {
      await this.incrementStyleUsage(data.styleRefId);
    }

    return history;
  },

  /**
   * Get generation history for a session
   */
  async getGenerationHistory(sessionId: string, limit = 50) {
    return await prisma.generationHistory.findMany({
      where: { sessionId },
      include: {
        characterRef: true,
        garmentRef: true,
        styleRef: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  /**
   * Get generation analytics
   */
  async getGenerationAnalytics(sessionId: string) {
    const histories = await prisma.generationHistory.findMany({
      where: {
        sessionId,
        consistencyScore: { not: null },
      },
    });

    if (histories.length === 0) {
      return {
        totalGenerations: 0,
        averageConsistencyScore: 0,
        averageFaceScore: 0,
        averageGarmentScore: 0,
        averageStyleScore: 0,
        regenerationRate: 0,
        averageProcessingTime: 0,
        totalCost: 0,
      };
    }

    const totalGenerations = histories.length;
    const regenerations = histories.filter((history: GenerationHistory) => history.wasRegenerated).length;

    const avgConsistency =
      histories.reduce(
        (sum: number, history: GenerationHistory) => sum + (history.consistencyScore || 0),
        0
      ) /
      totalGenerations;
    const avgFace =
      histories.reduce(
        (sum: number, history: GenerationHistory) => sum + (history.faceSimScore || 0),
        0
      ) /
      totalGenerations;
    const avgGarment =
      histories.reduce(
        (sum: number, history: GenerationHistory) => sum + (history.garmentAccScore || 0),
        0
      ) /
      totalGenerations;
    const avgStyle =
      histories.reduce(
        (sum: number, history: GenerationHistory) => sum + (history.styleMatchScore || 0),
        0
      ) /
      totalGenerations;
    const avgTime =
      histories.reduce(
        (sum: number, history: GenerationHistory) => sum + (history.processingTimeMs || 0),
        0
      ) /
      totalGenerations;
    const totalCost = histories.reduce(
      (sum: number, history: GenerationHistory) => sum + (history.apiCostUsd || 0),
      0
    );

    return {
      totalGenerations,
      averageConsistencyScore: Math.round(avgConsistency * 100) / 100,
      averageFaceScore: Math.round(avgFace * 100) / 100,
      averageGarmentScore: Math.round(avgGarment * 100) / 100,
      averageStyleScore: Math.round(avgStyle * 100) / 100,
      regenerationRate: Math.round((regenerations / totalGenerations) * 100),
      averageProcessingTime: Math.round(avgTime),
      totalCost: Math.round(totalCost * 100) / 100,
    };
  },

  /**
   * Update generation history with user feedback
   */
  async updateGenerationFeedback(
    historyId: string,
    rating: number,
    feedback?: string
  ) {
    return await prisma.generationHistory.update({
      where: { id: historyId },
      data: {
        userRating: rating,
        userFeedback: feedback,
      },
    });
  },
};
