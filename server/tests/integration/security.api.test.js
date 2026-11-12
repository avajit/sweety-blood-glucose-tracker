import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { userRepository } from '../../src/modules/users/user.repository.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('Security & CSRF Origin Check API', () => {
  const app = createApp();
  const request = supertest(app);

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
  });

  describe('Strict Origin Check on mutating requests', () => {
    it('allows mutating request when Origin header exactly matches CLIENT_ORIGIN', async () => {
      const res = await request
        .post('/api/auth/login')
        .set('Origin', env.CLIENT_ORIGIN)
        .send({ email: 'nonexistent@sweety.app', password: 'Password@123' });

      // Origin check passed (fails with 401 on credentials, not 403 origin forbidden)
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('allows mutating request when Origin header is completely absent (non-browser/CLI clients)', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'nonexistent@sweety.app', password: 'Password@123' });

      // Origin check passed without header
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects mutating request with 403 when Origin header does not match CLIENT_ORIGIN', async () => {
      const res = await request
        .post('/api/auth/login')
        .set('Origin', 'https://malicious-cross-origin.com')
        .send({ email: 'test@sweety.app', password: 'Password@123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe(MESSAGES.CSRF_FORBIDDEN);
    });

    it('does not enforce Origin check on GET requests (safe idempotent methods)', async () => {
      const res = await request
        .get('/api/health')
        .set('Origin', 'https://another-domain.com');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Security Headers', () => {
    it('sets standard security headers on responses (Helmet)', async () => {
      const res = await request.get('/api/health');

      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
