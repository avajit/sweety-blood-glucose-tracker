import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { pushService } from '../../src/modules/notifications/push.service.js';

describe('Notifications & Web Push API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'test-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  describe('GET /api/notifications/vapid-public-key', () => {
    it('returns 200 with valid VAPID public key when authenticated', async () => {
      const res = await request
        .get('/api/notifications/vapid-public-key')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.publicKey).toBeDefined();
      expect(typeof res.body.data.publicKey).toBe('string');
    });

    it('returns 401 UNAUTHORIZED when no auth cookie is present', async () => {
      const res = await request.get('/api/notifications/vapid-public-key');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/notifications/subscribe', () => {
    it('registers valid subscription and returns 201 Created', async () => {
      const subSpy = vi.spyOn(pushService, 'subscribe').mockResolvedValue(undefined);

      const res = await request
        .post('/api/notifications/subscribe')
        .set('Cookie', [authCookie])
        .send({
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-token',
            keys: {
              p256dh: 'BNcRdreALRFXTkOOUHK18PeW5pXQG985e1pTqC',
              auth: 'tBHItJI5svbpez7KI4CCXg',
            },
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.success).toBe(true);
      expect(subSpy).toHaveBeenCalledWith(testUserId, expect.objectContaining({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-token',
      }));
    });

    it('returns 400 Bad Request when subscription payload is invalid', async () => {
      const res = await request
        .post('/api/notifications/subscribe')
        .set('Cookie', [authCookie])
        .send({ subscription: null });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/notifications/test', () => {
    it('dispatches test notification and returns 200 OK', async () => {
      const testSpy = vi.spyOn(pushService, 'sendTestNotification').mockResolvedValue({ sent: 1, failed: 0 });

      const res = await request
        .post('/api/notifications/test')
        .set('Cookie', [authCookie])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(testSpy).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('POST /api/notifications/unsubscribe', () => {
    it('removes subscription and returns 200 OK', async () => {
      const unsubSpy = vi.spyOn(pushService, 'unsubscribe').mockResolvedValue(undefined);

      const res = await request
        .post('/api/notifications/unsubscribe')
        .set('Cookie', [authCookie])
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/test-sub-token' });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(unsubSpy).toHaveBeenCalledWith(testUserId, 'https://fcm.googleapis.com/fcm/send/test-sub-token');
    });

    it('returns 400 when endpoint is missing', async () => {
      const res = await request
        .post('/api/notifications/unsubscribe')
        .set('Cookie', [authCookie])
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
