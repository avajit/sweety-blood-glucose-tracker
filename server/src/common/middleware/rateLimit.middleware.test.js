import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from './rateLimit.middleware.js';
import { RedisRateLimitStore } from './redisRateLimitStore.js';
import * as redisModule from '../../lib/redis.js';

describe('Rate Limit Middleware & Distributed Redis Store (Phase 3)', () => {
  let mockRedis;

  beforeEach(() => {
    mockRedis = {
      multi: vi.fn(),
      pexpire: vi.fn().mockResolvedValue('OK'),
      decr: vi.fn().mockResolvedValue(1),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue(['rl:test:127.0.0.1']),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RedisRateLimitStore unit tests', () => {
    it('initializes with custom prefix and windowMs', () => {
      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'custom:' });
      store.init({ windowMs: 5000 });
      expect(store.prefix).toBe('custom:');
      expect(store.windowMs).toBe(5000);
    });

    it('returns incremented hits and sets pexpire on new key', async () => {
      mockRedis.multi.mockReturnValue({
        incr: vi.fn().mockReturnThis(),
        pttl: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          [null, 1], // totalHits
          [null, -1], // pttl: -1 means no expiry
        ]),
      });

      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'rl:test:' });
      store.init({ windowMs: 10000 });

      const result = await store.increment('client-1');

      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(mockRedis.pexpire).toHaveBeenCalledWith('rl:test:client-1', 10000);
    });

    it('recovers gracefully with fallback hit when Redis throws an exception', async () => {
      mockRedis.multi.mockReturnValue({
        incr: vi.fn().mockReturnThis(),
        pttl: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(new Error('Redis connection lost')),
      });

      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'rl:test:' });
      const result = await store.increment('client-2');

      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('decrements key count in redis', async () => {
      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'rl:' });
      await store.decrement('client-1');
      expect(mockRedis.decr).toHaveBeenCalledWith('rl:client-1');
    });

    it('resets a specific client key in redis', async () => {
      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'rl:' });
      await store.resetKey('client-1');
      expect(mockRedis.del).toHaveBeenCalledWith('rl:client-1');
    });

    it('resets all matching prefix keys in redis', async () => {
      const store = new RedisRateLimitStore({ client: mockRedis, prefix: 'rl:' });
      await store.resetAll();
      expect(mockRedis.keys).toHaveBeenCalledWith('rl:*');
      expect(mockRedis.del).toHaveBeenCalledWith('rl:test:127.0.0.1');
    });
  });

  describe('createRateLimiter enforcement', () => {
    it('bypasses rate limit in test environment by default', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
      const next = vi.fn();
      limiter({}, {}, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('blocks request with 429 when max requests are exceeded with enableInTest: true', async () => {
      vi.spyOn(redisModule, 'getRedisClient').mockReturnValue(null); // use MemoryStore

      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        enableInTest: true,
      });

      const req = { ip: '192.168.1.1', headers: {}, app: { get: vi.fn().mockReturnValue(false) } };
      const res = {
        setHeader: vi.fn(),
        getHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Request 1: allowed
      await new Promise((resolve) => limiter(req, res, resolve));

      // Request 2: allowed
      await new Promise((resolve) => limiter(req, res, resolve));

      // Request 3: blocked with 429
      let allowed = false;
      await new Promise((resolve) => {
        limiter(req, res, () => {
          allowed = true;
          resolve();
        });
        setTimeout(resolve, 50);
      });

      expect(allowed).toBe(false);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'RATE_LIMITED' }),
        })
      );
    });
  });
});
