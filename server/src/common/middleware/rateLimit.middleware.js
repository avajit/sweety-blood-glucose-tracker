import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { env } from '../../config/env.js';

/**
 * Creates a rate limiter instance. Bypassed automatically when running in test environment.
 * @param {object} [options]
 * @param {number} [options.windowMs=900000] - 15 minutes in ms
 * @param {number} [options.max=300] - Max requests per window
 * @param {string} [options.message] - Custom error message
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter(options = {}) {
  if (env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const {
    windowMs = 15 * 60 * 1000,
    max = 300,
    message = MESSAGES.RATE_LIMIT_EXCEEDED,
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
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
  message: MESSAGES.RATE_LIMIT_EXCEEDED,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: MESSAGES.RATE_LIMIT_AUTH_EXCEEDED,
});
