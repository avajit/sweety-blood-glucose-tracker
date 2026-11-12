/**
 * Safely retrieves validated request payload attached by validate middleware.
 *
 * @param {import('express').Request} req
 * @returns {Record<string, any>}
 */
export function getValidated(req) {
  return req.validated ?? {};
}
