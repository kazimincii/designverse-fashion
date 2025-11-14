import { Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';
import { AIConsistencyEngine } from '../services/aiConsistencyEngine';
import { referenceService } from '../services/referenceService';
import { storageService } from '../services/storageService';
import axios from 'axios';

/**
 * Webhook Controller
 *
 * Handles callbacks from external services like Replicate
 */

/**
 * Verify Replicate webhook signature
 */
function verifyReplicateWebhook(req: Request): boolean {
  const signature = req.headers['x-replicate-signature'] as string;
  const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('REPLICATE_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // In development, allow without verification
  }

  if (!signature) {
    return false;
  }

  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle Replicate prediction webhook
 *
 * This is called when a Replicate prediction completes
 */
export const handleReplicateWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    if (!verifyReplicateWebhook(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { id, status, output, error, metrics } = req.body;

    console.log(`Replicate webhook received: ${id} - ${status}`);

    // Find job by prediction ID
    const job = await prisma.job.findFirst({
      where: {
        OR: [
          { outputPayloadJson: { path: ['predictionId'], equals: id } },
          { inputPayloadJson: { path: ['predictionId'], equals: id } },
        ],
      },
    });

    if (!job) {
      console.warn(`Job not found for prediction ${id}`);
      return res.status(200).json({ received: true, message: 'Job not found' });
    }

    // Update job based on status
    if (status === 'succeeded' && output) {
      await handleSuccessfulPrediction(job.id, output, metrics);
    } else if (status === 'failed') {
      await handleFailedPrediction(job.id, error);
    } else if (status === 'canceled') {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Prediction was canceled',
        },
      });
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle successful prediction
 */
async function handleSuccessfulPrediction(
  jobId: string,
  output: any,
  metrics: any
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        inputPayloadJson: true,
        ownerId: true,
      },
    });

    if (!job) {
      console.error('Job not found:', jobId);
      return;
    }

    const inputPayload = job.inputPayloadJson as any;
    const sessionId = inputPayload.sessionId;

    // Extract image URL from output
    let imageUrl: string;
    if (Array.isArray(output)) {
      imageUrl = output[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output.url) {
      imageUrl = output.url;
    } else {
      console.error('Could not extract image URL from output:', output);
      return;
    }

    // Download and upload to our storage
    console.log('Downloading generated image:', imageUrl);
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    const filename = `webhook_${Date.now()}.png`;
    const storageUrl = await storageService.uploadFile(
      imageBuffer,
      `sessions/${sessionId}/${filename}`
    );

    console.log('Image uploaded to storage:', storageUrl);

    // Calculate consistency score if references were used
    let consistencyScore = null;
    if (inputPayload.characterRefId || inputPayload.garmentRefId || inputPayload.styleRefId) {
      console.log('Calculating consistency score...');

      const [characterRef, garmentRef, styleRef] = await Promise.all([
        inputPayload.characterRefId
          ? referenceService.getCharacterReference(inputPayload.characterRefId)
          : null,
        inputPayload.garmentRefId
          ? referenceService.getGarmentReference(inputPayload.garmentRefId)
          : null,
        inputPayload.styleRefId
          ? referenceService.getStyleReference(inputPayload.styleRefId)
          : null,
      ]);

      consistencyScore = await AIConsistencyEngine.calculateConsistencyScore(
        storageUrl,
        { characterRef, garmentRef, styleRef }
      );

      console.log('Consistency score:', consistencyScore);
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
          webhookProcessed: true,
          metrics,
          consistencyScore: consistencyScore?.overall,
        },
      },
    });

    // Update job
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SUCCEEDED',
        outputPayloadJson: {
          imageUrl: storageUrl,
          photoAssetId: photoAsset.id,
          consistencyScore: consistencyScore ? {
            overall: consistencyScore.overall,
            faceScore: consistencyScore.faceScore,
            garmentScore: consistencyScore.garmentScore,
            styleScore: consistencyScore.styleScore,
          } : null,
          metrics,
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: job.ownerId,
        type: 'PHOTO_SESSION_READY',
        payloadJson: {
          jobId,
          imageUrl: storageUrl,
          photoAssetId: photoAsset.id,
          consistencyScore: consistencyScore?.overall,
        },
      },
    });

    console.log('Job completed successfully via webhook:', jobId);
  } catch (error) {
    console.error('Error handling successful prediction:', error);
    throw error;
  }
}

/**
 * Handle failed prediction
 */
async function handleFailedPrediction(jobId: string, error: any) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: typeof error === 'string' ? error : JSON.stringify(error),
      },
    });

    console.log('Job marked as failed via webhook:', jobId);
  } catch (err) {
    console.error('Error handling failed prediction:', err);
    throw err;
  }
}

/**
 * Health check for webhooks
 */
export const webhookHealthCheck = async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'webhook-handler',
    timestamp: new Date().toISOString(),
  });
};
