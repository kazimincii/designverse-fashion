import { Router } from 'express';
import { handleReplicateWebhook, webhookHealthCheck } from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/advancedRateLimit';

const router = Router();

/**
 * Webhook Routes
 *
 * Note: These routes do NOT use authentication middleware
 * as they are called by external services with their own verification
 */

// Replicate prediction webhook
router.post('/replicate', webhookLimiter, handleReplicateWebhook);

// Webhook health check
router.get('/health', webhookHealthCheck);

export default router;
