import { Request, Response } from 'express';
import { referenceService } from '../services/referenceService';
import {
  extractCharacterReference,
  extractGarmentReference,
  extractStyleReference,
  extractAllReferenceData,
} from '../utils/referenceExtraction';

/**
 * Create a new character reference
 * POST /api/references/character
 */
export const createCharacterReference = async (req: Request, res: Response) => {
  try {
    const { sessionId, name, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!sessionId || !name) {
      return res.status(400).json({ error: 'sessionId and name are required' });
    }

    // Extract reference data from image
    const extractedData = await extractCharacterReference(
      file.buffer,
      file.originalname
    );

    // Create character reference in database
    const charRef = await referenceService.createCharacterReference({
      sessionId,
      name,
      description,
      faceImageUrl: extractedData.faceImageUrl,
      thumbnailUrl: extractedData.thumbnailUrl,
      visualFeatures: extractedData.visualFeatures,
    });

    res.status(201).json({
      success: true,
      data: { characterReference: charRef },
    });
  } catch (error: any) {
    console.error('Error creating character reference:', error);
    res.status(500).json({ error: error.message || 'Failed to create character reference' });
  }
};

/**
 * Create a new garment reference
 * POST /api/references/garment
 */
export const createGarmentReference = async (req: Request, res: Response) => {
  try {
    const { sessionId, name, description, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!sessionId || !name) {
      return res.status(400).json({ error: 'sessionId and name are required' });
    }

    // Extract reference data from image
    const extractedData = await extractGarmentReference(
      file.buffer,
      file.originalname,
      category
    );

    // Create garment reference in database
    const garmentRef = await referenceService.createGarmentReference({
      sessionId,
      name,
      description,
      referenceImageUrl: extractedData.referenceImageUrl,
      thumbnailUrl: extractedData.thumbnailUrl,
      category: extractedData.category,
      colorPalette: extractedData.colorPalette,
      colorNames: extractedData.colorNames,
      primaryColor: extractedData.primaryColor,
    });

    res.status(201).json({
      success: true,
      data: { garmentReference: garmentRef },
    });
  } catch (error: any) {
    console.error('Error creating garment reference:', error);
    res.status(500).json({ error: error.message || 'Failed to create garment reference' });
  }
};

/**
 * Create a new style reference
 * POST /api/references/style
 */
export const createStyleReference = async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      type,
      name,
      description,
      promptTemplate,
      negativePrompt,
      lightingSetup,
      mood,
      cameraAngle,
    } = req.body;
    const file = req.file;

    if (!sessionId || !type || !name || !promptTemplate) {
      return res.status(400).json({
        error: 'sessionId, type, name, and promptTemplate are required',
      });
    }

    let extractedData = null;
    if (file) {
      // Extract reference data from image if provided
      extractedData = await extractStyleReference(
        file.buffer,
        file.originalname,
        type
      );
    }

    // Create style reference in database
    const styleRef = await referenceService.createStyleReference({
      sessionId,
      type,
      name,
      description,
      referenceImageUrl: extractedData?.referenceImageUrl,
      thumbnailUrl: extractedData?.thumbnailUrl,
      promptTemplate,
      negativePrompt,
      colorPalette: extractedData?.colorPalette || [],
      lightingSetup,
      mood,
      cameraAngle,
    });

    res.status(201).json({
      success: true,
      data: { styleReference: styleRef },
    });
  } catch (error: any) {
    console.error('Error creating style reference:', error);
    res.status(500).json({ error: error.message || 'Failed to create style reference' });
  }
};

/**
 * Auto-extract all reference types from an image
 * POST /api/references/auto-extract
 */
export const autoExtractReference = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Extract all possible reference data
    const extractedData = await extractAllReferenceData(
      file.buffer,
      file.originalname
    );

    res.status(200).json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error auto-extracting reference:', error);
    res.status(500).json({ error: error.message || 'Failed to extract reference data' });
  }
};

/**
 * Get all references for a session
 * GET /api/references/session/:sessionId
 */
export const getSessionReferences = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    const references = await referenceService.getSessionReferences(
      sessionId,
      activeOnly
    );

    res.status(200).json({
      success: true,
      data: references,
    });
  } catch (error: any) {
    console.error('Error fetching session references:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch references' });
  }
};

/**
 * Get character references for a session
 * GET /api/references/character/session/:sessionId
 */
export const getCharacterReferences = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    const characters = await referenceService.getCharacterReferences(
      sessionId,
      activeOnly
    );

    res.status(200).json({
      success: true,
      data: { characters },
    });
  } catch (error: any) {
    console.error('Error fetching character references:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch character references' });
  }
};

