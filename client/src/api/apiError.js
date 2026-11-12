/**
 * Standardized API client error extracting message and details from backend error envelopes.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {number} [status]
   * @param {Array<{ field: string, message: string }>} [details]
   */
  constructor(message, code = 'INTERNAL_ERROR', status = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
