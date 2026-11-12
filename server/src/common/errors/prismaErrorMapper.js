import { Prisma } from '@prisma/client';
import { MESSAGES } from '@sweety/shared/constants/messages.js';
import { BadRequestError, ConflictError, NotFoundError } from './httpErrors.js';

/**
 * Maps known Prisma database error codes to appropriate AppError subclasses.
 * @param {Error} error
 * @returns {AppError | null} The mapped AppError or null if not a known Prisma error.
 */
export function mapPrismaError(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target;
      const targetStr = Array.isArray(target) ? target.join(', ') : String(target || '');

      if (targetStr.includes('email')) {
        return new ConflictError(MESSAGES.AUTH_EMAIL_TAKEN);
      }
      return new ConflictError('A record with these details already exists.');
    }
    case 'P2025':
      // Record not found
      return new NotFoundError(MESSAGES.NOT_FOUND);

    case 'P2003':
      // Foreign key constraint failed
      return new BadRequestError('Referenced relation not found.');

    default:
      return null;
  }
}
