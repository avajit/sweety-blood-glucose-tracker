import { ZodError } from 'zod';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { AppError } from '../errors/AppError.js';
import { mapPrismaError } from '../errors/prismaErrorMapper.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';

/**
 * Universal error handling middleware.
 * Guarantees every single error response strictly matches the { error: { code, message, details } } contract.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandlerMiddleware(err, req, res, _next) {
  // 1. Check for Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: err.errors[0]?.message || MESSAGES.VALIDATION_ERROR,
        details: formattedDetails,
      },
    });
  }

  // 2. Check for Prisma database errors
  const mappedPrismaError = mapPrismaError(err);
  if (mappedPrismaError) {
    return res.status(mappedPrismaError.statusCode).json({
      error: {
        code: mappedPrismaError.code,
        message: mappedPrismaError.message,
        details: mappedPrismaError.details,
      },
    });
  }

  // 3. Check for operational AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 4. Catch-all for unexpected programmer bugs / system failures
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error occurred',
  );

  const isDev = env.NODE_ENV === 'development';
  return res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: MESSAGES.INTERNAL_ERROR,
      details: isDev ? [{ message: err.message, stack: err.stack }] : [],
    },
  });
}
