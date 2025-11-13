import { Router } from 'express';
import multer from 'multer';
import {
  createCharacterReference,
  createGarmentReference,
  createStyleReference,
  autoExtractReference,
  getSessionReferences,
  getCharacterReferences,
  getCharacterReference,
  updateCharacterReference,
  deleteCharacterReference,
  getGarmentReferences,
  updateGarmentReference,
  deleteGarmentReference,
  getStyleReferences,
  updateStyleReference,
  deleteStyleReference,
  getSessionReferenceStats,
  getGenerationHistory,
  getGenerationAnalytics,
  updateGenerationFeedback,
} from '../controllers/referenceController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============================================================
// CHARACTER REFERENCE ENDPOINTS
// ============================================================

/**
 * @route   POST /api/references/character
 * @desc    Create a new character reference
 * @access  Private
 */
router.post(
  '/character',
  authenticate,
  upload.single('image'),
  createCharacterReference
);

/**
 * @route   GET /api/references/character/session/:sessionId
 * @desc    Get all character references for a session
 * @access  Private
 * @query   activeOnly=true (optional)
 */
router.get(
  '/character/session/:sessionId',
  authenticate,
  getCharacterReferences
);

/**
 * @route   GET /api/references/character/:id
 * @desc    Get a specific character reference
 * @access  Private
 */
router.get('/character/:id', authenticate, getCharacterReference);

/**
 * @route   PUT /api/references/character/:id
 * @desc    Update a character reference
 * @access  Private
 */
router.put('/character/:id', authenticate, updateCharacterReference);

/**
 * @route   DELETE /api/references/character/:id
 * @desc    Delete a character reference
 * @access  Private
 */
router.delete('/character/:id', authenticate, deleteCharacterReference);

// ============================================================
// GARMENT REFERENCE ENDPOINTS
// ============================================================

/**
 * @route   POST /api/references/garment
 * @desc    Create a new garment reference
 * @access  Private
 */
router.post(
  '/garment',
  authenticate,
  upload.single('image'),
  createGarmentReference
);

/**
 * @route   GET /api/references/garment/session/:sessionId
 * @desc    Get all garment references for a session
 * @access  Private
 * @query   activeOnly=true (optional)
 */
router.get('/garment/session/:sessionId', authenticate, getGarmentReferences);

/**
 * @route   PUT /api/references/garment/:id
 * @desc    Update a garment reference
 * @access  Private
 */
router.put('/garment/:id', authenticate, updateGarmentReference);

/**
 * @route   DELETE /api/references/garment/:id
 * @desc    Delete a garment reference
 * @access  Private
 */
router.delete('/garment/:id', authenticate, deleteGarmentReference);

// ============================================================
// STYLE REFERENCE ENDPOINTS
// ============================================================

/**
 * @route   POST /api/references/style
 * @desc    Create a new style reference
 * @access  Private
 */
router.post(
  '/style',
  authenticate,
  upload.single('image'),
  createStyleReference
);

/**
 * @route   GET /api/references/style/session/:sessionId
 * @desc    Get all style references for a session
 * @access  Private
 * @query   type=STYLE|LOCATION|LIGHTING|MOOD (optional)
 * @query   activeOnly=true (optional)
 */
router.get('/style/session/:sessionId', authenticate, getStyleReferences);

/**
 * @route   PUT /api/references/style/:id
 * @desc    Update a style reference
 * @access  Private
 */
router.put('/style/:id', authenticate, updateStyleReference);

/**
 * @route   DELETE /api/references/style/:id
 * @desc    Delete a style reference
 * @access  Private
 */
router.delete('/style/:id', authenticate, deleteStyleReference);

// ============================================================
// COMBINED & UTILITY ENDPOINTS
// ============================================================

/**
 * @route   POST /api/references/auto-extract
 * @desc    Auto-extract reference data from an image (doesn't save to DB)
 * @access  Private
 */
router.post(
  '/auto-extract',
  authenticate,
  upload.single('image'),
  autoExtractReference
);

/**
 * @route   GET /api/references/session/:sessionId
 * @desc    Get all references for a session (characters, garments, styles)
 * @access  Private
 * @query   activeOnly=true (optional)
 */
router.get('/session/:sessionId', authenticate, getSessionReferences);

/**
 * @route   GET /api/references/session/:sessionId/stats
 * @desc    Get reference statistics for a session
 * @access  Private
 */
router.get('/session/:sessionId/stats', authenticate, getSessionReferenceStats);

// ============================================================
// GENERATION HISTORY ENDPOINTS
// ============================================================

/**
 * @route   GET /api/references/session/:sessionId/history
 * @desc    Get generation history for a session
 * @access  Private
 * @query   limit=50 (optional)
 */
router.get('/session/:sessionId/history', authenticate, getGenerationHistory);

/**
 * @route   GET /api/references/session/:sessionId/analytics
 * @desc    Get generation analytics for a session
 * @access  Private
 */
router.get(
  '/session/:sessionId/analytics',
  authenticate,
  getGenerationAnalytics
);

/**
 * @route   PUT /api/references/history/:historyId/feedback
 * @desc    Update user feedback for a generation
 * @access  Private
 * @body    { rating: number (1-5), feedback?: string }
 */
router.put(
  '/history/:historyId/feedback',
  authenticate,
  updateGenerationFeedback
);

export default router;
