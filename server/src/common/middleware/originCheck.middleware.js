import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { env } from '../../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Strict CSRF prevention middleware.
 * Runs on every state-mutating HTTP method (POST, PATCH, PUT, DELETE).
 * Enforces byte-for-byte exact equality between the incoming Origin header and CLIENT_ORIGIN.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function originCheckMiddleware(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  // Non-browser clients (curl, mobile, tests) do not send Origin header; allow them.
  if (!origin) {
    return next();
  }

  // Browser requests must strictly match CLIENT_ORIGIN.
  if (origin !== env.CLIENT_ORIGIN) {
    return res.status(403).json({
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: MESSAGES.CSRF_FORBIDDEN || 'Origin not allowed',
        details: [],
      },
    });
  }

  return next();
}
