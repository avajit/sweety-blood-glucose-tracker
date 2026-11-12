import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

/**
 * Signs a JWT token containing authenticated user identity.
 *
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} The signed JWT token string
 */
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verifies a JWT token signature and expiration.
 *
 * @param {string} token - The raw JWT token from auth cookie
 * @returns {{ id: string, email: string, role: string }} Decoded payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
