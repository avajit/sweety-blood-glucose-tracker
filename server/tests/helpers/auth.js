import { signToken } from '../../src/modules/auth/token.service.js';
import { COOKIE_NAMES } from '../../src/common/constants/cookieNames.js';

/**
 * Generates a valid signed JWT for testing.
 * @param {object} [overrides]
 * @returns {string}
 */
export function issueTestToken(overrides = {}) {
  const payload = {
    id: overrides.id || 'test-user-id-1234',
    email: overrides.email || 'patient@sweety.app',
    role: overrides.role || 'PATIENT',
  };
  return signToken(payload);
}

/**
 * Creates a Cookie header string with the authentication token.
 * @param {string} [token]
 * @returns {string} e.g. "token=eyJhbGciOi..."
 */
export function createAuthCookieHeader(token) {
  const authToken = token || issueTestToken();
  return `${COOKIE_NAMES.AUTH_TOKEN}=${authToken}`;
}
