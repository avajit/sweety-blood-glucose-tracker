import crypto from 'node:crypto';

/**
 * Middleware that attaches a unique correlation request ID to every incoming request.
 * If X-Request-Id header is provided by upstream reverse proxy, it reuses it; otherwise generates a UUID v4.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim().length > 0
    ? existingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
