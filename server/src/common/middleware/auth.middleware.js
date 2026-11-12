import { COOKIE_NAMES } from '../constants/cookieNames.js';
import { verifyToken } from '../../modules/auth/token.service.js';
import { UnauthorizedError } from '../errors/httpErrors.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

/**
 * Authentication middleware.
 * Verifies the presence and validity of the JWT token (from httpOnly cookie or Authorization header).
 * Sets req.user = { id, email, role } on success.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export function authenticate(req, _res, next) {
  let token = req.cookies?.[COOKIE_NAMES.AUTH_TOKEN];

  // Optional Bearer header fallback for non-browser HTTP clients / testing tools
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) {
    return next(new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch {
    return next(new UnauthorizedError(MESSAGES.AUTH_UNAUTHORIZED));
  }
}
