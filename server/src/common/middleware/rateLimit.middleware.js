import rateLimit, { MemoryStore } from 'express-rate-limit';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { env } from '../../config/env.js';
import { getRedisClient } from '../../lib/redis.js';
import { RedisRateLimitStore } from './redisRateLimitStore.js';

/**
 * Creates a rate limiter instance. Bypassed automatically when running in test environment
 * unless enableInTest is explicitly true.
 * @param {object} [options]
 * @param {number} [options.windowMs=900000] - 15 minutes in ms
 * @param {number} [options.max=300] - Max requests per window
 * @param {string} [options.message] - Custom error message
 * @param {string} [options.prefix='rl:'] - Redis key prefix
 * @param {boolean} [options.enableInTest=false] - Whether to enforce during tests
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter(options = {}) {
  if (env.NODE_ENV === 'test' && !options.enableInTest) {
    return (req, res, next) => next();
  }

  const {
    windowMs = 15 * 60 * 1000,
    max = 300,
    message = MESSAGES.RATE_LIMIT_EXCEEDED,
    prefix = 'rl:global:',
  } = options;

  // Use distributed Redis store when available; fallback gracefully to MemoryStore
  const store = getRedisClient()
    ? new RedisRateLimitStore({ client: getRedisClient, prefix })
    : new MemoryStore();

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message,
          details: [],
        },
      });
    },
  });
}

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  prefix: 'rl:global:',
  message: MESSAGES.RATE_LIMIT_EXCEEDED,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'rl:auth:',
  message: MESSAGES.RATE_LIMIT_AUTH_EXCEEDED,
});
