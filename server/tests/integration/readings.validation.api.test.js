import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { readingRepository } from '../../src/modules/readings/reading.repository.js';
import { issueTestToken, createAuthCookieHeader } from '../helpers/auth.js';
import { createMockReading } from '../factories/reading.factory.js';
import { ERROR_CODES } from '@sweety/shared/constants/errorCodes.js';
import { MESSAGES } from '@sweety/shared/constants/messages.js';

describe('Readings Validation API', () => {
  const app = createApp();
  const request = supertest(app);
  const testUserId = 'validation-patient-uuid';
  let authCookie;

  beforeEach(() => {
    vi.restoreAllMocks();
    const token = issueTestToken({ id: testUserId, role: 'PATIENT' });
    authCookie = createAuthCookieHeader(token);
  });

  describe('POST /api/readings validations', () => {
    it('rejects value below 40 with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'MORNING_FASTING',
          value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'value')).toBe(true);
    });

    it('rejects value above 600 with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'MORNING_FASTING',
          value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'value')).toBe(true);
    });

    it('rejects decimal/float value with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'MORNING_FASTING',
          value: 105.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects invalid slot with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-11-10',
          slot: 'MIDNIGHT_SNACK',
          value: 110,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'slot')).toBe(true);
    });

    it('rejects malformed calendar date with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026/11/10',
          slot: 'MORNING_FASTING',
          value: 110,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(res.body.error.details.some((d) => d.field === 'date')).toBe(true);
    });

    it('rejects invalid calendar date like February 30th with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2026-02-30',
          slot: 'MORNING_FASTING',
          value: 110,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects future date with 422 FUTURE_DATE', async () => {
      const res = await request
        .post('/api/readings')
        .set('Cookie', [authCookie])
        .send({
          date: '2099-01-01',
          slot: 'MORNING_FASTING',
          value: 110,
        });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        error: {
          code: ERROR_CODES.FUTURE_DATE,
          message: MESSAGES.DATE_FUTURE,
          details: [],
        },
      });
    });
  });

  describe('PATCH /api/readings/:id validations', () => {
    it('rejects empty payload with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .patch('/api/readings/r-uuid-1')
        .set('Cookie', [authCookie])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects out of range value with 400 VALIDATION_ERROR', async () => {
      const res = await request
        .patch('/api/readings/r-uuid-1')
        .set('Cookie', [authCookie])
        .send({ value: 30 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects future date in patch with 422 FUTURE_DATE', async () => {
      vi.spyOn(readingRepository, 'findById').mockResolvedValue(
        createMockReading({ id: 'r-uuid-future', userId: testUserId }),
      );

      const res = await request
        .patch('/api/readings/r-uuid-future')
        .set('Cookie', [authCookie])
        .send({ date: '2099-12-31' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe(ERROR_CODES.FUTURE_DATE);
    });
  });
});
