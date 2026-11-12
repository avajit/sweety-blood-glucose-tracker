import { logger } from '../../lib/logger.js';

/**
 * Distributed Redis Store adapter for express-rate-limit.
 * Implements the express-rate-limit Store interface using atomic ioredis commands.
 */
export class RedisRateLimitStore {
  /**
   * @param {object} [options]
   * @param {import('ioredis').Redis | (() => import('ioredis').Redis | null)} [options.client]
   * @param {string} [options.prefix='rl:']
   */
  constructor({ client, prefix = 'rl:' } = {}) {
    this.clientSource = client;
    this.prefix = prefix;
    this.windowMs = 60 * 1000;
  }

  getClient() {
    if (typeof this.clientSource === 'function') {
      return this.clientSource();
    }
    return this.clientSource;
  }

  init(options) {
    if (options?.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  /**
   * Increments the hit count for a client key and sets TTL if newly created.
   * @param {string} key
   * @returns {Promise<{ totalHits: number, resetTime: Date }>}
   */
  async increment(key) {
    const client = this.getClient();
    if (!client) {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }

    const fullKey = `${this.prefix}${key}`;
    try {
      const multi = client.multi();
      multi.incr(fullKey);
      multi.pttl(fullKey);
      const results = await multi.exec();

      if (!results || results.length < 2) {
        return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
      }

      const totalHits = Number(results[0][1]);
      let pttl = Number(results[1][1]);

      // If key is newly created or without TTL (pttl === -1 or -2)
      if (pttl < 0) {
        await client.pexpire(fullKey, this.windowMs);
        pttl = this.windowMs;
      }

      const resetTime = new Date(Date.now() + Math.max(pttl, 0));
      return { totalHits, resetTime };
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis rate limiter increment error; falling back to pass-through');
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  /**
   * Decrements the hit count for a client key.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async decrement(key) {
    const client = this.getClient();
    if (!client) return;

    const fullKey = `${this.prefix}${key}`;
    try {
      await client.decr(fullKey);
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis rate limiter decrement error');
    }
  }

  /**
   * Resets hit count for a specific client key.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async resetKey(key) {
    const client = this.getClient();
    if (!client) return;

    const fullKey = `${this.prefix}${key}`;
    try {
      await client.del(fullKey);
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis rate limiter resetKey error');
    }
  }

  /**
   * Resets all keys matching the prefix.
   * @returns {Promise<void>}
   */
  async resetAll() {
    const client = this.getClient();
    if (!client) return;

    try {
      const keys = await client.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Redis rate limiter resetAll error');
    }
  }
}