/**
 * Get a specific character reference
 * GET /api/references/character/:id
 */
export const getCharacterReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const charRef = await referenceService.getCharacterReference(id);

    if (!charRef) {
      return res.status(404).json({ error: 'Character reference not found' });
    }

    res.status(200).json({
      success: true,
      data: { characterReference: charRef },
    });
  } catch (error: any) {
    console.error('Error fetching character reference:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch character reference' });
  }
};

/**
 * Update character reference
 * PUT /api/references/character/:id
 */
export const updateCharacterReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const charRef = await referenceService.updateCharacterReference(id, updateData);

    res.status(200).json({
      success: true,
      data: { characterReference: charRef },
    });
  } catch (error: any) {
    console.error('Error updating character reference:', error);
    res.status(500).json({ error: error.message || 'Failed to update character reference' });
  }
};

/**
 * Delete character reference
 * DELETE /api/references/character/:id
 */
export const deleteCharacterReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await referenceService.deleteCharacterReference(id);

    res.status(200).json({
      success: true,
      message: 'Character reference deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting character reference:', error);
    res.status(500).json({ error: error.message || 'Failed to delete character reference' });
  }
};

/**
 * Get garment references for a session
 * GET /api/references/garment/session/:sessionId
 */
export const getGarmentReferences = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    const garments = await referenceService.getGarmentReferences(
      sessionId,
      activeOnly
    );

    res.status(200).json({
      success: true,
      data: { garments },
    });
  } catch (error: any) {
    console.error('Error fetching garment references:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch garment references' });
  }
};

/**
 * Update garment reference
 * PUT /api/references/garment/:id
 */
export const updateGarmentReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const garmentRef = await referenceService.updateGarmentReference(id, updateData);

    res.status(200).json({
      success: true,
      data: { garmentReference: garmentRef },
    });
  } catch (error: any) {
    console.error('Error updating garment reference:', error);
    res.status(500).json({ error: error.message || 'Failed to update garment reference' });
  }
};

/**
 * Delete garment reference
 * DELETE /api/references/garment/:id
 */
export const deleteGarmentReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await referenceService.deleteGarmentReference(id);

    res.status(200).json({
      success: true,
      message: 'Garment reference deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting garment reference:', error);
    res.status(500).json({ error: error.message || 'Failed to delete garment reference' });
  }
};

/**
 * Get style references for a session
 * GET /api/references/style/session/:sessionId
 */
export const getStyleReferences = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const type = req.query.type as any;
    const activeOnly = req.query.activeOnly === 'true';

    const styles = await referenceService.getStyleReferences(
      sessionId,
      type,
      activeOnly
    );

    res.status(200).json({
      success: true,
      data: { styles },
    });
  } catch (error: any) {
    console.error('Error fetching style references:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch style references' });
  }
};

/**
 * Update style reference
 * PUT /api/references/style/:id
 */
export const updateStyleReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const styleRef = await referenceService.updateStyleReference(id, updateData);

    res.status(200).json({
      success: true,
      data: { styleReference: styleRef },
    });
  } catch (error: any) {
    console.error('Error updating style reference:', error);
    res.status(500).json({ error: error.message || 'Failed to update style reference' });
  }
};

/**
 * Delete style reference
 * DELETE /api/references/style/:id
 */
export const deleteStyleReference = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await referenceService.deleteStyleReference(id);

    res.status(200).json({
      success: true,
      message: 'Style reference deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting style reference:', error);
    res.status(500).json({ error: error.message || 'Failed to delete style reference' });
  }
};

/**
 * Get reference statistics for a session
 * GET /api/references/session/:sessionId/stats
 */
export const getSessionReferenceStats = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const stats = await referenceService.getSessionReferenceStats(sessionId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching session reference stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reference statistics' });
  }
};

/**
 * Get generation history for a session
 * GET /api/references/session/:sessionId/history
 */
export const getGenerationHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await referenceService.getGenerationHistory(sessionId, limit);

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error: any) {
    console.error('Error fetching generation history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch generation history' });
  }
};

/**
 * Get generation analytics for a session
 * GET /api/references/session/:sessionId/analytics
 */
export const getGenerationAnalytics = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const analytics = await referenceService.getGenerationAnalytics(sessionId);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error fetching generation analytics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch generation analytics' });
  }
};

/**
 * Update generation feedback
 * PUT /api/references/history/:historyId/feedback
 */
export const updateGenerationFeedback = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const history = await referenceService.updateGenerationFeedback(
      historyId,
      rating,
      feedback
    );

    res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (error: any) {
    console.error('Error updating generation feedback:', error);
    res.status(500).json({ error: error.message || 'Failed to update feedback' });
  }
};
