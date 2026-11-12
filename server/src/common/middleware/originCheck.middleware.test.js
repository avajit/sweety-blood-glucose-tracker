import { describe, it, expect, vi } from 'vitest';
import { originCheckMiddleware } from './originCheck.middleware.js';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';

describe('originCheckMiddleware', () => {
  it('calls next() when Origin header is absent on mutating request (e.g. non-browser/curl client)', () => {
    const req = { method: 'POST', headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    originCheckMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when Origin matches CLIENT_ORIGIN exactly', () => {
    const req = {
      method: 'POST',
      headers: { origin: env.CLIENT_ORIGIN },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    originCheckMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds with 403 when Origin does not match CLIENT_ORIGIN', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://malicious-site.com' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    originCheckMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Origin not allowed',
        details: [],
      },
    });
  });

  it('skips originCheck completely for safe GET requests even if Origin is different', () => {
    const req = {
      method: 'GET',
      headers: { origin: 'http://another-site.com' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    originCheckMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('skips originCheck for HEAD and OPTIONS requests', () => {
    const reqHead = { method: 'HEAD', headers: { origin: 'http://other.com' } };
    const nextHead = vi.fn();
    originCheckMiddleware(reqHead, {}, nextHead);
    expect(nextHead).toHaveBeenCalledTimes(1);

    const reqOptions = { method: 'OPTIONS', headers: { origin: 'http://other.com' } };
    const nextOptions = vi.fn();
    originCheckMiddleware(reqOptions, {}, nextOptions);
    expect(nextOptions).toHaveBeenCalledTimes(1);
  });
});

