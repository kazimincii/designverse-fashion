import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

/**
 * Redis Caching Middleware
 *
 * Provides caching for expensive read operations
 */

// Create Redis client
let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisReady = false;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis cache connection failed after 10 retries');
          return new Error('Redis unavailable');
        }
        return retries * 1000;
      },
    },
  });

  redisClient.on('ready', () => {
    isRedisReady = true;
    console.log('Redis cache connected successfully');
  });

  redisClient.on('error', (err) => {
    console.error('Redis cache error:', err);
    isRedisReady = false;
  });

  redisClient.connect().catch((err) => {
    console.error('Redis cache connection error:', err);
    redisClient = null;
  });
}

/**
 * Cache middleware factory
 *
 * @param ttlSeconds - Time to live in seconds
 * @param keyPrefix - Prefix for cache keys
 */
export function cacheMiddleware(ttlSeconds: number = 300, keyPrefix: string = 'cache') {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if Redis is not available
    if (!redisClient || !isRedisReady) {
      return next();
    }

    // Generate cache key from request URL and user ID
    const userId = (req as any).user?.userId || 'anonymous';
    const cacheKey = `${keyPrefix}:${userId}:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        const parsedData = JSON.parse(cachedData);

        // Send cached response
        return res.json(parsedData);
      }

      console.log(`Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (body: any) {
        // Cache the response
        redisClient!.setEx(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) => {
          console.error('Error caching response:', err);
        });

        // Call original json function
        return originalJson(body);
      } as any;

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching
      next();
    }
  };
}

/**
 * Invalidate cache for a specific pattern
 */
export async function invalidateCache(pattern: string) {
  if (!redisClient || !isRedisReady) {
    return;
  }

  try {
    // Find all keys matching pattern
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Invalidate all cache for a user
 */
export async function invalidateUserCache(userId: string) {
  await invalidateCache(`cache:${userId}:*`);
}

/**
 * Invalidate cache for a specific session
 */
export async function invalidateSessionCache(sessionId: string) {
  await invalidateCache(`*:${sessionId}*`);
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
  if (!redisClient || !isRedisReady) {
    return;
  }

  try {
    await redisClient.flushDb();
    console.log('All cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  if (!redisClient || !isRedisReady) {
    return {
      available: false,
      message: 'Redis not available',
    };
  }

  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();

    return {
      available: true,
      connected: isRedisReady,
      dbSize,
      info: info,
    };
  } catch (error) {
    return {
      available: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeCacheConnection() {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis cache connection closed');
  }
}
