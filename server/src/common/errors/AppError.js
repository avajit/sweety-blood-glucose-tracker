/**
 * Base custom application error class.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 422, 500, etc.)
   * @param {string} code - Machine-readable error code from ERROR_CODES
   * @param {string} message - Human-readable error message from MESSAGES
   * @param {Array<any>} [details=[]] - Optional structured details (e.g. Zod validation errors)
   * @param {boolean} [isOperational=true] - Distinguishes expected business errors from unexpected programmer bugs
   */
  constructor(statusCode, code, message, details = [], isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = Array.isArray(details) ? details : [details];
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
