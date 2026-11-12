import { getRedisClient } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

const DEFAULT_TTL_SECONDS = 60;

/**
 * Cache service providing Redis-backed JSON caching with automatic graceful degradation.
 * When Redis is unavailable or REDIS_URL is unset, all operations degrade to safe no-ops.
 */
export class CacheService {
  /**
   * @param {import('ioredis').Redis | null} [client]
   */
  constructor(client = null) {
    this.client = client;
  }

  /**
   * Resolves the active Redis client instance.
   * @returns {import('ioredis').Redis | null}
   */
  getClient() {
    return this.client || getRedisClient();
  }

  /**
   * Retrieves and deserializes a cached value by key.
   *
   * @param {string} key
   * @returns {Promise<object | null>} Parsed cached JSON or null if missing / Redis unavailable
   */
  async get(key) {
    const client = this.getClient();
    if (!client) {
      return null;
    }

    try {
      const data = await client.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis GET operation failed — falling back to database');
      return null;
    }
  }

  /**
   * Serializes and caches a JSON payload with a time-to-live.
   *
   * @param {string} key
   * @param {object} value
   * @param {number} [ttlSeconds=60]
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const client = this.getClient();
    if (!client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await client.set(key, serialized, 'EX', ttlSeconds);
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis SET operation failed — proceeding without cache write');
    }
  }

  /**
   * Deletes a specific cache key.
   *
   * @param {string} key
   * @returns {Promise<void>}
   */
  async del(key) {
    const client = this.getClient();
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis DEL operation failed');
    }
  }

  /**
   * Invalidates all cached reports for a specific user using the pattern report:{userId}:*.
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async invalidateUserReports(userId) {
    const client = this.getClient();
    if (!client || !userId) {
      return;
    }

    try {
      const pattern = `report:${userId}:*`;
      const keys = await client.keys(pattern);
      if (Array.isArray(keys) && keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      logger.warn({ err: err.message, userId }, 'Redis user report cache invalidation failed');
    }
  }
}

export const cacheService = new CacheService();
