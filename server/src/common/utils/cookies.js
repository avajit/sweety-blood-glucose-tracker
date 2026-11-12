import { env } from '../../config/env.js';
import { COOKIE_NAMES } from '../constants/cookieNames.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates secure cookie options according to security guidelines.
 * The `secure` attribute strictly follows `COOKIE_SECURE` env flag.
 *
 * @param {import('express').CookieOptions} [extraOptions={}]
 * @returns {import('express').CookieOptions}
 */
export function getAuthCookieOptions(extraOptions = {}) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SEVEN_DAYS_MS,
    ...extraOptions,
  };
}

/**
 * Sets the authentication JWT token cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAMES.AUTH_TOKEN, token, getAuthCookieOptions());
}

/**
 * Clears the authentication token cookie on the response.
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAMES.AUTH_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE === 'true',
    path: '/',
  });
}
