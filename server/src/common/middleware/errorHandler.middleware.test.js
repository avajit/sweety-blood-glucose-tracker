import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandlerMiddleware } from './errorHandler.middleware.js';
import { AppError } from '../errors/AppError.js';
import { NotFoundError } from '../errors/httpErrors.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('errorHandlerMiddleware', () => {
  const req = { id: 'req-123', originalUrl: '/test', method: 'GET' };
  const next = vi.fn();

  it('formats AppError instances with the designated statusCode and error envelope', () => {
    const error = new NotFoundError('Reading not found');
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Reading not found',
        details: [],
      },
    });
  });

  it('formats custom AppError with details array', () => {
    const error = new AppError(400, 'CUSTOM_CODE', 'Custom error message', [{ item: 'invalid' }]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'CUSTOM_CODE',
        message: 'Custom error message',
        details: [{ item: 'invalid' }],
      },
    });
  });

  it('formats ZodError into 400 with VALIDATION_ERROR code and field breakdown in details', () => {
    const testSchema = z.object({
      value: z.number({ required_error: 'Value is required' }),
      slot: z.string({ required_error: 'Slot is required' }),
    });

    let zodError;
    try {
      testSchema.parse({});
    } catch (err) {
      zodError = err;
    }

    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    errorHandlerMiddleware(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR,
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'value' }),
            expect.objectContaining({ field: 'slot' }),
          ]),
        }),
      }),
    );
  });

  it('formats mapped Prisma P2002 unique constraint error into 409 CONFLICT', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.1.0',
      meta: { target: ['email'] },
    });

    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    errorHandlerMiddleware(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.CONFLICT,
        message: MESSAGES.AUTH_EMAIL_TAKEN,
        details: [],
      },
    });
  });

  it('formats generic unhandled Error into 500 INTERNAL_ERROR', () => {
    const error = new Error('Unexpected database socket timeout');
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ERROR_CODES.INTERNAL_ERROR,
          message: MESSAGES.INTERNAL_ERROR,
        }),
      }),
    );
  });
});

