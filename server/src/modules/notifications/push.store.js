import crypto from 'node:crypto';
import { getRedisClient } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';

// In-memory fallback map: Map<userId, Map<endpoint, object>>
const memoryStore = new Map();

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Generates deterministic hash from push subscription endpoint.
 * @param {string} endpoint
 * @returns {string}
 */
function hashEndpoint(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

/**
 * Storage adapter for Web Push subscriptions.
 * Seamlessly leverages Redis with in-memory fallback.
 */
export const pushSubscriptionStore = {
  /**
   * Saves a push subscription for an authenticated user.
   * @param {string} userId
   * @param {object} subscription - { endpoint, keys: { p256dh, auth } }
   */
  async save(userId, subscription) {
    const subRecord = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId,
      createdAt: new Date().toISOString(),
    };

    const client = getRedisClient();
    if (client) {
      try {
        const epHash = hashEndpoint(subscription.endpoint);
        const key = `push:sub:${userId}:${epHash}`;
        await client.set(key, JSON.stringify(subRecord), 'EX', THIRTY_DAYS_SECONDS);
        return;
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis push save error; falling back to memory');
      }
    }

    if (!memoryStore.has(userId)) {
      memoryStore.set(userId, new Map());
    }
    memoryStore.get(userId).set(subscription.endpoint, subRecord);
  },

  /**
   * Retrieves all active push subscriptions for a user.
   * @param {string} userId
   * @returns {Promise<Array<object>>}
   */
  async getByUser(userId) {
    const client = getRedisClient();
    if (client) {
      try {
        const pattern = `push:sub:${userId}:*`;
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          const rawSubs = await client.mget(keys);
          return rawSubs
            .filter(Boolean)
            .map((raw) => {
              try {
                return JSON.parse(raw);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
        return [];
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis push getByUser error; falling back to memory');
      }
    }

    const userMap = memoryStore.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values());
  },

  /**
   * Removes a subscription by user and endpoint.
   * @param {string} userId
   * @param {string} endpoint
   */
  async remove(userId, endpoint) {
    const client = getRedisClient();
    if (client) {
      try {
        const epHash = hashEndpoint(endpoint);
        const key = `push:sub:${userId}:${epHash}`;
        await client.del(key);
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis push remove error');
      }
    }

    const userMap = memoryStore.get(userId);
    if (userMap) {
      userMap.delete(endpoint);
    }
  },

  /**
   * Clears in-memory store (for testing).
   */
  _clearMemory() {
    memoryStore.clear();
  },
};

