import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Advanced Rate Limiting Middleware
 *
 * Provides different rate limits for different types of operations
 */

// Create Redis client for rate limiting (if available)
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis connection failed after 10 retries');
          return new Error('Redis unavailable');
        }
        return retries * 1000; // Exponential backoff
      },
    },
  });

  redisClient.connect().catch((err) => {
    console.error('Redis connection error:', err);
    redisClient = null; // Fallback to memory store
  });
}

/**
 * Create rate limiter with optional Redis store
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  const config: any = {
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  };

  // Use Redis store if available
  if (redisClient) {
    config.store = new RedisStore({
      // @ts-expect-error - RedisStore typing issue with redis v4
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rl:',
    });
  }

  return rateLimit(config);
}

/**
 * Strict rate limiter for AI generation endpoints
 * 10 requests per hour per user
 */
export const aiGenerationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'AI generation limit reached. Please wait before generating more images.',
  skipSuccessfulRequests: false,
});

/**
 * Moderate rate limiter for photo uploads
 * 30 uploads per hour per user
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: 'Upload limit reached. Please wait before uploading more files.',
});

/**
 * Lenient rate limiter for read operations
 * 100 requests per 15 minutes per user
 */
export const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please slow down.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Very strict rate limiter for expensive operations
 * 5 requests per hour per user
 */
export const expensiveLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Operation limit reached. This is an expensive operation, please wait.',
});

/**
 * Rate limiter for authentication attempts
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Rate limiter for webhook endpoints
 * 100 webhooks per minute (global)
 */
export const webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Webhook rate limit exceeded',
});

/**
 * Cleanup function to close Redis connection
 */
export async function closeRateLimitStore() {
  if (redisClient) {
    await redisClient.quit();
  }
}
