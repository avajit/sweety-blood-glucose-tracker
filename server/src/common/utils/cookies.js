import { env } from '../../config/env.js';
import { COOKIE_NAMES } from '../constants/cookieNames.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates secure cookie options for access token.
 * @param {import('express').CookieOptions} [extraOptions={}]
 * @returns {import('express').CookieOptions}
 */
export function getAuthCookieOptions(extraOptions = {}) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: FIFTEEN_MINUTES_MS,
    ...extraOptions,
  };
}

/**
 * Generates secure cookie options for refresh token.
 * @param {import('express').CookieOptions} [extraOptions={}]
 * @returns {import('express').CookieOptions}
 */
export function getRefreshCookieOptions(extraOptions = {}) {
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
 * Sets the refresh token cookie on the response.
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setRefreshTokenCookie(res, token) {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, getRefreshCookieOptions());
}

/**
 * Clears both authentication and refresh token cookies on the response.
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  const clearOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE === 'true',
    path: '/',
  };
  res.clearCookie(COOKIE_NAMES.AUTH_TOKEN, clearOpts);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearOpts);
}
