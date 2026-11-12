import { ForbiddenError } from '../errors/httpErrors.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

/**
 * Middleware factory restricting endpoint access to specific user roles.
 * Must be preceded by authenticate middleware (req.user must be populated).
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export function authorizeRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(MESSAGES.AUTH_FORBIDDEN));
    }
    next();
  };
}
