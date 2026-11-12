import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { AppError } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = MESSAGES.VALIDATION_ERROR, details = []) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = MESSAGES.AUTH_UNAUTHORIZED, details = []) {
    super(401, ERROR_CODES.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = MESSAGES.AUTH_FORBIDDEN, details = []) {
    super(403, ERROR_CODES.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = MESSAGES.NOT_FOUND, details = []) {
    super(404, ERROR_CODES.NOT_FOUND, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = [], code = ERROR_CODES.CONFLICT) {
    super(409, code, message, details);
  }
}

export class DailyLimitError extends AppError {
  constructor(message = MESSAGES.DAILY_LIMIT_EXCEEDED, details = []) {
    super(409, ERROR_CODES.DAILY_LIMIT, message, details);
  }
}

export class FutureDateError extends AppError {
  constructor(message = MESSAGES.DATE_FUTURE, details = []) {
    super(422, ERROR_CODES.FUTURE_DATE, message, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = MESSAGES.RATE_LIMIT_EXCEEDED, details = []) {
    super(429, ERROR_CODES.RATE_LIMITED, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = MESSAGES.INTERNAL_ERROR, details = []) {
    super(500, ERROR_CODES.INTERNAL_ERROR, message, details, false);
  }
}
