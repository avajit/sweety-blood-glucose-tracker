import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let redisClient = null;
let isConnected = false;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis reconnection attempts exceeded. Operating in cache-degraded mode.');
          return null; // stop retrying
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Connected to Redis');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn({ err: err.message }, 'Redis connection warning — continuing with in-memory / cache bypass');
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    // Attempt initial connect without blocking server startup
    redisClient.connect().catch((err) => {
      isConnected = false;
      logger.warn({ err: err.message }, 'Initial Redis connection failed — cache disabled');
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to initialize Redis client — operating without cache');
    redisClient = null;
  }
}

/**
 * Returns true if Redis is configured and currently connected.
 * @returns {boolean}
 */
export function isRedisAvailable() {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

/**
 * Returns the Redis client instance (or null if unavailable).
 * @returns {Redis | null}
 */
export function getRedisClient() {
  return redisClient;
}

export const redis = redisClient;
