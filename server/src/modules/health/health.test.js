import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../app.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';

describe('Health and Application Endpoints', () => {
  const app = createApp();
  const request = supertest(app);

  it('GET /api/health returns 200 OK with liveness status and ISO timestamp', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  it('sets X-Request-Id response header on every request', async () => {
    const res = await request.get('/api/health');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });

  it('preserves existing X-Request-Id header when supplied by client or proxy', async () => {
    const customId = 'trace-test-uuid-999';
    const res = await request.get('/api/health').set('X-Request-Id', customId);

    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('GET /unknown-endpoint returns 404 with standard error envelope', async () => {
    const res = await request.get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: expect.stringContaining('Endpoint GET /api/non-existent-route not found'),
        details: [],
      },
    });
  });
});

