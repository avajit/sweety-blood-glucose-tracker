import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

/**
 * Signs a short-lived access JWT token.
 * @param {{ id: string, email: string, role: string }} payload
 * @param {object} [options]
 * @returns {string} The signed JWT token string
 */
export function signToken(payload, options = {}) {
  return jwt.sign(
    { ...payload, tokenType: 'access' },
    env.JWT_SECRET,
    {
      expiresIn: options.expiresIn || '15m',
    },
  );
}

/**
 * Signs a short-lived access token (15 minutes).
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return signToken(payload, { expiresIn: '15m' });
}

/**
 * Signs a long-lived rotating refresh token (7 days) with unique JTI.
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {{ token: string, jti: string }}
 */
export function signRefreshToken(payload) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role, tokenType: 'refresh', jti },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );
  return { token, jti };
}

/**
 * Verifies a JWT token signature and expiration.
 *
 * @param {string} token - The raw JWT token
 * @returns {{ id: string, email: string, role: string, tokenType?: string, jti?: string }} Decoded payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
