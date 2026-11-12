import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from './validate.middleware.js';

describe('validate middleware', () => {
  const schema = z.object({
    value: z.number().min(40).max(600),
    slot: z.string(),
  });

  it('populates req.validated and calls next() when body payload is valid', () => {
    const middleware = validate(schema, 'body');
    const req = {
      body: { value: 120, slot: 'MORNING_FASTING' },
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error passed
    expect(req.validated).toEqual(
      expect.objectContaining({
        value: 120,
        slot: 'MORNING_FASTING',
      }),
    );
  });

  it('forwards ZodError to next(err) when body payload is invalid', () => {
    const middleware = validate(schema, 'body');
    const req = {
      body: { value: 20 }, // below min(40) and missing slot
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedError = next.mock.calls[0][0];
    expect(forwardedError).toBeInstanceOf(z.ZodError);
    expect(forwardedError.errors.length).toBeGreaterThan(0);
  });

  it('validates query parameters correctly when target is "query"', () => {
    const querySchema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    });

    const middleware = validate(querySchema, 'query');
    const req = {
      query: { page: '2', limit: '10' },
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validated.page).toBe(2);
    expect(req.validated.limit).toBe(10);
  });
});

