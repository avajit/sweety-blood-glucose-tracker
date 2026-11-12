import { getRedisClient } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

// In-memory fallback map: Map<userId, Set<jti>>
const memoryStore = new Map();

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/**
 * Token store tracking valid active refresh token JTIs.
 * Supports Redis with in-memory fallback.
 */
export const refreshTokenStore = {
  /**
   * Saves an active refresh token JTI for a user.
   * @param {string} userId
   * @param {string} jti
   */
  async save(userId, jti) {
    const client = getRedisClient();
    if (client) {
      try {
        const key = `rt:${userId}:${jti}`;
        await client.set(key, 'valid', 'EX', SEVEN_DAYS_SECONDS);
        return;
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis save refresh token error; using memory fallback');
      }
    }

    if (!memoryStore.has(userId)) {
      memoryStore.set(userId, new Set());
    }
    memoryStore.get(userId).add(jti);
  },

  /**
   * Validates and consumes (rotates) a refresh token JTI.
   * If JTI is not found, it indicates reuse / theft!
   * @param {string} userId
   * @param {string} jti
   * @returns {Promise<boolean>} True if valid and consumed; False if reused/invalid
   */
  async consume(userId, jti) {
    const client = getRedisClient();
    if (client) {
      try {
        const key = `rt:${userId}:${jti}`;
        const exists = await client.del(key);
        return exists === 1;
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis consume refresh token error; checking memory fallback');
      }
    }

    const set = memoryStore.get(userId);
    if (!set || !set.has(jti)) {
      return false;
    }
    set.delete(jti);
    return true;
  },

  /**
   * Revokes all refresh tokens for a user (used on theft detection or global logout).
   * @param {string} userId
   */
  async revokeAll(userId) {
    const client = getRedisClient();
    if (client) {
      try {
        const keys = await client.keys(`rt:${userId}:*`);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis revokeAll error');
      }
    }
    memoryStore.delete(userId);
  },

  /**
   * Revokes a specific token JTI (e.g. on normal logout).
   * @param {string} userId
   * @param {string} jti
   */
  async revoke(userId, jti) {
    await this.consume(userId, jti);
  },

  /**
   * Clears memory store (used in tests).
   */
  _clearMemory() {
    memoryStore.clear();
  },
};
